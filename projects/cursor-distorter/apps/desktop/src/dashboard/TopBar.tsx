import { Toggle, cn } from "@cursor-distorter/ui";
import { useStore } from "../state/store";
import { mmss } from "./format";

function BrandMark() {
  return (
    <div className="relative grid h-8 w-8 place-items-center rounded-lg bg-brand-500/20 ring-1 ring-brand-400/30">
      <svg width="16" height="16" viewBox="0 0 24 24">
        <path
          d="M4 2 L4 20.5 L9.2 15.3 L12.7 22.2 L15.3 21 L11.8 14.2 L18.6 14.2 Z"
          fill="#9db8ff"
          stroke="#0a0c14"
          strokeWidth="1.2"
        />
      </svg>
      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent-cyan" />
    </div>
  );
}

export function TopBar() {
  const active = useStore((s) => s.active);
  const setActive = useStore((s) => s.setActive);
  const intensity = useStore((s) => s.intensity);
  const setIntensity = useStore((s) => s.setIntensity);
  const remainingMs = useStore((s) => s.remainingMs);
  const soundOn = useStore((s) => s.soundOn);
  const setSound = useStore((s) => s.setSound);
  const panic = useStore((s) => s.panic);
  const setScreen = useStore((s) => s.setScreen);

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-white/8 bg-ink-900/70 px-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <BrandMark />
        <div className="leading-tight">
          <div className="text-[13px] font-semibold tracking-tight text-white">Cursor Distorter</div>
          <div className="text-[10px] text-ink-500">Your cursor is technically still working.</div>
        </div>
      </div>

      <div className="mx-2 hidden items-center gap-2 lg:flex">
        <span className="text-[10px] uppercase tracking-widest text-ink-500">Chaos</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={intensity}
          onChange={(e) => setIntensity(Number(e.target.value))}
          className="w-28 accent-brand-500"
        />
        <span className="stat-num w-9 text-[12px] text-white/80">{Math.round(intensity * 100)}%</span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden items-center gap-1.5 text-[11px] text-ink-500 sm:flex">
          <span>⏱</span>
          <span className="stat-num text-white/75">{mmss(remainingMs)}</span>
        </div>
        <div className="hidden items-center gap-1.5 sm:flex">
          <span className="text-[11px] text-ink-500">Sound</span>
          <Toggle checked={soundOn} onChange={setSound} label="Sound" />
        </div>
        <button
          onClick={() => setScreen("demo")}
          className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] font-medium text-white/85 hover:bg-white/[0.08]"
        >
          Live Demo
        </button>
        <button
          onClick={() => setActive(!active)}
          className={cn(
            "rounded-lg px-4 py-1.5 text-[12px] font-semibold text-white shadow",
            active ? "bg-signal-bad" : "bg-brand-500 shadow-glow",
          )}
        >
          {active ? "Disarm" : "Arm distortion"}
        </button>
        <button
          onClick={panic}
          title="Panic — Cmd+Shift+Esc"
          className="rounded-lg border border-signal-bad/40 bg-signal-bad/10 px-3 py-1.5 text-[12px] font-semibold text-signal-bad hover:bg-signal-bad/20"
        >
          Panic
        </button>
      </div>
    </header>
  );
}
