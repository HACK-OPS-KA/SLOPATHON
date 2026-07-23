// Electron main process for Cursor Distorter.
//
// Responsibilities:
//   * The main app window (renderer).
//   * A persistent tray with a visible active-state indicator and a menu that can
//     always disable everything and quit.
//   * A global panic shortcut (Cmd/Ctrl+Shift+Esc) that instantly stops all distortion.
//   * The optional macOS "System Distortion Mode": a transparent, click-through,
//     always-on-top overlay window that mirrors the real pointer with decoy cursors.
//     It is NEVER started silently — the tray shows a persistent "● SYSTEM" indicator
//     the whole time it runs, and it is force-disabled on quit / window close / panic /
//     an automatic session timeout. It is read-only: it only *reads* the cursor
//     position via screen.getCursorScreenPoint() and draws overlays. It performs no
//     input injection, filesystem, clipboard, or network access.
import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  globalShortcut,
  ipcMain,
  nativeImage,
  screen,
  systemPreferences,
} from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type {
  IndicatorState,
  SystemModeStatus,
} from "@cursor-distorter/shared-types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PRELOAD = path.join(__dirname, "preload.mjs");
const INDEX_HTML = path.join(__dirname, "../dist/index.html");
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

/** How long System Distortion Mode may run before it auto-disables itself (safety). */
const SESSION_AUTO_DISABLE_MS = 10 * 60 * 1000;
/** Pointer-poll cadence for the overlay (~60fps). */
const CURSOR_POLL_MS = 16;

// A tiny always-visible tray icon (16x16 white dot) so the menu stays reachable even
// when the indicator title is empty ("off" state).
const TRAY_ICON_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAaElEQVR4nK2T0Q3AIAhEHaPDsB/bsI3zXNMEEpqoDT0u4Ue8ByoOAIOJXUIAKADzUF/7BFxu2Ml8zxLwJObBHJoZkgGnyqtOXgApmEOSAfoDoBlQaT9krQD6CPQl0s/YMkj0KLd8pnLckCKJwrxkpyMAAAAASUVORK5CYII=";

let mainWin: BrowserWindow | null = null;
let overlayWin: BrowserWindow | null = null;
let tray: Tray | null = null;

let cursorInterval: ReturnType<typeof setInterval> | null = null;
let sessionTimer: ReturnType<typeof setTimeout> | null = null;

let systemActive = false;
let accessibilityGranted = false;

// --- helpers -------------------------------------------------------------

function sendToMain(channel: string, ...args: unknown[]): void {
  if (mainWin && !mainWin.isDestroyed()) {
    mainWin.webContents.send(channel, ...args);
  }
}

function currentStatus(): SystemModeStatus {
  return {
    available: process.platform === "darwin",
    active: systemActive,
    accessibilityGranted,
    helperConnected: false,
  };
}

/** Broadcast the current system-mode status to the main renderer. */
function broadcastStatus(status: SystemModeStatus): void {
  sendToMain("system:status", status);
}

function updateTrayIndicator(state: IndicatorState): void {
  if (!tray) return;
  const title =
    state === "system" ? "● SYSTEM" : state === "sandbox" ? "● sandbox" : "";
  tray.setTitle(title);
  tray.setToolTip(
    state === "system"
      ? "Cursor Distorter — SYSTEM mode active"
      : state === "sandbox"
        ? "Cursor Distorter — sandbox active"
        : "Cursor Distorter",
  );
}

// --- main window ---------------------------------------------------------

