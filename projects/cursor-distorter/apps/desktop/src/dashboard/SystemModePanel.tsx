import { useState } from "react";
import { GlassPanel, Pill, cn } from "@cursor-distorter/ui";
import { useStore } from "../state/store";

const bridge = typeof window !== "undefined" ? window.cursorDistorter : undefined;

/**
 * Controls the optional macOS System Distortion Mode. Always requires an explicit
 * confirmation, always shows a visible indicator, and is unavailable in the browser.
 */
export function SystemModePanel() {
  const status = useStore((s) => s.systemStatus);
  const setStatus = useStore((s) => s.setSystemStatus);
  const setOperatingMode = useStore((s) => s.setOperatingMode);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const request = async () => {
    if (!bridge) return;
    setBusy(true);
    try {
      const next = await bridge.requestSystemMode();
      setStatus(next);
      if (next.active) setOperatingMode("system");
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  const stop = async () => {
    if (!bridge) return;
    setBusy(true);
    try {
      const next = await bridge.stopSystemMode();
      setStatus(next);
      setOperatingMode("sandbox");
    } finally {
      setBusy(false);
    }
  };

  return (
    <GlassPanel
      title="System Distortion Mode"
      subtitle="Distort the real macOS pointer"
      right={
        <Pill tone={status.active ? "bad" : status.available ? "warn" : "neutral"}>
          {status.active ? "Active" : status.available ? "Available" : "Sandbox only"}
        </Pill>
      }
    >
      <p className="text-[12px] leading-relaxed text-white/70">
        System mode uses macOS Accessibility to render fake cursors and apply controlled offsets
        system-wide. It never runs secretly — a menu-bar indicator stays visible the entire time,
        and <span className="text-white/85">⌘⇧⎋</span> instantly restores normal input.
      </p>

      {!status.available && (
        <div className="mt-3 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2 text-[11px] text-ink-500">
          {status.reason ?? "Available only in the packaged desktop app."} The Safe Demo Sandbox
          demonstrates every effect without any permissions.
        </div>
      )}

      {status.available && !status.active && (
        <div className="mt-3">
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="w-full rounded-lg border border-signal-warn/40 bg-signal-warn/10 px-3 py-2 text-[12px] font-medium text-signal-warn hover:bg-signal-warn/20"
            >
              Enable System Distortion Mode…
            </button>
          ) : (
            <div className="rounded-lg border border-signal-warn/40 bg-signal-warn/5 p-3">
              <div className="text-[12px] font-medium text-white/85">Confirm system-wide distortion</div>
              <p className="mt-1 text-[11px] text-ink-500">
                Your real cursor will be sabotaged across all apps until you disable it, the timer
                expires, or you press ⌘⇧⎋.
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={request}
                  disabled={busy}
                  className={cn(
                    "flex-1 rounded-md bg-signal-bad px-3 py-1.5 text-[12px] font-semibold text-white",
                    busy && "opacity-50",
                  )}
                >
                  {busy ? "Requesting…" : "I understand — enable"}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="rounded-md border border-white/10 px-3 py-1.5 text-[12px] text-ink-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {status.active && (
        <button
          onClick={stop}
          disabled={busy}
          className="mt-3 w-full rounded-lg bg-signal-bad px-3 py-2 text-[12px] font-semibold text-white"
        >
          Disable System Distortion Mode
        </button>
      )}
    </GlassPanel>
  );
}
