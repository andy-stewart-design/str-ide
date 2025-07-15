type FileData = { path: string; contents: string };
type OpenedFile = FileData & { canceled: false };
type OpenedFile = { canceled: false; path: string; contents: string };
type CanceledOpenedFile = { canceled: true };

export interface IElectronAPI {
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
  onUpdateCounter: (cb: (val: number) => void) => void;
  openFile: () => Promise<OpenedFile | CanceledOpenedFile>;
  saveFile: (fileData: FileData) => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
