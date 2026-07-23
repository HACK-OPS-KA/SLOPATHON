import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@cursor-distorter/ui";
import { ALL_EFFECT_IDS, type EffectId } from "@cursor-distorter/shared-types";
import { Sandbox } from "../sandbox/Sandbox";
import { useStore } from "../state/store";
import { useEscalation } from "./useEscalation";
import { mmss } from "../dashboard/format";

// Presenter key → effect (or command).
const KEYMAP: Record<string, EffectId> = {
  "1": "imprecision",
  "2": "triplets",
  "3": "lag",
  "4": "repulsion",
  "5": "overshoot",
  "6": "drift",
  "7": "betrayal",
  "8": "social",
};

export function DemoScreen() {
  const setScreen = useStore((s) => s.setScreen);
  const setActive = useStore((s) => s.setActive);
  const setEffectConfig = useStore((s) => s.setEffectConfig);
  const setIntensity = useStore((s) => s.setIntensity);
  const intensity = useStore((s) => s.intensity);
  const panic = useStore((s) => s.panic);
  const soundOn = useStore((s) => s.soundOn);
  const setSound = useStore((s) => s.setSound);
  const remainingMs = useStore((s) => s.remainingMs);
  const esc = useEscalation();
  const [legend, setLegend] = useState(false);
  const [fs, setFs] = useState(false);

  const enable = (id: EffectId, intensityLevel = 0.6) => {
    setEffectConfig(id, { enabled: true, intensity: intensityLevel });
    setActive(true);
  };

  const fullChaos = () => {
    for (const id of ALL_EFFECT_IDS) setEffectConfig(id, { enabled: true });
    setIntensity(1);
    setActive(true);
  };

  const makeItWorse = () => {
    const st = useStore.getState();
    const nextIntensity = Math.min(1, st.intensity + 0.12);
    setIntensity(nextIntensity);
    const disabled = ALL_EFFECT_IDS.filter((id) => !st.effects[id].enabled);
    if (disabled[0]) setEffectConfig(disabled[0], { enabled: true, intensity: 0.55 });
    setActive(true);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === "Escape") {
        e.preventDefault();
        panic();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (KEYMAP[k]) {
        enable(KEYMAP[k]);
      } else if (k === "9") {
        fullChaos();
      } else if (k === "0") {
        esc.reset();
      } else if (k === "?") {
        setLegend((l) => !l);
      }
    };
    window.addEventListener("keydown", onKey);

    const bridge = window.cursorDistorter;
    const off = bridge?.onPresenterKey((key) => {
      if (KEYMAP[key]) enable(KEYMAP[key]);
      else if (key === "9") fullChaos();
      else if (key === "0") esc.reset();
    });

    return () => {
      window.removeEventListener("keydown", onKey);
      off?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleFs = () => {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().then(() => setFs(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setFs(false)).catch(() => {});
    }
  };

  const shortcuts = useMemo(
    () => [
      ["1", "Imprecision Field"],
      ["2", "Cursor Triplets"],
      ["3", "Input Lag"],
      ["4", "Button Repulsion"],
      ["5", "Overshoot"],
      ["6", "Cursor Drift"],
      ["7", "Click Betrayal"],
      ["8", "Social Cursor"],
      ["9", "Full chaos"],
      ["0", "Reset"],
      ["⌘⇧⎋", "Immediate safe shutdown"],
    ],
    [],
  );

  return (
    <div className="relative flex h-full flex-col bg-ink-950">
      {/* Presenter control bar */}
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-white/8 bg-ink-900/80 px-4 backdrop-blur">
        <button
          onClick={() => {
            setActive(false);
            setScreen("dashboard");
          }}
          className="rounded-md border border-white/10 px-2.5 py-1 text-[12px] text-white/80 hover:bg-white/5"
        >
          ← Console
        </button>
        <span className="text-[12px] font-semibold text-white">Live Demo</span>
        <span className="rounded-md bg-white/[0.05] px-2 py-1 text-[11px] text-ink-500">
          {esc.running ? `escalating · ${Math.floor(esc.elapsed)}s` : "manual"}
        </span>

        <div className="ml-2 flex items-center gap-2">
          {!esc.running ? (
            <button onClick={esc.start} className="rounded-md bg-brand-500 px-3 py-1 text-[12px] font-semibold text-white shadow-glow">
              Start escalation
            </button>
          ) : (
            <button onClick={esc.stop} className="rounded-md bg-white/10 px-3 py-1 text-[12px] font-medium text-white/85">
              Pause
            </button>
          )}
          <button onClick={esc.reset} className="rounded-md border border-white/10 px-2.5 py-1 text-[12px] text-ink-500 hover:text-white/80">
            Reset
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2 text-[12px]">
          <span className="hidden items-center gap-1 text-ink-500 sm:flex">
            ⏱ <span className="stat-num text-white/75">{mmss(remainingMs)}</span>
          </span>
          <span className="stat-num text-ink-500">chaos {Math.round(intensity * 100)}%</span>
          <button onClick={() => setSound(!soundOn)} className={cn("rounded-md px-2 py-1 text-[12px]", soundOn ? "bg-brand-500/20 text-brand-200" : "bg-white/5 text-ink-500")}>
            {soundOn ? "🔊" : "🔈"}
          </button>
          <button onClick={toggleFs} className="rounded-md bg-white/5 px-2 py-1 text-[12px] text-ink-500 hover:text-white/80">
            {fs ? "Exit full screen" : "Full screen"}
          </button>
          <button onClick={() => setLegend((l) => !l)} className="rounded-md bg-white/5 px-2 py-1 text-[12px] text-ink-500">
            ⌨
          </button>
          <button onClick={panic} className="rounded-md border border-signal-bad/40 bg-signal-bad/10 px-2.5 py-1 text-[12px] font-semibold text-signal-bad">
            Panic
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <Sandbox />

        {/* MAKE IT WORSE */}
        <div className="pointer-events-none absolute bottom-5 left-1/2 z-50 -translate-x-1/2">
          <button
            onClick={makeItWorse}
            className="pointer-events-auto rounded-2xl bg-gradient-to-b from-signal-bad to-[#c8324a] px-8 py-3.5 text-base font-bold uppercase tracking-wide text-white shadow-glow ring-1 ring-white/20 transition-transform hover:scale-[1.03] active:scale-95"
          >
            Make it worse
          </button>
        </div>

        {/* Stage note toast */}
        <AnimatePresence>
          {esc.latestNote && (
            <motion.div
              key={esc.latestNote}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-lg border border-white/10 bg-ink-800/95 px-4 py-2 text-[12px] text-white/90 shadow-glass"
            >
              {esc.latestNote}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Presenter shortcut legend */}
        <AnimatePresence>
          {legend && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute right-4 top-4 z-50 w-56 rounded-xl border border-white/10 bg-ink-800/95 p-3 shadow-glass"
            >
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-ink-500">Presenter keys</div>
              <ul className="space-y-1">
                {shortcuts.map(([k, label]) => (
                  <li key={k} className="flex items-center justify-between text-[12px]">
                    <span className="text-white/75">{label}</span>
                    <kbd className="rounded border border-white/10 bg-white/[0.05] px-1.5 py-0.5 font-mono text-[11px] text-white/85">{k}</kbd>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
