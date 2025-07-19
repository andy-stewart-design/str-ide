import type { FileData } from "./types/file-data";

export interface IElectronAPI {
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
  onUpdateCounter: (cb: (val: number) => void) => void;
  onFileOpened: (callback: (fileData: FileData) => void) => void;
  openFile: () => Promise<FileData | null>;
  removeFileOpenedListener: () => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
