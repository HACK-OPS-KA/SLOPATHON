import { GlassPanel } from "@cursor-distorter/ui";

const NEVER = [
  "Typed text or keystrokes",
  "Passwords or credentials",
  "Screenshots or window contents",
  "Clipboard contents",
  "Browsing history",
  "Anything outside the demo sandbox",
];

export function PrivacyPanel() {
  return (
    <GlassPanel title="Privacy" subtitle="Honest, for once">
      <p className="text-[12px] leading-relaxed text-white/75">
        Cursor Distorter stores only local settings and anonymous session statistics (counts and
        estimates). Pointer coordinates in System Distortion Mode are processed in memory and
        discarded when the session ends.
      </p>
      <div className="mt-3 text-[11px] font-medium text-ink-500">We never collect:</div>
      <ul className="mt-1 grid grid-cols-1 gap-1">
        {NEVER.map((n) => (
          <li key={n} className="flex items-center gap-2 text-[12px] text-white/70">
            <span className="text-signal-ok">✓</span>
            {n}
          </li>
        ))}
      </ul>
    </GlassPanel>
  );
}
