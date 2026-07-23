import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@cursor-distorter/ui";
import { useStore } from "../state/store";
import { useTarget, type ActivateInfo } from "../cursor/registry";

/**
 * A button that gently squirms away while the cursor is over it — mildly difficult, but
 * always possible, to click. It stops evading once the session's close-evasion release
 * fires (after three failed close attempts), after which it behaves completely normally.
 * Marked as an escape hatch so global chaos effects never pile on.
 */
export function EvasiveButton({
  id,
  onActivate,
  className,
  children,
  radius = 26,
  importance = 0.9,
  alwaysEvade = false,
}: {
  id: string;
  onActivate?: (info: ActivateInfo) => void;
  className?: string;
  children: ReactNode;
  radius?: number;
  importance?: number;
  alwaysEvade?: boolean;
}) {
  const released = useStore((s) => s.closeEvasionReleased);
  const elRef = useRef<HTMLDivElement | null>(null);
  const setTargetRef = useTarget({
    id,
    kind: "close",
    importance,
    isEscapeHatch: true,
    onActivate: (info) => onActivate?.(info),
  });

  const evade = alwaysEvade ? true : !released;
  const evadeRef = useRef(evade);
  evadeRef.current = evade;

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    el.dataset.cdSelfmove = "1";
    let raf = 0;
    let curX = 0;
    let curY = 0;
    let tgtX = 0;
    let tgtY = 0;
    let nextChange = 0;

    const step = () => {
      const now = performance.now();
      const hovered = el.dataset.cdHover === "1";
      if (evadeRef.current && hovered) {
        if (now > nextChange) {
          const angle = Math.random() * Math.PI * 2;
          const mag = radius * (0.6 + Math.random() * 0.4);
          tgtX = Math.cos(angle) * mag;
          tgtY = Math.sin(angle) * mag;
          nextChange = now + 220 + Math.random() * 260;
        }
      } else {
        tgtX = 0;
        tgtY = 0;
      }
      curX += (tgtX - curX) * 0.25;
      curY += (tgtY - curY) * 0.25;
      el.style.transform =
        Math.abs(curX) < 0.1 && Math.abs(curY) < 0.1
          ? ""
          : `translate(${curX.toFixed(1)}px, ${curY.toFixed(1)}px)`;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [radius]);

  return (
    <div
      ref={(el) => {
        elRef.current = el;
        setTargetRef(el);
      }}
      role="button"
      data-cd-id={id}
      className={cn("cd-ctl select-none", className)}
    >
      {children}
    </div>
  );
}
