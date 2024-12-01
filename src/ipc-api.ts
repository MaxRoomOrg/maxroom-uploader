export const IPCEvents = {
  Upload: "upload",
} as const;

export interface ElectronAPI {
  upload: (uploadTo: string) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
