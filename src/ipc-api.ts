import type { Platform } from "./main/utils";

export const IPCEvents = {
  Upload: "upload",
} as const;

export interface ElectronAPI {
  upload: (platforms: Platform[]) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
