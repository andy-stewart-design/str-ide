import { contextBridge, ipcRenderer } from "electron";
import type { FileData } from "./types/file-data";

contextBridge.exposeInMainWorld("electronAPI", {
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
  onUpdateCounter: (cb: (val: number) => void) => {
    ipcRenderer.on("update-counter", (_event, val: number) => cb(val));
  },
  onFileOpened: (callback: (fileData: FileData) => void) => {
    ipcRenderer.on("file-opened", (_event, fileData: FileData) =>
      callback(fileData)
    );
  },
  openFile: (): Promise<FileData | null> => {
    return ipcRenderer.invoke("open-file-dialog");
  },
  removeFileOpenedListener: () => {
    ipcRenderer.removeAllListeners("file-opened");
  },
});
