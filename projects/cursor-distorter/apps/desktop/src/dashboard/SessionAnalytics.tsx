import { GlassPanel } from "@cursor-distorter/ui";
import { averageDisagreement } from "@cursor-distorter/shared-types";
import { useStore } from "../state/store";
import { AreaChart, normalize, useHistory } from "./charts";

const read = () => useStore.getState().stats;

function Graph({ title, value, data, tone, autoNorm = true }: {
  title: string;
  value: string;
  data: number[];
  tone: "brand" | "cyan" | "violet" | "amber" | "rose" | "ok" | "bad";
  autoNorm?: boolean;
}) {
  const series = autoNorm ? normalize(data) : data;
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[11px] text-ink-500">{title}</span>
        <span className="stat-num text-[12px] font-medium text-white/85">{value}</span>
      </div>
      <AreaChart data={series} tone={tone} height={40} />
    </div>
  );
}

/** Convincingly meaningless, genuinely live analytics. */
export function SessionAnalytics() {
  const trust = useHistory(() => read().trustScore / 100);
  const productivity = useHistory(() => read().productivityLostMs);
  const frustration = useHistory(() => read().frustration);
  const disagreement = useHistory(() => averageDisagreement(read()));
  const accuracy = useHistory(() => 1 - Math.min(1, averageDisagreement(read()) / 80));
  const responsibility = useHistory(() => read().responsibilityAvoided);

  const stats = useStore((s) => s.stats);

  return (
    <GlassPanel title="Session analytics" subtitle="Longitudinal obstruction metrics">
      <div className="grid grid-cols-2 gap-2">
        <Graph title="Cursor trust over time" value={`${Math.round(stats.trustScore)}%`} data={trust} tone="ok" autoNorm={false} />
        <Graph title="Accuracy degradation" value={`${Math.round((1 - (accuracy.at(-1) ?? 1)) * 100)}%`} data={accuracy} tone="rose" autoNorm={false} />
        <Graph title="Productivity interception" value={`${(stats.productivityLostMs / 1000).toFixed(1)}s`} data={productivity} tone="violet" />
        <Graph title="Pointer alignment variance" value={`${Math.round(averageDisagreement(stats))}px`} data={disagreement} tone="cyan" />
        <Graph title="User frustration estimate" value={`${Math.round(stats.frustration * 100)}%`} data={frustration} tone="amber" autoNorm={false} />
        <Graph title="Avoided responsibility" value={`${stats.responsibilityAvoided}`} data={responsibility} tone="brand" />
      </div>
    </GlassPanel>
  );
}
