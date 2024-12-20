import { Logger } from "./logger";
import { PlatformHandlers } from "./utils";
import { IPCEvents } from "../ipc-api";
import { MediaType } from "../utils";
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import fetch from "node-fetch";
import { chromium } from "playwright-chromium";
import { createWriteStream } from "fs";
import { join, resolve } from "path";
import { pipeline } from "stream/promises";
import type { VideoDetails } from "../schemas";
import type { Platform } from "../utils";
import type { FileFilter, OpenDialogReturnValue } from "electron";

export async function downloadMedia(url: string, maxroomID: string) {
  const response = await fetch(url);

  let downloadPath = "";

  if (response.body !== null) {
    /* Since the downloaded file requires an extension to be recognized and supported by platforms, and
    the file isn't downloading with its extension automatically, we extract the extension from the 
    URL itself. This step ensures that the file is saved with a proper extension, allowing it to be
    supported and opened correctly on any platform. */
    const parts = response.url.split(".");
    const fileExtension = parts[parts.length - 1];
    downloadPath = join(app.getPath("downloads"), `${maxroomID}.${fileExtension}`);

    // Create a write stream to efficiently save the downloaded file
    const fileStream = createWriteStream(downloadPath);
    // pipeline() streams data chunk by chunk, efficiently transferring from source to destination
    await pipeline(response.body, fileStream);
  }
  return downloadPath;
}

// Ref: https://www.electronjs.org/docs/latest/tutorial/launch-app-from-url-in-another-app
function setupProtocol(): void {
  if (process.defaultApp === true && process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("maxroom-uploader", process.execPath, [resolve(process.argv[1])]);
  } else {
    app.setAsDefaultProtocolClient("maxroom-uploader");
  }
}

// Ref: https://www.electronjs.org/docs/tutorial/quick-start#create-the-main-script-file
async function createWindow(): Promise<BrowserWindow> {
  // Creating a browser window
  const win = new BrowserWindow({
    title: "MaxRoom Uploader", // Ref: https://github.com/electron/electron/blob/main/docs/api/structures/browser-window-options.md?inline
    width: 400,
    height: 850,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
    },
  });

  // Ref: https://www.electronjs.org/docs/latest/tutorial/launch-app-from-url-in-another-app#windows-code
  const gotTheLock = app.requestSingleInstanceLock();
  if (gotTheLock === false) {
    app.quit();
  } else {
    app.on("second-instance", () => {
      // Someone tried to run a second instance, we should focus our window.
      if (win.isMinimized() === true) {
        win.restore();
      }
      win.focus();
    });
  }

  // Load index.html
  await win.loadFile("./dist/renderer/index.html");
  return win;
}

