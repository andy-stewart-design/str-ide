import { app, Menu, BrowserWindow, systemPreferences, shell } from "electron";
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
          label: "New File",
          accelerator: "CmdOrCtrl+N",
          click: async () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(
              "request-new-file"
            );
          },
        },
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
      label: "Visual",
      submenu: [
        {
          label: "Play Visuals",
          // accelerator: "Alt+Return",
          click: async () => {
            const hasCameraAccess =
              systemPreferences.getMediaAccessStatus("camera") === "granted";
            const cameraAccessGranted =
              !hasCameraAccess &&
              (await systemPreferences.askForMediaAccess("camera"));

            console.log({ hasCameraAccess, cameraAccessGranted });

            // shell.openExternal(
            //   "x-apple.systempreferences:com.apple.preference.security?Privacy_Camera"
            // );

            if (hasCameraAccess || cameraAccessGranted) {
              BrowserWindow.getFocusedWindow()?.webContents.send(
                "request-play-visuals"
              );
            }
          },
        },
      ],
    },
  ]);

  Menu.setApplicationMenu(menu);
}
