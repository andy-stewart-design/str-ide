import { app, Menu, BrowserWindow } from "electron";
import { openFile } from "@/main";

export function createSystemMenu() {
  const menu = Menu.buildFromTemplate([
    {
      label: app.name,
      submenu: [
        {
          role: "quit",
          label: "Quit Electron Counter",
        },
      ],
    },
    {
      label: "File",
      submenu: [
        {
          label: "Open File",
          accelerator: "CmdOrCtrl+O",
          click: async () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (!focusedWindow) return;

            const data = await openFile();
            if (data) {
              focusedWindow.webContents.send("file-opened", data);
            }
          },
        },
        {
          label: "Save File",
          accelerator: "CmdOrCtrl+S",
          click: async () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (!focusedWindow) return;
            focusedWindow.webContents.send("request-save");
          },
        },
        {
          label: "Close File",
          accelerator: "CmdOrCtrl+W",
          click: async () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (!focusedWindow) return;
            focusedWindow.webContents.send("request-close");
          },
        },
      ],
    },
    {
      label: "Audio",
      submenu: [
        {
          label: "Play Audio",
          accelerator: "Alt+Return",
          click: async () => {
            BrowserWindow.getFocusedWindow()?.webContents.send("request-play");
          },
        },
        {
          label: "Pause Audio",
          // accelerator: "Alt+.",
          click: async () => {
            BrowserWindow.getFocusedWindow()?.webContents.send("request-pause");
          },
        },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Toggle Developer Tools",
          accelerator:
            process.platform === "darwin" ? "Alt+Command+I" : "Ctrl+Shift+I",
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.webContents.toggleDevTools();
            }
          },
        },
      ],
    },
  ]);

  Menu.setApplicationMenu(menu);
}
