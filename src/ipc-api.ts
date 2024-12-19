import type { VideoDetails } from "./schemas";
import type { MediaType, Platform } from "./utils";
import type { OpenDialogReturnValue } from "electron";

export const IPCEvents = {
  Upload: "upload",
  SelectMedia: "select-media",
  OpenBrowser: "open-browser",
  DownloadMedia: "download-media",
} as const;

export interface ElectronAPI {
  upload: (platforms: Platform[], video: VideoDetails) => Promise<void>;
  selectMedia: (mediaType: MediaType) => Promise<OpenDialogReturnValue>;
  openBrowser: () => Promise<void>;
  downloadMedia: (video: VideoDetails) => Promise<string[]>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
