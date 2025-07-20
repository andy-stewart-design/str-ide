import { contextBridge, ipcRenderer } from "electron";
import type { FileData } from "@/types/file-data";

contextBridge.exposeInMainWorld("electronAPI", {
  onRequestNewFile: (callback: () => void) => {
    ipcRenderer.on("request-new-file", callback);
  },
  openFile: (): Promise<FileData | null> => {
    return ipcRenderer.invoke("open-file-dialog");
  },
  onFileOpened: (callback: (fileData: FileData) => void) => {
    ipcRenderer.on("file-opened", (_, fileData: FileData) =>
      callback(fileData)
    );
  },
  onRequestSave: (
    callback: () => { path: FileData["path"]; content: string } | null
  ) => {
    ipcRenderer.on("request-save", () => {
      const result = callback();
      if (!result) return;
      const { path, content } = result;
      return ipcRenderer.invoke("save-file", path, content);
    });
  },
  onFileSaved: (callback: (data: any) => void) => {
    ipcRenderer.on("file-saved", (_, fileData: FileData) => callback(fileData));
  },
  onRequestClose: (callback: () => void) => {
    ipcRenderer.on("request-close", callback);
  },
  onRequestPlay: (callback: () => void) => {
    ipcRenderer.on("request-play", callback);
  },
  onRequestPause: (callback: () => void) => {
    ipcRenderer.on("request-pause", callback);
  },
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners("request-new-file");
    ipcRenderer.removeAllListeners("file-opened");
    ipcRenderer.removeAllListeners("request-save");
    ipcRenderer.removeAllListeners("file-saved");
    ipcRenderer.removeAllListeners("request-close");
    ipcRenderer.removeAllListeners("request-play");
    ipcRenderer.removeAllListeners("request-pause");
  },
});
