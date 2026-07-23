import { useEffect } from "react";
import { useStore } from "../state/store";

/**
 * Wires the always-available emergency controls: the browser panic hotkey (⌘/Ctrl+⇧+Esc)
 * and the Electron bridge callbacks (global panic shortcut + tray "Disable all distortion").
 */
export function useGlobalControls(): void {
  const panic = useStore((s) => s.panic);
  const setActive = useStore((s) => s.setActive);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === "Escape") {
        e.preventDefault();
        panic();
      }
    };
    window.addEventListener("keydown", onKey);

    const offs: Array<() => void> = [];
    const bridge = window.cursorDistorter;
    if (bridge) {
      offs.push(bridge.onPanic(() => panic()));
      offs.push(bridge.onDisableAll(() => setActive(false)));
    }

    return () => {
      window.removeEventListener("keydown", onKey);
      offs.forEach((off) => off());
    };
  }, [panic, setActive]);
}
