import { contextBridge, ipcRenderer } from "electron";

type FileData = { path: string; contents: string };

contextBridge.exposeInMainWorld("electronAPI", {
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
  onUpdateCounter: (cb: (val: number) => void) => {
    ipcRenderer.on("update-counter", (_event, val: number) => cb(val));
  },
  openFile: () => ipcRenderer.invoke("dialog:openFile"),
  saveFile: (fileData: FileData) => ipcRenderer.send("save-file", fileData),
});
