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
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
