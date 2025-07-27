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
  saveFile: (path: FileData["path"], content: string) => {
    return ipcRenderer.invoke("save-file", path, content);
  },
  onRequestSave: (callback: () => void) => {
    ipcRenderer.on("request-save", callback);
  },
  onFileSaved: (callback: (data: any) => void) => {
    ipcRenderer.on("file-saved", (_, fileData: FileData) => callback(fileData));
  },
  onRequestClose: (callback: () => void) => {
    ipcRenderer.on("request-close", callback);
  },
  warnBeforeClosing: (): Promise<
    "show_save_dialog" | "close_without_saving" | "cancel"
  > => {
    return ipcRenderer.invoke("warn-before-closing");
  },
  onRequestPlay: (callback: () => void) => {
    ipcRenderer.on("request-play", callback);
  },
  onRequestPause: (callback: () => void) => {
    ipcRenderer.on("request-pause", callback);
  },
  onRequestPlayVisuals: (callback: () => void) => {
    ipcRenderer.on("request-play-visuals", callback);
  },
  onRequestPauseVisuals: (callback: () => void) => {
    ipcRenderer.on("request-pause-visuals", callback);
  },
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners("request-new-file");
    ipcRenderer.removeAllListeners("file-opened");
    ipcRenderer.removeAllListeners("request-save");
    ipcRenderer.removeAllListeners("file-saved");
    ipcRenderer.removeAllListeners("request-close");
    ipcRenderer.removeAllListeners("request-play");
    ipcRenderer.removeAllListeners("request-pause");
    ipcRenderer.removeAllListeners("request-play-visuals");
    ipcRenderer.removeAllListeners("request-pause-visuals");
  },
});
