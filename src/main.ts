import { app, BrowserWindow, dialog, ipcMain, IpcMainEvent } from "electron";
import path from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
import started from "electron-squirrel-startup";
import { createSystemMenu } from "./utils/system-menu";

if (started) app.quit();

type FileData = { path: string; contents: string };
type OpenedFile = FileData & { canceled: false };
type CanceledOpenedFile = { canceled: true };

async function handleFileOpen(): Promise<OpenedFile | CanceledOpenedFile> {
  const { canceled, filePaths } = await dialog.showOpenDialog({});
  if (canceled) return { canceled } as const;
  return {
    canceled,
    path: filePaths[0],
    contents: readFileSync(filePaths[0], "utf-8"),
  };
}

async function handleSaveFile(_event: IpcMainEvent, fileData: FileData) {
  writeFileSync(fileData.path, fileData.contents, "utf-8");
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    // remove the default titlebar
    titleBarStyle: "hidden",
    // expose window controls in Windows/Linux
    ...(process.platform !== "darwin" ? { titleBarOverlay: true } : {}),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  createSystemMenu(mainWindow);

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    const slug = `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`;
    mainWindow.loadFile(path.join(__dirname, slug));
  }
};

app.whenReady().then(() => {
  ipcMain.handle("dialog:openFile", handleFileOpen);
  ipcMain.on("save-file", handleSaveFile);
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

export { handleFileOpen };
