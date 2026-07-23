import { GlassPanel } from "@cursor-distorter/ui";
import { useStore } from "../state/store";

const sevColor: Record<string, string> = {
  ok: "text-signal-ok",
  warn: "text-signal-warn",
  bad: "text-signal-bad",
};

const trendGlyph: Record<string, string> = { up: "▲", down: "▼", flat: "▬" };

export function ConfidencePanel() {
  const confidence = useStore((s) => s.confidence);

  return (
    <GlassPanel title="Cursor confidence" subtitle="Analytics with no basis in reality">
      {confidence.length === 0 ? (
        <div className="py-3 text-center text-[12px] text-ink-500">
          Enable Cursor Confidence to receive inconclusive readouts.
        </div>
      ) : (
        <div className="space-y-1.5">
          {confidence.map((r) => (
            <div key={r.id} className="flex items-center justify-between text-[12px]">
              <span className="text-ink-500">{r.label}</span>
              <span className={"stat-num font-medium " + (sevColor[r.severity ?? "warn"] ?? "text-white/80")}>
                {r.trend && <span className="mr-1 text-[9px]">{trendGlyph[r.trend]}</span>}
                {r.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </GlassPanel>
  );
}