async function createMainWindow(): Promise<void> {
  mainWin = new BrowserWindow({
    width: 1360,
    height: 880,
    backgroundColor: "#05060a",
    webPreferences: {
      preload: PRELOAD,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWin.on("closed", () => {
    // Safety: never leave the overlay running without its owning window.
    stopSystemMode();
    mainWin = null;
  });

  if (DEV_SERVER_URL) {
    await mainWin.loadURL(DEV_SERVER_URL);
  } else {
    await mainWin.loadFile(INDEX_HTML);
  }
}

// --- tray ----------------------------------------------------------------

function createTray(): void {
  let image = nativeImage.createFromBuffer(Buffer.from(TRAY_ICON_PNG, "base64"));
  if (image.isEmpty()) {
    image = nativeImage.createEmpty();
  }
  // Template image renders correctly in both light/dark menu bars on macOS.
  image.setTemplateImage(true);
  tray = new Tray(image);
  tray.setToolTip("Cursor Distorter");

  const menu = Menu.buildFromTemplate([
    {
      label: "Open Cursor Distorter",
      click: () => {
        if (!mainWin || mainWin.isDestroyed()) {
          void createMainWindow();
          return;
        }
        if (mainWin.isMinimized()) mainWin.restore();
        mainWin.show();
        mainWin.focus();
      },
    },
    { type: "separator" },
    {
      label: "Disable all distortion",
      click: () => {
        sendToMain("disable-all");
        stopSystemMode();
        updateTrayIndicator("off");
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => app.quit(),
    },
  ]);
  tray.setContextMenu(menu);
  updateTrayIndicator("off");
}

// --- global panic shortcut ----------------------------------------------

function registerPanicShortcut(): void {
  try {
    const ok = globalShortcut.register("CommandOrControl+Shift+Escape", () => {
      sendToMain("panic");
      stopSystemMode();
    });
    if (!ok) {
      console.warn(
        "[cursor-distorter] panic shortcut registration returned false (already taken?)",
      );
    }
  } catch (err) {
    console.warn("[cursor-distorter] failed to register panic shortcut:", err);
  }
}

// --- system distortion mode ---------------------------------------------

async function startSystemMode(): Promise<SystemModeStatus> {
  if (systemActive) return currentStatus();

  if (process.platform !== "darwin") {
    return {
      available: false,
      active: false,
      accessibilityGranted: false,
      helperConnected: false,
      reason: "System Distortion Mode is only available on macOS.",
    };
  }

  // Prompt for (and record) Accessibility permission. `true` shows the system
  // prompt if not yet granted.
  try {
    accessibilityGranted =
      systemPreferences.isTrustedAccessibilityClient(true);
  } catch {
    accessibilityGranted = false;
  }

  const display = screen.getPrimaryDisplay();
  const bounds = display.bounds;

  overlayWin = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    transparent: true,
    frame: false,
    hasShadow: false,
    resizable: false,
    movable: false,
    focusable: false,
    skipTaskbar: true,
    fullscreen: false,
    fullscreenable: false,
    alwaysOnTop: true,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: PRELOAD,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  overlayWin.setAlwaysOnTop(true, "screen-saver");
  overlayWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  // Fully click-through: the real pointer keeps working normally.
  overlayWin.setIgnoreMouseEvents(true, { forward: true });

  overlayWin.on("closed", () => {
    overlayWin = null;
  });

  if (DEV_SERVER_URL) {
    await overlayWin.loadURL(`${DEV_SERVER_URL}?overlay=1`);
  } else {
    await overlayWin.loadFile(INDEX_HTML, { search: "overlay=1" });
  }

  systemActive = true;

  // Mirror the real cursor into the overlay so it can draw decoy pointers.
  cursorInterval = setInterval(() => {
    if (!overlayWin || overlayWin.isDestroyed()) return;
    const p = screen.getCursorScreenPoint();
    overlayWin.webContents.send("overlay:cursor", {
      x: p.x - bounds.x,
      y: p.y - bounds.y,
    });
  }, CURSOR_POLL_MS);

  // Safety auto-disable: never let system mode run unbounded.
  sessionTimer = setTimeout(() => {
    stopSystemMode();
    sendToMain("panic");
  }, SESSION_AUTO_DISABLE_MS);

  updateTrayIndicator("system");

  const status: SystemModeStatus = {
    available: true,
    active: true,
    accessibilityGranted,
    helperConnected: false,
    reason:
      "System mode active. Pointer movement/click interception requires the native helper (see docs).",
  };
  broadcastStatus(status);
  return status;
}

function stopSystemMode(): SystemModeStatus {
  if (cursorInterval) {
    clearInterval(cursorInterval);
    cursorInterval = null;
  }
  if (sessionTimer) {
    clearTimeout(sessionTimer);
    sessionTimer = null;
  }
  if (overlayWin && !overlayWin.isDestroyed()) {
    overlayWin.destroy();
  }
  overlayWin = null;

  const wasActive = systemActive;
  systemActive = false;
  updateTrayIndicator("off");

  const status = currentStatus();
  if (wasActive) broadcastStatus(status);
  return status;
}

// --- ipc -----------------------------------------------------------------

function registerIpc(): void {
  ipcMain.on("app:version", (event) => {
    event.returnValue = app.getVersion();
  });

  ipcMain.on("set-active", (_event, _active: boolean) => {
    // No-op at the OS level; the indicator is driven explicitly via set-indicator.
  });

  ipcMain.on("set-indicator", (_event, state: IndicatorState) => {
    updateTrayIndicator(state);
  });

  ipcMain.on("app:quit", () => {
    app.quit();
  });

  ipcMain.handle("system:status", () => currentStatus());
  ipcMain.handle("system:request", () => startSystemMode());
  ipcMain.handle("system:stop", () => stopSystemMode());
}

// --- app lifecycle -------------------------------------------------------

app.whenReady().then(() => {
  registerIpc();
  void createMainWindow();
  createTray();
  registerPanicShortcut();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  stopSystemMode();
  globalShortcut.unregisterAll();
});
