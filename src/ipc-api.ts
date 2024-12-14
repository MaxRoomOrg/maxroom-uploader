import type { VideoDetails } from "./schemas";
import type { MediaType, Platform } from "./utils";
import type { OpenDialogReturnValue } from "electron";

export const IPCEvents = {
  Upload: "upload",
  SelectMedia: "select-media",
  OpenBrowser: "open-browser",
} as const;

export interface ElectronAPI {
  upload: (platforms: Platform[], video: VideoDetails) => Promise<void>;
  selectMedia: (mediaType: MediaType) => Promise<OpenDialogReturnValue>;
  openBrowser: () => Promise<void>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
