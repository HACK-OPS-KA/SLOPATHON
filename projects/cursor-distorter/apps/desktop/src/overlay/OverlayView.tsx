import { useEffect, useRef } from "react";

/** The shared white cursor arrow used throughout the app. */
function CursorArrow() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.55))" }}
    >
      <path
        d="M4 2 L4 20.5 L9.2 15.3 L12.7 22.2 L15.3 21 L11.8 14.2 L18.6 14.2 Z"
        fill="#ffffff"
        stroke="#0a0c14"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Offsets (px) applied to the ghost/decoy cursors relative to the real point.
const GHOSTS: ReadonlyArray<{ dx: number; dy: number; opacity: number }> = [
  { dx: 22, dy: 14, opacity: 0.62 },
  { dx: -18, dy: 24, opacity: 0.42 },
];

/**
 * Full-screen, click-through overlay surface rendered inside the transparent
 * Electron overlay window (`?overlay=1`). It receives the real pointer position
 * from the main process via `onOverlayCursor` and paints the true cursor plus a
 * couple of decoy cursors. All updates are imperative (refs + rAF) so nothing
 * re-renders per frame.
 */
export function OverlayView() {
  const realRef = useRef<HTMLDivElement | null>(null);
  const ghostRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const bridge = window.cursorDistorter as
      | (Window["cursorDistorter"] & {
          onOverlayCursor?: (
            cb: (p: { x: number; y: number }) => void,
          ) => () => void;
        })
      | undefined;

    let raf = 0;
    let pending: { x: number; y: number } | null = null;

    const paint = () => {
      raf = 0;
      const p = pending;
      if (!p) return;
      const real = realRef.current;
      if (real) {
        real.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
      }
      GHOSTS.forEach((g, i) => {
        const node = ghostRefs.current[i];
        if (node) {
          node.style.transform = `translate3d(${p.x + g.dx}px, ${p.y + g.dy}px, 0)`;
        }
      });
    };

    const onCursor = (p: { x: number; y: number }) => {
      pending = p;
      if (!raf) raf = requestAnimationFrame(paint);
    };

    const unsub = bridge?.onOverlayCursor?.(onCursor);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      unsub?.();
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        background: "transparent",
      }}
    >
      {GHOSTS.map((g, i) => (
        <div
          key={i}
          ref={(node) => {
            ghostRefs.current[i] = node;
          }}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            willChange: "transform",
            opacity: g.opacity,
          }}
        >
          <CursorArrow />
        </div>
      ))}
      <div
        ref={realRef}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          willChange: "transform",
        }}
      >
        <CursorArrow />
      </div>
    </div>
  );
}
