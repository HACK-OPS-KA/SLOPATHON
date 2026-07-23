import * as React from "react";
import { consensusLabel, consensusTone, cn } from "@/lib/utils";

const TONE_TEXT = {
  bad: "text-oppose",
  warn: "text-conditional",
  good: "text-approve",
} as const;

export function ConsensusMeter({
  value,
  className,
  showLabel = true,
  size = "md",
}: {
  value: number;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const tone = consensusTone(v);
  const label = consensusLabel(v);
  const numSize = size === "lg" ? "text-4xl" : size === "sm" ? "text-xl" : "text-2xl";

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className={cn("font-display font-semibold tabular", numSize, TONE_TEXT[tone])}>{v}%</span>
          {showLabel && <span className="record-label">Consensus</span>}
        </div>
        {showLabel && <span className={cn("text-xs font-medium", TONE_TEXT[tone])}>{label}</span>}
      </div>
      <div className="relative mt-2 h-2 w-full overflow-hidden rounded-full">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "linear-gradient(90deg, hsl(var(--veto)), hsl(var(--oppose)) 22%, hsl(var(--conditional)) 55%, hsl(var(--approve)))",
          }}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out",
            tone === "bad" ? "bg-oppose" : tone === "warn" ? "bg-conditional" : "bg-approve",
          )}
          style={{ width: `${v}%` }}
        />
      </div>
    </div>
  );
}

export function ConsensusPill({ value, className }: { value: number; className?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const tone = consensusTone(v);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium tabular",
        tone === "bad" ? "bg-oppose/15 text-oppose" : tone === "warn" ? "bg-conditional/15 text-conditional" : "bg-approve/15 text-approve",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {v}%
    </span>
  );
}
