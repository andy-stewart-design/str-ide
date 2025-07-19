import type { FileData } from "@/types/file-data";

export interface IElectronAPI {
  onFileOpened: (callback: (fileData: FileData) => void) => void;
  openFile: () => Promise<FileData | null>;
  removeFileOpenedListener: () => void;
  onRequestSave: (callback: () => { path: string; content: string }) => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
