import { useEffect, useRef, useState } from "react";
import { clamp01 } from "./format";

type Tone = "brand" | "cyan" | "violet" | "amber" | "rose" | "ok" | "bad";

const STROKE: Record<Tone, string> = {
  brand: "#6f92ff",
  cyan: "#38e1c8",
  violet: "#a983ff",
  amber: "#ffbf47",
  rose: "#ff6b8b",
  ok: "#3fe08a",
  bad: "#ff5c72",
};

/** A small filled area chart over a normalized (0..1) series. */
export function AreaChart({ data, tone = "brand", height = 44 }: { data: number[]; tone?: Tone; height?: number }) {
  const w = 100;
  const h = 36;
  const id = useRef(`g${Math.round(data.length * 97 + w)}-${tone}`).current;
  if (data.length < 2) {
    return <div style={{ height }} className="rounded-md bg-white/[0.02]" />;
  }
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - clamp01(v) * (h - 3) - 1.5;
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const color = STROKE[tone];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ height, width: "100%" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** A radial gauge (0..1). */
export function RadialGauge({
  value,
  label,
  sub,
  tone = "brand",
  size = 96,
}: {
  value: number;
  label: string;
  sub?: string;
  tone?: Tone;
  size?: number;
}) {
  const r = 40;
  const c = 2 * Math.PI * r;
  const v = clamp01(value);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={STROKE[tone]}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          style={{ transition: "stroke-dashoffset 300ms ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="stat-num text-xl font-semibold text-white">{label}</span>
        {sub && <span className="text-[10px] text-ink-500">{sub}</span>}
      </div>
    </div>
  );
}

/**
 * Samples a store-derived value on an interval into a rolling history for the charts.
 */
export function useHistory(sample: () => number, len = 48, intervalMs = 480): number[] {
  const [hist, setHist] = useState<number[]>([]);
  const sampleRef = useRef(sample);
  sampleRef.current = sample;
  useEffect(() => {
    const t = window.setInterval(() => {
      setHist((h) => {
        const next = [...h, sampleRef.current()];
        return next.length > len ? next.slice(next.length - len) : next;
      });
    }, intervalMs);
    return () => window.clearInterval(t);
  }, [len, intervalMs]);
  return hist;
}

/** Normalize an arbitrary series into 0..1 for display. */
export function normalize(series: number[], min?: number, max?: number): number[] {
  if (series.length === 0) return series;
  const lo = min ?? Math.min(...series);
  const hi = max ?? Math.max(...series);
  const span = hi - lo || 1;
  return series.map((v) => (v - lo) / span);
}
