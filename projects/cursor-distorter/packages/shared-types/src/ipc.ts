/** Visible active-state indicator shown in the menu bar / tray. */
export type IndicatorState = "off" | "sandbox" | "system";

/** Status of the optional macOS System Distortion Mode. */
export interface SystemModeStatus {
  /** Whether system-wide mode can be offered at all on this host. */
  available: boolean;
  active: boolean;
  accessibilityGranted: boolean;
  helperConnected: boolean;
  /** Human-readable reason for the current state (e.g. why it is unavailable). */
  reason?: string;
}

/**
 * The strictly context-isolated bridge exposed on `window.cursorDistorter` by the
 * Electron preload. Absent in a plain browser (Safe Demo Sandbox only). Every method
 * is safe: no filesystem, input logging, clipboard, or remote access.
 */
export interface CursorDistorterBridge {
  readonly isElectron: boolean;
  readonly platform: string;
  readonly appVersion: string;

  /** Fires when the global panic shortcut (Cmd+Shift+Esc) is pressed. Returns an unsubscribe fn. */
  onPanic(cb: () => void): () => void;
  /** Fires for presenter keyboard shortcuts forwarded from the main process. */
  onPresenterKey(cb: (key: string) => void): () => void;
  /** Fires when the tray "Disable all distortion" item is chosen. */
  onDisableAll(cb: () => void): () => void;

  /** Report whether distortion is currently active (drives the tray indicator). */
  setActive(active: boolean): void;
  /** Set the visible indicator state. */
  setIndicator(state: IndicatorState): void;

  /** Request macOS Accessibility permission and start System Distortion Mode. */
  requestSystemMode(): Promise<SystemModeStatus>;
  /** Stop System Distortion Mode and disconnect the native helper. */
  stopSystemMode(): Promise<SystemModeStatus>;
  getSystemModeStatus(): Promise<SystemModeStatus>;
  onSystemModeStatus(cb: (status: SystemModeStatus) => void): () => void;

  /** Quit the application entirely (always restores normal input first). */
  quit(): void;
}

declare global {
  interface Window {
    cursorDistorter?: CursorDistorterBridge;
  }
}
