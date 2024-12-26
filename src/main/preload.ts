import { IPCEvents } from "../ipc-api";
import { contextBridge, ipcRenderer } from "electron";
import type { ElectronAPI } from "../ipc-api";

const electronAPI: ElectronAPI = {
  upload: (uploadTo, video) => {
    return ipcRenderer.invoke(IPCEvents.Upload, uploadTo, video);
  },
  selectMedia: (mediaType: string) => {
    return ipcRenderer.invoke(IPCEvents.SelectMedia, mediaType);
  },
  openBrowser: () => {
    return ipcRenderer.invoke(IPCEvents.OpenBrowser);
  },
  downloadMedia: (video) => {
    return ipcRenderer.invoke(IPCEvents.DownloadMedia, video);
  },
  onMessage: (callback) => {
    return ipcRenderer.on(IPCEvents.OnMessage, callback);
  },
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
