import {
  app,
  BrowserWindow,
  ipcMain,
} from 'electron';
import {
  IPC_CLOSE_WINDOW,
  IPC_DRAW_MINIGAME,
  IPC_MINIMIZE_WINDOW,
  IPC_RUN_MINIGAME,
  IPC_TYPE_CHARACTER,
  MinigameResult,
} from './contracts';
import { typeCharacter } from './input-service';
import { drawMinigame, isMinigameId } from './minigame-data';
import {
  closeMinigameWindows,
  runRegisteredMinigame,
} from './minigame-registry';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

let mainWindow: BrowserWindow | null = null;
let activeMinigame = false;

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
    focusable: true,
    skipTaskbar: false,
    show: false,
    backgroundColor: '#efe3ca',
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Keep physical keystrokes inside this window while it is open. The app has
  // no keyboard controls, so preventing the event makes the keyboard inert
  // until the window is closed and focus returns to the previous application.
  mainWindow.webContents.on('before-input-event', (event) => {
    event.preventDefault();
  });

  void mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  mainWindow.once('ready-to-show', () => mainWindow.show());
};

app.whenReady().then(() => {
  ipcMain.handle(IPC_TYPE_CHARACTER, (_event, character: string) =>
    typeCharacter(character),
  );
  ipcMain.handle(IPC_DRAW_MINIGAME, () => drawMinigame());
  ipcMain.handle(
    IPC_RUN_MINIGAME,
    async (_event, id: unknown): Promise<MinigameResult> => {
      if (!isMinigameId(id)) {
        return { status: 'failed', message: 'UNKNOWN MINIGAME' };
      }
      if (activeMinigame || !mainWindow) {
        return { status: 'failed', message: 'A MINIGAME IS ALREADY ACTIVE' };
      }
      activeMinigame = true;
      try {
        return await runRegisteredMinigame(id, { mainWindow });
      } catch {
        return { status: 'failed', message: 'MINIGAME FAILED SAFELY' };
      } finally {
        activeMinigame = false;
      }
    },
  );
  ipcMain.on(IPC_CLOSE_WINDOW, (event) =>
    BrowserWindow.fromWebContents(event.sender)?.close(),
  );
  ipcMain.on(IPC_MINIMIZE_WINDOW, (event) =>
    BrowserWindow.fromWebContents(event.sender)?.minimize(),
  );
  createWindow();
});

app.on('window-all-closed', () => app.quit());
app.on('will-quit', () => {
  closeMinigameWindows();
});
