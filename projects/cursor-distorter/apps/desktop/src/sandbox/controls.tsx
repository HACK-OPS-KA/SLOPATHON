import { useRef, useState, type ReactNode } from "react";
import { cn } from "@cursor-distorter/ui";
import type { PriorityTag } from "@cursor-distorter/shared-types";
import { useRegistry, useTarget, type ActivateInfo } from "../cursor/registry";

type ButtonTone = "default" | "primary" | "danger" | "ghost" | "subtle" | "win";

const toneClass: Record<ButtonTone, string> = {
  default:
    "bg-white/[0.05] text-white/85 border border-white/10 hover:bg-white/[0.08]",
  primary: "bg-brand-500 text-white border border-brand-400/40 shadow-glow",
  danger: "bg-signal-bad/90 text-white border border-red-300/30",
  ghost: "bg-transparent text-ink-500 border border-transparent hover:text-white/80",
  subtle: "bg-white/[0.03] text-white/70 border border-white/[0.06]",
  win: "bg-white text-ink-900 border border-black/10 shadow-sm hover:brightness-95",
};

export function SbButton({
  id,
  importance = 0.6,
  priorityTag,
  tone = "default",
  kind = "button",
  isEscapeHatch,
  disabled,
  className,
  children,
  onActivate,
}: {
  id: string;
  importance?: number;
  priorityTag?: PriorityTag;
  tone?: ButtonTone;
  kind?: "button" | "submit" | "danger" | "link" | "close";
  isEscapeHatch?: boolean;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
  onActivate?: (info: ActivateInfo) => void;
}) {
  const ref = useTarget({
    id,
    kind,
    importance,
    priorityTag,
    isEscapeHatch,
    disabled,
    onActivate: (info) => onActivate?.(info),
  });
  return (
    <div
      ref={ref}
      role="button"
      aria-disabled={disabled}
      data-cd-id={id}
      className={cn(
        "cd-ctl inline-flex select-none items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium",
        toneClass[tone],
        disabled && "pointer-events-none opacity-40",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SbCheckbox({
  id,
  checked,
  onChange,
  label,
  importance = 0.45,
  priorityTag,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
  importance?: number;
  priorityTag?: PriorityTag;
}) {
  const ref = useTarget({
    id,
    kind: "checkbox",
    importance,
    priorityTag,
    onActivate: () => onChange(!checked),
  });
  return (
    <div ref={ref} className="cd-ctl flex cursor-pointer select-none items-center gap-2.5 rounded-md py-1">
      <span
        className={cn(
          "flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border text-[11px]",
          checked ? "border-brand-400 bg-brand-500 text-white" : "border-white/25 bg-white/[0.04]",
        )}
      >
        {checked ? "✓" : ""}
      </span>
      <span className="text-[13px] text-white/80">{label}</span>
    </div>
  );
}

export function SbClose({
  id,
  onActivate,
  isEscapeHatch,
  className,
}: {
  id: string;
  onActivate?: (info: ActivateInfo) => void;
  isEscapeHatch?: boolean;
  className?: string;
}) {
  const ref = useTarget({
    id,
    kind: "close",
    importance: 0.5,
    isEscapeHatch,
    onActivate: (info) => onActivate?.(info),
  });
  return (
    <div
      ref={ref}
      role="button"
      aria-label="Close"
      className={cn(
        "cd-ctl flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white/10 text-[10px] text-white/70 hover:bg-white/20",
        className,
      )}
    >
      ✕
    </div>
  );
}

/** Fake traffic-light window controls. Only the red one closes. */
export function WindowDots({ id, onClose }: { id: string; onClose?: () => void }) {
  const ref = useTarget({
    id: `${id}-close`,
    kind: "close",
    importance: 0.4,
    onActivate: () => onClose?.(),
  });
  return (
    <div className="flex items-center gap-1.5">
      <div ref={ref} className="cd-ctl h-3 w-3 rounded-full bg-[#ff5f57]" />
      <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
      <div className="h-3 w-3 rounded-full bg-[#28c840]" />
    </div>
  );
}

export function SbWindow({
  id,
  title,
  onClose,
  className,
  style,
  bodyClassName,
  children,
  accent,
}: {
  id: string;
  title: ReactNode;
  onClose?: () => void;
  className?: string;
  style?: React.CSSProperties;
  bodyClassName?: string;
  children: ReactNode;
  accent?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-white/10 bg-ink-850/95 shadow-glass backdrop-blur-md",
        className,
      )}
      style={style}
    >
      <div className="flex items-center gap-3 border-b border-white/8 bg-white/[0.03] px-3 py-2">
        <WindowDots id={id} onClose={onClose} />
        <div className="flex-1 truncate text-center text-[12px] font-medium text-white/60">{title}</div>
        <div className="w-8 text-right text-[11px] text-ink-500">{accent}</div>
      </div>
      <div className={cn("flex-1 p-4", bodyClassName)}>{children}</div>
    </div>
  );
}

/** A click-to-set slider; imprecision makes the value land where you did not intend. */
export function SbSlider({
  id,
  value,
  min = 0,
  max = 100,
  onChange,
  label,
}: {
  id: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  label?: ReactNode;
}) {
  const reg = useRegistry();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const setRef = useTarget({
    id,
    kind: "toggle",
    importance: 0.4,
    onActivate: (info) => {
      const rect = reg.clickableById(id);
      if (!rect) return;
      const pct = Math.max(0, Math.min(1, (info.point.x - rect.rect.x) / rect.rect.width));
      onChange(Math.round(min + pct * (max - min)));
    },
  });
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      {label && (
        <div className="mb-1.5 flex justify-between text-[11px] text-ink-500">
          <span>{label}</span>
          <span className="stat-num text-white/80">{value}</span>
        </div>
      )}
      <div
        ref={(el) => {
          trackRef.current = el;
          setRef(el);
        }}
        className="cd-ctl relative h-6 cursor-pointer rounded-full bg-white/[0.06]"
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-brand-500/70"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow"
          style={{ left: `calc(${pct}% - 8px)` }}
        />
      </div>
    </div>
  );
}

export function SbDropdown({
  id,
  value,
  options,
  onChange,
  label,
}: {
  id: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  label?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <div className="relative">
      {label && <div className="mb-1 text-[11px] text-ink-500">{label}</div>}
      <SbButton
        id={id}
        tone="subtle"
        importance={0.5}
        className="w-full justify-between"
        onActivate={() => setOpen((o) => !o)}
      >
        <span className="text-white/85">{current?.label ?? "Select…"}</span>
        <span className="text-ink-500">▾</span>
      </SbButton>
      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-white/10 bg-ink-800 shadow-glass">
          {options.map((o) => (
            <SbButton
              key={o.value}
              id={`${id}-opt-${o.value}`}
              tone="ghost"
              importance={0.4}
              className="w-full justify-start rounded-none"
              onActivate={() => {
                onChange(o.value);
                setOpen(false);
              }}
            >
              {o.label}
            </SbButton>
          ))}
        </div>
      )}
    </div>
  );
}

/** A draggable object (file icon, calendar event). Follows the rendered cursor. */
export function SbDraggable({
  id,
  importance = 0.5,
  priorityTag,
  onDrop,
  onDragStart,
  className,
  children,
}: {
  id: string;
  importance?: number;
  priorityTag?: PriorityTag;
  onDrop: (zoneId: string | null) => void;
  onDragStart?: () => void;
  className?: string;
  children: ReactNode;
}) {
  const ref = useTarget({
    id,
    kind: "icon",
    importance,
    priorityTag,
    draggable: true,
    onDragStart,
    onDrop,
  });
  return (
    <div ref={ref} className={cn("cd-ctl cursor-grab select-none", className)} data-cd-id={id}>
      {children}
    </div>
  );
}
