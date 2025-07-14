export interface IElectronAPI {
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
  onUpdateCounter: (cb: (val: number) => void) => void;
  openFile: () => Promise<{ canceled: boolean; path?: string | undefined }>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
