import { useState } from "react";
import { cn } from "@cursor-distorter/ui";
import { StatusPanel } from "./StatusPanel";
import { PresetPicker } from "./PresetPicker";
import { EffectMixer } from "./EffectMixer";
import { PrioritiesPanel } from "./PrioritiesPanel";
import { SessionAnalytics } from "./SessionAnalytics";
import { ConfidencePanel } from "./ConfidencePanel";
import { ModelFeed } from "./ModelFeed";
import { CursorMap } from "./CursorMap";
import { PrivacyPanel } from "./PrivacyPanel";
import { SystemModePanel } from "./SystemModePanel";

type Tab = "overview" | "presets" | "mixer" | "analytics" | "priorities";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "presets", label: "Presets" },
  { id: "mixer", label: "Mixer" },
  { id: "analytics", label: "Analytics" },
  { id: "priorities", label: "Setup" },
];

export function ControlRail() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 gap-1 border-b border-white/8 px-2 pb-2 pt-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors",
              tab === t.id ? "bg-brand-500/20 text-brand-200" : "text-ink-500 hover:text-white/80",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {tab === "overview" && (
          <>
            <StatusPanel />
            <CursorMap />
            <ConfidencePanel />
            <ModelFeed />
          </>
        )}
        {tab === "presets" && (
          <>
            <PresetPicker />
            <SystemModePanel />
          </>
        )}
        {tab === "mixer" && <EffectMixer />}
        {tab === "analytics" && (
          <>
            <SessionAnalytics />
            <CursorMap />
          </>
        )}
        {tab === "priorities" && (
          <>
            <PrioritiesPanel />
            <PrivacyPanel />
          </>
        )}
      </div>
    </div>
  );
}
