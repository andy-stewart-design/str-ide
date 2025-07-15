import { app, Menu, BrowserWindow } from "electron";
import { handleFileOpen } from "../main";

export function createSystemMenu(win: BrowserWindow) {
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
      label: "Counter",
      submenu: [
        {
          click: () => win.webContents.send("update-counter", 1),
          label: "Increment",
        },
        {
          click: () => win.webContents.send("update-counter", -1),
          label: "Decrement",
        },
      ],
    },
    {
      label: "File",
      submenu: [
        {
          label: "Open",
          accelerator: "CmdOrCtrl+O",
          click: async () => {
            const data = await handleFileOpen();
            if (data.canceled === false) {
              win.webContents.send("file-opened", data);
            }
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
