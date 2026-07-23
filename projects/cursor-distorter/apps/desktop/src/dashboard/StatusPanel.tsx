import { GlassPanel, Pill, StatTile } from "@cursor-distorter/ui";
import { averageDisagreement } from "@cursor-distorter/shared-types";
import { PRESETS } from "@cursor-distorter/chaos-engine";
import { useStore } from "../state/store";
import { RadialGauge } from "./charts";
import { humanDuration, mmss } from "./format";

export function StatusPanel() {
  const active = useStore((s) => s.active);
  const presetId = useStore((s) => s.presetId);
  const intensity = useStore((s) => s.intensity);
  const stats = useStore((s) => s.stats);
  const remainingMs = useStore((s) => s.remainingMs);
  const contributors = useStore((s) => s.activeContributors);

  return (
    <GlassPanel
      title="Status"
      subtitle="Real-time obstruction telemetry"
      right={
        <Pill tone={active ? "bad" : "neutral"}>
          <span className={active ? "text-signal-bad" : "text-ink-500"}>●</span>
          {active ? "Distortion active" : "Standby"}
        </Pill>
      }
    >
      <div className="flex items-center gap-4">
        <RadialGauge value={intensity} label={`${Math.round(intensity * 100)}`} sub="chaos" tone="brand" />
        <div className="flex-1 space-y-1.5 text-[12px]">
          <Row k="Preset" v={presetId ? PRESETS[presetId].name : "Custom"} />
          <Row k="Active effects" v={`${contributors.length}`} />
          <Row k="Session remaining" v={mmss(remainingMs)} />
          <Row k="Cursor-user trust" v={`${Math.round(stats.trustScore)} / 100`} tone={stats.trustScore < 50 ? "bad" : "ok"} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <StatTile label="Productivity intercepted" value={humanDuration(stats.productivityLostMs)} tone="violet" />
        <StatTile label="Successful clicks prevented" value={stats.preventedClicks} tone="warn" />
        <StatTile label="Accidental clicks generated" value={stats.accidentalClicks} tone="bad" />
        <StatTile
          label="Avg pointer disagreement"
          value={`${Math.round(averageDisagreement(stats))} px`}
          tone="cyan"
        />
      </div>
    </GlassPanel>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: "ok" | "bad" }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-500">{k}</span>
      <span
        className={
          "stat-num font-medium " +
          (tone === "bad" ? "text-signal-bad" : tone === "ok" ? "text-signal-ok" : "text-white/85")
        }
      >
        {v}
      </span>
    </div>
  );
}
