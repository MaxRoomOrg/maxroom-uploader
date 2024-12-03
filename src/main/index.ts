import { Logger } from "./logger";
import { PlatformHandlers } from "./utils";
import { IPCEvents } from "../ipc-api";
import { app, BrowserWindow, ipcMain } from "electron";
import { chromium } from "playwright-chromium";
import { join, resolve } from "path";
import type { Platform } from "./utils";

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
  win.maximize();
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

  ipcMain.handle(IPCEvents.Upload, async (_event, platforms: Platform[]) => {
    // Ref: https://playwright.dev/docs/api/class-browsertype#browser-type-launch-persistent-context
    const userDataDir = join(app.getPath("userData"), "playwright"); // Directory where session data will be stored
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      channel: "chrome", // Uses the Chrome browser installed on the user's system instead of Playwright's installed Chromium.
      // Disables browser automation detection features, preventing websites from identifying Playwright-controlled browsers
      args: ["--disable-blink-features=AutomationControlled"], // Ref: https://stackoverflow.com/a/78790595 and https://github.com/microsoft/playwright/issues/24374#issuecomment-1648279814
    });

    // Determine the video path | // when we import video we get hashed filename (e.g: cf14a8de162eb0c7a716.mp4) which cannot be used, because to upload the video to youtube or any platform we need exact path of file.
    const video = join(
      app.isPackaged === true ? process.resourcesPath : app.getAppPath(),
      "src",
      "assets",
      "video.mp4",
    );

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

  window.on("closed", () => {
    // Remove event listeners
    window.removeAllListeners();
    // Remove listners and handlers
    ipcMain.removeAllListeners(); // To handle errors like: Error: Attempted to register a second handler for 'get-folder-path' in macOS
    ipcMain.removeHandler(IPCEvents.Upload);
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
