import type { FileData } from "@/types/file-data";
import path from "node:path";

export interface IElectronAPI {
  onRequestNewFile: (callback: () => void) => void;
  openFile: () => Promise<FileData | null>;
  onFileOpened: (callback: (fileData: FileData) => void) => void;
  saveFile: (path: FileData["path"], content: string) => void;
  onRequestSave: (callback: () => void) => void;
  onFileSaved: (callback: (data: FileData) => void) => void;
  onRequestClose: (callback: () => void) => void;
  warnBeforeClosing: () => Promise<
    "show_save_dialog" | "close_without_saving" | "cancel"
  >;
  onRequestPlay: (callback: () => void) => void;
  onRequestPause: (callback: () => void) => void;
  onRequestPlayVisuals: (callback: () => void) => void;
  removeAllListeners: () => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
