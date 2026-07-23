import { spawn } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import {
  app,
  BrowserWindow,
  dialog,
  screen,
  shell,
} from 'electron';
import type {
  MinigameDescriptor,
  MinigameId,
  MinigameResult,
} from './contracts';
import {
  MINIGAMES,
  USELESS_WEBSITES,
  sampleDistinct,
} from './minigame-data';
import { openFakeBluescreen } from './fake-bluescreen';
import { secureRemoteWindow } from './remote-window';

export interface MinigameContext {
  mainWindow: BrowserWindow;
}

interface MinigameHandler {
  descriptor: MinigameDescriptor;
  run: (context: MinigameContext) => Promise<MinigameResult>;
}

const childWindows = new Set<BrowserWindow>();
const track = (window: BrowserWindow): BrowserWindow => {
  childWindows.add(window);
  window.once('closed', () => childWindows.delete(window));
  return window;
};

const openUselessWebsites = async (): Promise<MinigameResult> => {
  const urls = sampleDistinct(USELESS_WEBSITES, 10);
  urls.forEach((url, index) => {
    const window = track(secureRemoteWindow({
      x: 40 + index * 28,
      y: 35 + index * 24,
      width: 760,
      height: 560,
      title: `Useless website ${index + 1}/10`,
    }));
    void window.loadURL(url).finally(() => {
      if (!window.isDestroyed()) window.show();
    });
  });
  return {
    status: 'completed',
    message: 'TEN USELESS WINDOWS DEPLOYED',
  };
};

const runShorts = ({ mainWindow }: MinigameContext): Promise<MinigameResult> =>
  new Promise((resolve) => {
    mainWindow.minimize();
    const mainDisplay = screen.getDisplayMatching(mainWindow.getBounds());
    const blockerWindows = screen.getAllDisplays()
      .filter((display) => display.id !== mainDisplay.id)
      .map((display) => {
        const blocker = track(new BrowserWindow({
          ...display.bounds,
          frame: false,
          focusable: false,
          alwaysOnTop: true,
          skipTaskbar: true,
          show: false,
          backgroundColor: '#000000',
        }));
        blocker.setAlwaysOnTop(true, 'screen-saver');
        blocker.showInactive();
        return blocker;
      });
    const window = track(secureRemoteWindow({
      ...mainDisplay.bounds,
      frame: false,
      focusable: true,
      alwaysOnTop: true,
      fullscreen: true,
      kiosk: true,
      minimizable: false,
      maximizable: false,
      autoHideMenuBar: true,
      skipTaskbar: true,
      title: 'YouTube Shorts · loading…',
    }));
    let seconds = 30;
    let loaded = false;
    let allowClose = false;
    let timer: NodeJS.Timeout | undefined;
    const finish = (result: MinigameResult): void => {
      if (timer) clearInterval(timer);
      blockerWindows.forEach((blocker) => {
        if (!blocker.isDestroyed()) blocker.destroy();
      });
      mainWindow.restore();
      mainWindow.showInactive();
      resolve(result);
    };
    window.on('close', (event) => {
      if (!allowClose && loaded) event.preventDefault();
    });
    window.on('closed', () => finish(loaded
      ? { status: 'completed', message: 'SHORTS SENTENCE COMPLETE' }
      : { status: 'failed', message: 'SHORTS FAILED TO LOAD' }));
    window.on('blur', () => {
      if (!allowClose && loaded && !window.isDestroyed()) {
        window.show();
        window.focus();
      }
    });
    window.webContents.once('did-fail-load', () => {
      allowClose = true;
      window.close();
    });
    window.webContents.once('did-finish-load', () => {
      loaded = true;
      window.setAlwaysOnTop(true, 'screen-saver');
      window.show();
      window.focus();
      window.setTitle(`YouTube Shorts · ${seconds}s remaining`);
      timer = setInterval(() => {
        seconds -= 1;
        window.setTitle(`YouTube Shorts · ${seconds}s remaining`);
        if (seconds <= 0) {
          allowClose = true;
          window.close();
        }
      }, 1000);
    });
    void window.loadURL('https://www.youtube.com/shorts');
  });