async function setUpElectronApp(): Promise<void> {
  // Set up sample protocol for instance trigger from URLs.
  setupProtocol();

  // Create bowser window once the electron app is initialized
  await app.whenReady();
  const window = await createWindow();

  const closeApp = () => {
    if (process.platform !== "darwin") {
      /**
       * The action is no-op on macOS due to the OS' behavior (https://support.apple.com/en-ca/guide/mac-help/mchlp2469/mac)
       * On macOS it is common for applications and their menu bar to stay active until the user quits explicitly with Cmd + Q
       */
      app.quit();
    }
  };

  // Quit the application when it no longer has any open windows
  app.on("window-all-closed", closeApp);

  // Create a new browser window only when the application has no visible windows being activated
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      // On macOS it's common to re-create a window in the app when the dock icon is clicked and there are no other windows open.
      createWindow().catch((err: unknown) => {
        throw err;
      });
    }
  });

  // Graceful shutdown | Won't run in Windows OS
  process.once("SIGUSR2", () => {
    closeApp();
    process.kill(process.pid, "SIGUSR2");
  });

  ipcMain.handle(IPCEvents.Upload, async (_event, platforms: Platform[], video: VideoDetails) => {
    // Ref: https://playwright.dev/docs/api/class-browsertype#browser-type-launch-persistent-context
    const userDataDir = join(app.getPath("userData"), "playwright"); // Directory where session data will be stored
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      channel: "chrome", // Uses the Chrome browser installed on the user's system instead of Playwright's installed Chromium.
      // Disables browser automation detection features, preventing websites from identifying Playwright-controlled browsers
      args: ["--disable-blink-features=AutomationControlled"], // Ref: https://stackoverflow.com/a/78790595 and https://github.com/microsoft/playwright/issues/24374#issuecomment-1648279814
      // This makes the browser opens in full screen mode, taking the dimension of the screen itself and the pages opened in the browser takes full viewport (of browser).
      viewport: null, // Ref: https://stackoverflow.com/a/75978207
    });

    const uploadPromises: Promise<void>[] = platforms.map((ele) => {
      return PlatformHandlers[ele](context, [video]);
    });

    try {
      // Run all uploads in parallel
      await Promise.all(uploadPromises);
      await context.close({ reason: "Upload completed." });
    } catch (error) {
      console.log(error);
      await context.close({ reason: "Error while uploading." });
    }
  });

  ipcMain.handle(IPCEvents.SelectMedia, async (_event, mediaType: MediaType): Promise<OpenDialogReturnValue> => {
    // Ref: https://www.electronjs.org/docs/latest/api/dialog#dialogshowopendialogwindow-options
    let filters: FileFilter[];
    if (mediaType === MediaType.Image) {
      filters = [{ name: "Images", extensions: ["jpg", "png", "gif", "webp", "jpeg"] }];
    } else {
      filters = [{ name: "Movies", extensions: ["mkv", "avi", "mp4", "webm"] }];
    }

    // Ref: https://www.electronjs.org/docs/latest/api/dialog#dialogshowopendialogsyncwindow-options
    const output = await dialog.showOpenDialog({
      filters,
      properties: ["openFile"], // "openFile" allow us to select only files
    });

    return output;
  });

  ipcMain.handle(IPCEvents.OpenBrowser, async () => {
    // Ref: https://playwright.dev/docs/api/class-browsertype#browser-type-launch-persistent-context
    const userDataDir = join(app.getPath("userData"), "playwright"); // Directory where session data will be stored
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      channel: "chrome", // Uses the Chrome browser installed on the user's system instead of Playwright's installed Chromium.
      // Disables browser automation detection features, preventing websites from identifying Playwright-controlled browsers
      args: ["--disable-blink-features=AutomationControlled"], // Ref: https://stackoverflow.com/a/78790595 and https://github.com/microsoft/playwright/issues/24374#issuecomment-1648279814
      // This makes the browser opens in full screen mode, taking the dimension of the screen itself and the pages opened in the browser takes full viewport (of browser).
      viewport: null, // Ref: https://stackoverflow.com/a/75978207
    });

    // When the browser launches, it automatically opens a default blank page.
    const page = context.pages()[0];

    try {
      //When the browser launches, it automatically opens a default blank page (about:blank), so we redirect the user to maxroom.co for a better experience.
      await page.goto("https://maxroom.co/");
    } catch (error) {
      console.log(error);
      await context.close({ reason: "Error while opening browser." });
    }
  });

  ipcMain.handle(IPCEvents.DownloadMedia, async (_event, video: VideoDetails) => {
    // Download the video and image, if maxroom video id is provided
    let paths: string[] = [];
    if (typeof video.video === "string" && typeof video.image === "string" && typeof video.maxroomID === "string") {
      paths = await Promise.all([
        downloadMedia(video.video, video.maxroomID),
        downloadMedia(video.image, video.maxroomID),
      ]);
    }
    return paths;
  });

  window.on("closed", () => {
    // Remove event listeners
    window.removeAllListeners();
    // Remove listners and handlers
    ipcMain.removeAllListeners(); // To handle errors like: Error: Attempted to register a second handler for 'get-folder-path' in macOS
    ipcMain.removeHandler(IPCEvents.Upload);
    ipcMain.removeHandler(IPCEvents.SelectMedia);
    ipcMain.removeHandler(IPCEvents.OpenBrowser);
    ipcMain.removeHandler(IPCEvents.DownloadMedia);
  });
}

setUpElectronApp().catch((error: unknown) => {
  if (error instanceof Error) {
    Logger.log({
      level: "error",
      message: error.message,
    });
  }
});
