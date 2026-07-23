import {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
} from 'electron';
import {
  IPC_CLOSE_WINDOW,
  IPC_MINIMIZE_WINDOW,
  IPC_TYPE_CHARACTER,
} from './contracts';
import { typeCharacter } from './input-service';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

let mainWindow: BrowserWindow | null = null;

if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    height: 720,
    width: 960,
    minHeight: 720,
    minWidth: 960,
    maxHeight: 720,
    maxWidth: 960,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    focusable: false,
    show: false,
    backgroundColor: '#efe3ca',
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  void mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  mainWindow.once('ready-to-show', () => mainWindow.showInactive());
};

const toggleMinimized = (): void => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
    mainWindow.showInactive();
  } else {
    mainWindow.minimize();
  }
};

app.whenReady().then(() => {
  ipcMain.handle(IPC_TYPE_CHARACTER, (_event, character: string) =>
    typeCharacter(character),
  );
  ipcMain.on(IPC_CLOSE_WINDOW, (event) =>
    BrowserWindow.fromWebContents(event.sender)?.close(),
  );
  ipcMain.on(IPC_MINIMIZE_WINDOW, (event) =>
    BrowserWindow.fromWebContents(event.sender)?.minimize(),
  );
  createWindow();
  globalShortcut.register('CommandOrControl+Alt+K', toggleMinimized);
});

app.on('window-all-closed', () => app.quit());
app.on('will-quit', () => globalShortcut.unregisterAll());
