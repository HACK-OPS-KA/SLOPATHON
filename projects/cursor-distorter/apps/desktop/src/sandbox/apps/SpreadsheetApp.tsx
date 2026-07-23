import { useState } from "react";
import { cn } from "@cursor-distorter/ui";
import { useTarget } from "../../cursor/registry";

const COLS = ["A", "B", "C", "D", "E"];
const ROWS = [1, 2, 3, 4, 5, 6];

const SEED_VALUES: Record<string, string> = {
  A1: "Q3",
  B1: "Target",
  C1: "Actual",
  A2: "Clicks",
  B2: "1,000",
  C2: "412",
  A3: "Accuracy",
  B3: "100%",
  C3: "41%",
  A4: "Trust",
  B4: "high",
  C4: "?",
};

function Cell({ id, value, selected, onSelect }: { id: string; value?: string; selected: boolean; onSelect: () => void }) {
  const ref = useTarget({ id, kind: "cell", importance: 0.4, priorityTag: "spreadsheets", onActivate: onSelect });
  return (
    <div
      ref={ref}
      className={cn(
        "cd-ctl flex h-[24px] w-[52px] items-center overflow-hidden whitespace-nowrap border-b border-r border-white/[0.06] px-1.5 text-[11px]",
        selected ? "bg-brand-500/25 text-white" : "text-white/70 hover:bg-white/[0.04]",
      )}
    >
      {value}
    </div>
  );
}

/** A spreadsheet with small cells that are difficult to select precisely. */
export function SpreadsheetApp() {
  const [sel, setSel] = useState<string | null>(null);

  return (
    <div>
      <div className="inline-block overflow-hidden rounded-md border border-white/[0.06]">
        <div className="flex">
          <div className="flex h-[22px] w-[26px] items-center justify-center border-b border-r border-white/[0.06] bg-white/[0.03]" />
          {COLS.map((c) => (
            <div
              key={c}
              className="flex h-[22px] w-[52px] items-center justify-center border-b border-r border-white/[0.06] bg-white/[0.03] text-[10px] text-ink-500"
            >
              {c}
            </div>
          ))}
        </div>
        {ROWS.map((r) => (
          <div key={r} className="flex">
            <div className="flex h-[24px] w-[26px] items-center justify-center border-b border-r border-white/[0.06] bg-white/[0.03] text-[10px] text-ink-500">
              {r}
            </div>
            {COLS.map((c) => {
              const id = `${c}${r}`;
              return (
                <Cell
                  key={id}
                  id={`cell-${id}`}
                  value={SEED_VALUES[id]}
                  selected={sel === id}
                  onSelect={() => setSel(id)}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 text-[11px] text-ink-500">
        Selected: <span className="stat-num text-white/80">{sel ?? "—"}</span>
        {sel && sel !== "C3" && <span className="ml-2 text-signal-warn">(you meant a different cell)</span>}
      </div>
    </div>
  );
}
