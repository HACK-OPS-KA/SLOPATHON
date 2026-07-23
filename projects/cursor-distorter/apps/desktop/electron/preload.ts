// Context-isolated bridge exposed on `window.cursorDistorter`.
// Strict isolation: the renderer never touches `ipcRenderer` directly; it only
// gets the narrow, safe surface described by CursorDistorterBridge (plus two
// overlay-only helpers). No filesystem, input logging, clipboard, or remote access.
import { contextBridge, ipcRenderer } from "electron";
import type {
  CursorDistorterBridge,
  IndicatorState,
  SystemModeStatus,
} from "@cursor-distorter/shared-types";

/** Subscribe to a main->renderer channel, returning an unsubscribe function. */
function subscribe<Args extends unknown[]>(
  channel: string,
  cb: (...args: Args) => void,
): () => void {
  const listener = (_event: Electron.IpcRendererEvent, ...args: unknown[]) =>
    cb(...(args as Args));
  ipcRenderer.on(channel, listener);
  return () => {
    ipcRenderer.removeListener(channel, listener);
  };
}

const bridge: CursorDistorterBridge & {
  onOverlayCursor(cb: (point: { x: number; y: number }) => void): () => void;
  isOverlay(): boolean;
} = {
  isElectron: true,
  platform: process.platform,
  appVersion: ipcRenderer.sendSync("app:version") as string,

  onPanic(cb: () => void): () => void {
    return subscribe("panic", cb);
  },
  onPresenterKey(cb: (key: string) => void): () => void {
    return subscribe<[string]>("presenter-key", cb);
  },
  onDisableAll(cb: () => void): () => void {
    return subscribe("disable-all", cb);
  },
  onSystemModeStatus(cb: (status: SystemModeStatus) => void): () => void {
    return subscribe<[SystemModeStatus]>("system:status", cb);
  },

  setActive(active: boolean): void {
    ipcRenderer.send("set-active", active);
  },
  setIndicator(state: IndicatorState): void {
    ipcRenderer.send("set-indicator", state);
  },

  requestSystemMode(): Promise<SystemModeStatus> {
    return ipcRenderer.invoke("system:request") as Promise<SystemModeStatus>;
  },
  stopSystemMode(): Promise<SystemModeStatus> {
    return ipcRenderer.invoke("system:stop") as Promise<SystemModeStatus>;
  },
  getSystemModeStatus(): Promise<SystemModeStatus> {
    return ipcRenderer.invoke("system:status") as Promise<SystemModeStatus>;
  },

  quit(): void {
    ipcRenderer.send("app:quit");
  },

  // --- Overlay-only helpers (not part of the shared bridge contract) ---
  onOverlayCursor(cb: (point: { x: number; y: number }) => void): () => void {
    return subscribe<[{ x: number; y: number }]>("overlay:cursor", cb);
  },
  isOverlay(): boolean {
    return new URLSearchParams(location.search).get("overlay") === "1";
  },
};

contextBridge.exposeInMainWorld("cursorDistorter", bridge);
