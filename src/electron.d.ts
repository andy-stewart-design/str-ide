import type { FileData } from "@/types/file-data";
import path from "node:path";

export interface IElectronAPI {
  onRequestNewFile: (callback: () => void) => void;
  onFileOpened: (callback: (fileData: FileData) => void) => void;
  openFile: () => Promise<FileData | null>;
  onRequestSave: (
    callback: () => { path: FileData["path"]; content: string } | null
  ) => void;
  onFileSaved: (callback: (data: FileData) => void) => void;
  onRequestClose: (callback: () => void) => void;
  onRequestPlay: (callback: () => void) => void;
  onRequestPause: (callback: () => void) => void;
  removeAllListeners: () => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
