import * as React from "react";
import { cn } from "@/lib/utils";

/** The Council seal: a ring of 12 (one per agent) around a gavel. */
export function CouncilMark({ className }: { className?: string }) {
  const dots = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const r = 20;
    return {
      cx: 24 + Math.cos(angle) * r,
      cy: 24 + Math.sin(angle) * r,
      key: i,
    };
  });
  return (
    <svg viewBox="0 0 48 48" className={cn("h-8 w-8", className)} fill="none" aria-hidden>
      <circle cx="24" cy="24" r="23" className="stroke-gold/50" strokeWidth="1" />
      <circle cx="24" cy="24" r="17.5" className="stroke-gold/30" strokeWidth="1" />
      {dots.map((d, i) => (
        <circle
          key={d.key}
          cx={d.cx}
          cy={d.cy}
          r={i === 0 ? 1.9 : 1.3}
          className={i === 0 ? "fill-gold" : "fill-current opacity-70"}
        />
      ))}
      {/* gavel */}
      <g className="stroke-gold" strokeWidth="2.1" strokeLinecap="round">
        <line x1="18" y1="18" x2="26" y2="26" />
        <line x1="20.5" y1="15.5" x2="28.5" y2="23.5" />
        <line x1="26" y1="28" x2="31" y2="33" className="stroke-current opacity-80" />
      </g>
      <circle cx="31.5" cy="33.5" r="2.2" className="fill-gold" />
    </svg>
  );
}

export function Logo({
  className,
  showText = true,
  textClassName,
  size = "md",
}: {
  className?: string;
  showText?: boolean;
  textClassName?: string;
  size?: "sm" | "md" | "lg";
}) {
  const markSize = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-10 w-10" : "h-8 w-8";
  const textSize = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg";
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <CouncilMark className={markSize} />
      {showText && (
        <span className={cn("font-display font-semibold tracking-tight leading-none", textSize, textClassName)}>
          Calendar Council
        </span>
      )}
    </span>
  );
}
