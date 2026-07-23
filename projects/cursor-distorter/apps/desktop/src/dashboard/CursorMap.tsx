import { useEffect, useRef, useState } from "react";
import { GlassPanel } from "@cursor-distorter/ui";
import { useStore } from "../state/store";

interface Trail {
  real: { x: number; y: number };
  render: { x: number; y: number };
}

/** Live cursor map: real pointer path vs rendered path, with disagreement vectors. */
export function CursorMap() {
  const sample = useStore((s) => s.sample);
  const [trail, setTrail] = useState<Trail[]>([]);
  const lastRef = useRef<Trail | null>(null);

  useEffect(() => {
    if (!sample) return;
    lastRef.current = sample;
    setTrail((t) => {
      const next = [...t, sample];
      return next.length > 46 ? next.slice(next.length - 46) : next;
    });
  }, [sample]);

  const W = 200;
  const H = 120;
  const px = (n: number) => n * W;
  const py = (n: number) => n * H;

  const realPath = trail.map((p, i) => `${i === 0 ? "M" : "L"}${px(p.real.x).toFixed(1)},${py(p.real.y).toFixed(1)}`).join(" ");
  const renderPath = trail.map((p, i) => `${i === 0 ? "M" : "L"}${px(p.render.x).toFixed(1)},${py(p.render.y).toFixed(1)}`).join(" ");
  const cur = trail.at(-1);

  return (
    <GlassPanel title="Live cursor map" subtitle="Intended vs. executed pointer path">
      <div className="relative overflow-hidden rounded-lg border border-white/8 bg-black/30">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" style={{ aspectRatio: `${W}/${H}` }}>
          <defs>
            <pattern id="cd-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M20 0 L0 0 0 20" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#cd-grid)" />
          {trail.length > 1 && (
            <>
              <path d={realPath} fill="none" stroke="#38e1c8" strokeWidth="1.2" opacity="0.75" />
              <path d={renderPath} fill="none" stroke="#a983ff" strokeWidth="1.2" opacity="0.9" />
            </>
          )}
          {cur && (
            <>
              <line x1={px(cur.real.x)} y1={py(cur.real.y)} x2={px(cur.render.x)} y2={py(cur.render.y)} stroke="#ff6b8b" strokeWidth="1" strokeDasharray="2 2" />
              <circle cx={px(cur.real.x)} cy={py(cur.real.y)} r="2.6" fill="#38e1c8" />
              <circle cx={px(cur.render.x)} cy={py(cur.render.y)} r="2.6" fill="#a983ff" />
            </>
          )}
        </svg>
        {!cur && (
          <div className="absolute inset-0 flex items-center justify-center text-[11px] text-ink-500">
            Move the pointer over the sandbox
          </div>
        )}
      </div>
      <div className="mt-2 flex items-center gap-4 text-[10px] text-ink-500">
        <Legend color="#38e1c8" label="Intended (real)" />
        <Legend color="#a983ff" label="Executed (rendered)" />
        <Legend color="#ff6b8b" label="Disagreement" />
      </div>
    </GlassPanel>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-1.5 w-3 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
