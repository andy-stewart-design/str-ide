import { contextBridge, ipcRenderer } from "electron";
import type { FileData } from "@/types/file-data";

contextBridge.exposeInMainWorld("electronAPI", {
  openFile: (): Promise<FileData | null> => {
    return ipcRenderer.invoke("open-file-dialog");
  },
  onFileOpened: (callback: (fileData: FileData) => void) => {
    ipcRenderer.on("file-opened", (_, fileData: FileData) =>
      callback(fileData)
    );
  },
  removeFileOpenedListener: () => {
    ipcRenderer.removeAllListeners("file-opened");
  },
  onRequestSave: (callback: () => { path: string; content: string }) => {
    ipcRenderer.on("request-save", () => {
      const { path, content } = callback();
      return ipcRenderer.invoke("save-file", path, content);
    });
  },
});
