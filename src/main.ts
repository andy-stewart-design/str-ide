import {
  app,
  BrowserWindow,
  dialog,
  globalShortcut,
  ipcMain,
  screen,
  systemPreferences,
} from "electron";
import started from "electron-squirrel-startup";
import path from "node:path";
import { readFileSync, writeFileSync, type WriteFileOptions } from "node:fs";
import { createSystemMenu } from "@/utils/system-menu";
import type { FileData } from "@/types/file-data";

if (started) app.quit();

async function openFile() {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (!focusedWindow) return;

  try {
    const result = await dialog.showOpenDialog({});

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const filePath = result.filePaths[0];
    const fileContent = readFileSync(filePath, "utf-8");
    const fileName = path.basename(filePath);

    return {
      path: filePath,
      name: fileName,
      content: fileContent,
    };
  } catch (error) {
    const isError = error && typeof error === "object" && "message" in error;
    const message = isError ? error.message : "Unknown error";
    console.error("Error opening file:", error);
    dialog.showErrorBox("Error", `Failed to open file: ${message}`);
  }
}

async function saveFile(
  _path: FileData["path"],
  content: string,
  encoding: WriteFileOptions = "utf-8"
) {
  try {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (!focusedWindow) return;

    let newFilePath: string | null = _path;
    let fileName: string | null = null;

    if (_path) {
      fileName = path.basename(_path);
      writeFileSync(_path, content, encoding);
    } else {
      const { filePath, canceled } = await dialog.showSaveDialog({
        defaultPath: "untitled.std",
      });
      if (!canceled) {
        writeFileSync(filePath, content, encoding);
        newFilePath = filePath;
        fileName = path.basename(filePath);
      }
    }
    if (newFilePath && fileName) {
      focusedWindow.webContents.send("file-saved", {
        path: newFilePath,
        name: fileName,
        content,
      });
    }
  } catch (error) {
    console.error("Error saving file:", error);
    throw error;
  }
}

async function showSaveBeforeCloseWarning() {
  const filename = "renderer.ts";
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (!focusedWindow) return;

  const actions = {
    Save: "show_save_dialog",
    "Don't Save": "close_without_saving",
    Cancel: "cancel",
  };

  const result = await dialog.showMessageBox(focusedWindow, {
    type: "warning",
    buttons: Object.keys(actions),
    defaultId: 0,
    cancelId: 2,
    title: "Unsaved Changes",
    message: `Do you want to save the changes you made to ${filename}?`,
    detail: "Your changes will be lost if you don't save them.",
  });

  return Object.values(actions)[result.response];
}

const createWindow = () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width } = primaryDisplay.workAreaSize;

  const mainWindow = new BrowserWindow({
    width: Math.floor(width * 0.75),
    height: Math.floor(((width * 0.75) / 3) * 2),
    // remove the default titlebar
    titleBarStyle: "hidden",
    // expose window controls in Windows/Linux
    ...(process.platform !== "darwin" ? { titleBarOverlay: true } : {}),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    backgroundColor: "#0c0c0c",
  });

  createSystemMenu();

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    const slug = `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`;
    mainWindow.loadFile(path.join(__dirname, slug));
  }
};

app.whenReady().then(() => {
  // const hasCameraPermission =
  //   systemPreferences.getMediaAccessStatus("camera") === "granted";
  // console.log({ hasCameraPermission });

  ipcMain.handle("warn-before-closing", showSaveBeforeCloseWarning);
  ipcMain.handle("open-file-dialog", openFile);
  ipcMain.handle("save-file", (_, path: string, content: string) =>
    saveFile(path, content)
  );
  createWindow();

  globalShortcut.register("Alt+.", () => {
    BrowserWindow.getFocusedWindow()?.webContents.send("request-pause");
  });
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

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

export { openFile, saveFile };
