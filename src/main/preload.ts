import { IPCEvents } from "../ipc-api";
import { contextBridge, ipcRenderer } from "electron";
import type { ElectronAPI } from "../ipc-api";

const electronAPI: ElectronAPI = {
  upload: (uploadTo) => {
    return ipcRenderer.invoke(IPCEvents.Upload, uploadTo);
  },
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
