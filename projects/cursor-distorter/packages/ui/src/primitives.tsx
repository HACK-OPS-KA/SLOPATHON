import type { ReactNode } from "react";
import { cn } from "./cn";

type Tone = "brand" | "ok" | "warn" | "bad" | "violet" | "cyan" | "neutral";

const toneText: Record<Tone, string> = {
  brand: "text-brand-300",
  ok: "text-signal-ok",
  warn: "text-signal-warn",
  bad: "text-signal-bad",
  violet: "text-accent-violet",
  cyan: "text-accent-cyan",
  neutral: "text-ink-500",
};

const toneBar: Record<Tone, string> = {
  brand: "bg-brand-500",
  ok: "bg-signal-ok",
  warn: "bg-signal-warn",
  bad: "bg-signal-bad",
  violet: "bg-accent-violet",
  cyan: "bg-accent-cyan",
  neutral: "bg-ink-500",
};

export function GlassPanel({
  title,
  subtitle,
  right,
  className,
  bodyClassName,
  children,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children?: ReactNode;
}) {
  return (
    <section className={cn("glass rounded-2xl", className)}>
      {(title || right) && (
        <header className="flex items-start justify-between gap-3 border-b border-white/5 px-5 py-4">
          <div>
            {title && <h3 className="text-sm font-semibold tracking-tight text-white/90">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p>}
          </div>
          {right}
        </header>
      )}
      <div className={cn("px-5 py-4", bodyClassName)}>{children}</div>
    </section>
  );
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("text-[10px] font-semibold uppercase tracking-[0.28em] text-ink-500", className)}>
      {children}
    </div>
  );
}

export function StatTile({
  label,
  value,
  sub,
  tone = "neutral",
  big,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: Tone;
  big?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
      <div className="text-[11px] font-medium text-ink-500">{label}</div>
      <div className={cn("stat-num mt-1 font-semibold", big ? "text-2xl" : "text-lg", toneText[tone])}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[11px] text-ink-500">{sub}</div>}
    </div>
  );
}

export function Meter({ value, tone = "brand", className }: { value: number; tone?: Tone; className?: string }) {
  const pct = Math.max(0, Math.min(100, value * 100));
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]", className)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-300", toneBar[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Pill({ children, tone = "neutral", className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium",
        toneText[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-[22px] w-[40px] shrink-0 items-center rounded-full border transition-colors",
        checked ? "border-brand-500/60 bg-brand-500/80" : "border-white/10 bg-white/[0.06]",
        disabled && "opacity-40",
      )}
    >
      <span
        className={cn(
          "inline-block h-[16px] w-[16px] transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[20px]" : "translate-x-[3px]",
        )}
      />
    </button>
  );
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  unit,
  format,
  disabled,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  label?: string;
  unit?: string;
  format?: (v: number) => string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      {label && (
        <div className="mb-1 flex items-center justify-between text-[11px]">
          <span className="text-ink-500">{label}</span>
          <span className="stat-num font-medium text-white/80">
            {format ? format(value) : value}
            {unit ? ` ${unit}` : ""}
          </span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="cd-range h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/[0.08] accent-brand-500 disabled:opacity-40"
      />
    </label>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "md",
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md font-medium transition-colors",
            size === "sm" ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
            value === o.value ? "bg-brand-500/80 text-white shadow" : "text-ink-500 hover:text-white/80",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