const gooseConfigPath = (): string =>
  join(app.getPath('userData'), 'desktop-goose.json');

const readGoosePath = (): string | null => {
  try {
    const value = JSON.parse(readFileSync(gooseConfigPath(), 'utf8'));
    return typeof value.executablePath === 'string' ? value.executablePath : null;
  } catch {
    return null;
  }
};

const chooseGoosePath = async (
  mainWindow: BrowserWindow,
): Promise<string | null> => {
  const choice = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    title: 'Desktop Goose setup',
    message: 'Desktop Goose is not bundled because its license forbids redistribution.',
    detail: 'Download it from the official page, select GooseDesktop.exe, or cancel.',
    buttons: ['Open official download', 'Select GooseDesktop.exe', 'Cancel'],
    defaultId: 0,
    cancelId: 2,
  });
  if (choice.response === 0) {
    await shell.openExternal('https://samperson.itch.io/desktop-goose?download');
    return null;
  }
  if (choice.response !== 1) return null;
  const selected = await dialog.showOpenDialog(mainWindow, {
    title: 'Select GooseDesktop.exe',
    properties: ['openFile'],
    filters: [{ name: 'Windows executable', extensions: ['exe'] }],
  });
  const executablePath = selected.filePaths[0];
  if (selected.canceled || !executablePath) return null;
  writeFileSync(gooseConfigPath(), JSON.stringify({ executablePath }), 'utf8');
  return executablePath;
};

/** Prompts during app startup so the minigame can launch without setup UI. */
export const ensureDesktopGoosePath = async (
  mainWindow: BrowserWindow,
): Promise<void> => {
  const executablePath = readGoosePath();
  if (!executablePath || !existsSync(executablePath)) {
    await chooseGoosePath(mainWindow);
  }
};

const runGoose = async (): Promise<MinigameResult> => {
  const executablePath = readGoosePath();
  if (!executablePath || !existsSync(executablePath)) {
    return { status: 'cancelled', message: 'DESKTOP GOOSE SETUP INCOMPLETE' };
  }
  try {
    spawn(executablePath, [], {
      cwd: dirname(executablePath),
      detached: true,
      shell: false,
      stdio: 'ignore',
    }).unref();
    return { status: 'completed', message: 'GOOSE RELEASED' };
  } catch {
    return { status: 'failed', message: 'GOOSE COULD NOT BE LAUNCHED' };
  }
};

const descriptors = new Map(MINIGAMES.map((game) => [game.id, game]));
const descriptor = (id: MinigameId): MinigameDescriptor => {
  const game = descriptors.get(id);
  if (!game) throw new Error(`Missing minigame descriptor: ${id}`);
  return game;
};
const registry = new Map<MinigameId, MinigameHandler>([
  ['useless-websites', {
    descriptor: descriptor('useless-websites'),
    run: openUselessWebsites,
  }],
  ['youtube-shorts', {
    descriptor: descriptor('youtube-shorts'),
    run: runShorts,
  }],
  ['desktop-goose', {
    descriptor: descriptor('desktop-goose'),
    run: runGoose,
  }],
  ['fake-bluescreen', {
    descriptor: descriptor('fake-bluescreen'),
    run: async () => {
      await openFakeBluescreen(track);
      return { status: 'completed', message: 'RECOVERY COMPLETE' };
    },
  }],
]);

export const runRegisteredMinigame = async (
  id: MinigameId,
  context: MinigameContext,
): Promise<MinigameResult> => {
  const handler = registry.get(id);
  if (!handler) return { status: 'failed', message: 'UNKNOWN MINIGAME' };
  return handler.run(context);
};

export const closeMinigameWindows = (): void => {
  for (const window of childWindows) {
    if (!window.isDestroyed()) window.destroy();
  }
  childWindows.clear();
};
