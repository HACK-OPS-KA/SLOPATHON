import { GlassPanel, cn } from "@cursor-distorter/ui";
import type { PriorityTag } from "@cursor-distorter/shared-types";
import { useStore } from "../state/store";

const PRIORITIES: { tag: PriorityTag; label: string }[] = [
  { tag: "work", label: "Work" },
  { tag: "communication", label: "Communication" },
  { tag: "popups", label: "Closing popups" },
  { tag: "calendar", label: "Calendar" },
  { tag: "files", label: "File organization" },
  { tag: "design", label: "Design work" },
  { tag: "spreadsheets", label: "Spreadsheets" },
  { tag: "coding", label: "Coding" },
  { tag: "forms", label: "Forms" },
  { tag: "important", label: "Anything important" },
];

export function PrioritiesPanel() {
  const priorities = useStore((s) => s.priorities);
  const toggle = useStore((s) => s.togglePriority);

  return (
    <GlassPanel title="User priorities" subtitle="What should the cursor sabotage most?">
      <div className="flex flex-wrap gap-2">
        {PRIORITIES.map((p) => {
          const on = priorities.includes(p.tag);
          return (
            <button
              key={p.tag}
              onClick={() => toggle(p.tag)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[12px] transition-colors",
                on
                  ? "border-accent-violet/50 bg-accent-violet/20 text-white"
                  : "border-white/10 bg-white/[0.03] text-ink-500 hover:text-white/80",
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-ink-500">
        Prioritized targets are avoided more aggressively and repelled with additional prejudice.
      </p>
    </GlassPanel>
  );
}
