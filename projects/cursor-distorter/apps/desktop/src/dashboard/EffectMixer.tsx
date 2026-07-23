import { useState } from "react";
import { GlassPanel, Slider, Toggle, cn } from "@cursor-distorter/ui";
import { EFFECT_CATALOG, type EffectInfo, type ParamSpec } from "@cursor-distorter/cursor-effects";
import type { EffectId } from "@cursor-distorter/shared-types";
import { useStore } from "../state/store";

const catColor: Record<string, string> = {
  movement: "text-accent-cyan",
  click: "text-accent-rose",
  visual: "text-accent-violet",
  analytics: "text-signal-warn",
};

export function EffectMixer() {
  const [expanded, setExpanded] = useState<EffectId | null>(null);

  return (
    <GlassPanel title="Effect mixer" subtitle="Twelve individually configurable modules" bodyClassName="p-0">
      <div className="divide-y divide-white/[0.05]">
        {EFFECT_CATALOG.map((info) => (
          <EffectRow
            key={info.id}
            info={info}
            expanded={expanded === info.id}
            onExpand={() => setExpanded((e) => (e === info.id ? null : info.id))}
          />
        ))}
      </div>
    </GlassPanel>
  );
}

function EffectRow({ info, expanded, onExpand }: { info: EffectInfo; expanded: boolean; onExpand: () => void }) {
  const cfg = useStore((s) => s.effects[info.id]);
  const active = useStore((s) => s.activeContributors.includes(info.id));
  const toggle = useStore((s) => s.toggleEffect);
  const setCfg = useStore((s) => s.setEffectConfig);

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-3">
        <span className={cn("w-5 text-center text-base", catColor[info.category])}>{info.icon}</span>
        <button className="flex-1 text-left" onClick={onExpand}>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-white/90">{info.name}</span>
            {cfg.enabled && active && (
              <span className="h-1.5 w-1.5 animate-pulse-ring rounded-full bg-signal-ok" title="contributing" />
            )}
          </div>
          <div className="truncate text-[11px] text-ink-500">{info.description}</div>
        </button>
        <Toggle checked={cfg.enabled} onChange={() => toggle(info.id)} label={info.name} />
      </div>

      {cfg.enabled && (
        <div className="mt-3 space-y-2.5 pl-8">
          <Slider
            label="Intensity"
            min={0}
            max={1}
            step={0.05}
            value={cfg.intensity}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => setCfg(info.id, { intensity: v })}
          />
          <Slider
            label="Probability"
            min={0}
            max={1}
            step={0.05}
            value={cfg.probability}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => setCfg(info.id, { probability: v })}
          />
          {expanded && info.params.map((p) => <ParamControl key={p.key} info={info} spec={p} />)}
          {info.params.length > 0 && (
            <button className="text-[11px] text-brand-300 hover:underline" onClick={onExpand}>
              {expanded ? "Hide parameters" : `${info.params.length} more parameter${info.params.length > 1 ? "s" : ""}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ParamControl({ info, spec }: { info: EffectInfo; spec: ParamSpec }) {
  const cfg = useStore((s) => s.effects[info.id]);
  const setCfg = useStore((s) => s.setEffectConfig);
  const raw = cfg.params?.[spec.key];

  if (spec.kind === "range") {
    const value = typeof raw === "number" ? raw : (spec.min ?? 0);
    return (
      <Slider
        label={spec.label}
        min={spec.min ?? 0}
        max={spec.max ?? 100}
        step={spec.step ?? 1}
        unit={spec.unit}
        value={value}
        onChange={(v) => setCfg(info.id, { params: { [spec.key]: v } })}
      />
    );
  }
  if (spec.kind === "toggle") {
    const value = typeof raw === "boolean" ? raw : false;
    return (
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-ink-500">{spec.label}</span>
        <Toggle checked={value} onChange={(v) => setCfg(info.id, { params: { [spec.key]: v } })} label={spec.label} />
      </div>
    );
  }
  // select
  const value = typeof raw === "string" ? raw : (spec.options?.[0]?.value ?? "");
  return (
    <label className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-ink-500">{spec.label}</span>
      <select
        value={value}
        onChange={(e) => setCfg(info.id, { params: { [spec.key]: e.target.value } })}
        className="rounded-md border border-white/10 bg-ink-800 px-2 py-1 text-[11px] text-white/85 outline-none"
      >
        {spec.options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
