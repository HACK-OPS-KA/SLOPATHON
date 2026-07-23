import { GlassPanel } from "@cursor-distorter/ui";
import { useStore } from "../state/store";

const dot: Record<string, string> = {
  ok: "bg-signal-ok",
  warn: "bg-signal-warn",
  bad: "bg-signal-bad",
};

export function ModelFeed() {
  const lines = useStore((s) => s.modelLines);
  const ordered = [...lines].reverse();

  return (
    <GlassPanel title="Adaptive model" subtitle="Internal counter-adaptation log">
      {ordered.length === 0 ? (
        <div className="py-3 text-center text-[12px] text-ink-500">
          Monitoring pointer-user disagreement…
        </div>
      ) : (
        <ul className="space-y-1.5">
          {ordered.slice(0, 6).map((l) => (
            <li key={l.id} className="flex items-center gap-2 text-[12px]">
              <span className={"h-1.5 w-1.5 shrink-0 rounded-full " + (dot[l.severity ?? "warn"] ?? "bg-white/40")} />
              <span className="text-white/80">{l.text}</span>
            </li>
          ))}
        </ul>
      )}
    </GlassPanel>
  );
}
