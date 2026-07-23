import { GlassPanel, cn } from "@cursor-distorter/ui";
import { listPresets } from "@cursor-distorter/chaos-engine";
import { useStore } from "../state/store";

export function PresetPicker() {
  const presetId = useStore((s) => s.presetId);
  const applyPreset = useStore((s) => s.applyPreset);
  const arm = useStore((s) => s.arm);
  const presets = listPresets();

  return (
    <GlassPanel title="Presets" subtitle="Curated experiences in obstruction">
      <div className="grid grid-cols-1 gap-2">
        {presets.map((p) => {
          const selected = presetId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => {
                applyPreset(p.id);
                arm();
              }}
              className={cn(
                "group rounded-xl border px-3.5 py-3 text-left transition-colors",
                selected
                  ? "border-brand-400/50 bg-brand-500/15"
                  : "border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-white/90">{p.name}</span>
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-wider",
                    selected ? "text-brand-300" : "text-ink-500",
                  )}
                >
                  {selected ? "Active" : `${Math.round(p.intensity * 100)}%`}
                </span>
              </div>
              <div className="mt-0.5 text-[11px] italic text-ink-500">{p.tagline}</div>
            </button>
          );
        })}
      </div>
    </GlassPanel>
  );
}
