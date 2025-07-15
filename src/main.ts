import { app, BrowserWindow, dialog, ipcMain } from "electron";
import path from "node:path";
import { readFileSync } from "node:fs";
import started from "electron-squirrel-startup";
import { createSystemMenu } from "./utils/system-menu";

if (started) app.quit();

type OpenedFile = { canceled: false; path: string; contents: string };
type CanceledOpenedFile = { canceled: true };

async function handleFileOpen(): Promise<OpenedFile | CanceledOpenedFile> {
  const { canceled, filePaths } = await dialog.showOpenDialog({});
  if (canceled) return { canceled } as const;
  return {
    canceled,
    path: filePaths[0],
    contents: readFileSync(filePaths[0], "utf-8"),
  } as const;
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
