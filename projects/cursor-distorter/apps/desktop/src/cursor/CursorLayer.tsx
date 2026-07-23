import { useEffect, useRef, type MutableRefObject } from "react";

export interface CursorFrame {
  visible: boolean;
  /** Index 0 is the primary cursor; up to two ghosts follow. */
  cursors: { x: number; y: number; opacity: number }[];
  bubble: { x: number; y: number; text: string } | null;
  spinner: { x: number; y: number } | null;
}

export interface CursorLayerApi {
  render(frame: CursorFrame): void;
  spawnClick(x: number, y: number, variant: "real" | "fake" | "ghost"): void;
}

const MAX_CURSORS = 3;

/** The rendered-cursor overlay. Driven imperatively at 60fps via `apiRef`. */
export function CursorLayer({ apiRef }: { apiRef: MutableRefObject<CursorLayerApi | null> }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const cursorRefs = useRef<(HTMLDivElement | null)[]>([]);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const bubbleTextRef = useRef<HTMLSpanElement | null>(null);
  const spinnerRef = useRef<HTMLDivElement | null>(null);
  const lastBubbleText = useRef<string>("");

  useEffect(() => {
    const api: CursorLayerApi = {
      render(frame) {
        const root = rootRef.current;
        if (!root) return;
        root.style.opacity = frame.visible ? "1" : "0";

        for (let i = 0; i < MAX_CURSORS; i++) {
          const node = cursorRefs.current[i];
          if (!node) continue;
          const c = frame.cursors[i];
          if (c && frame.visible) {
            node.style.display = "block";
            node.style.transform = `translate3d(${c.x}px, ${c.y}px, 0)`;
            node.style.opacity = String(c.opacity);
          } else {
            node.style.display = "none";
          }
        }

        const bubble = bubbleRef.current;
        if (bubble) {
          if (frame.bubble && frame.visible) {
            bubble.style.display = "block";
            bubble.style.transform = `translate3d(${frame.bubble.x}px, ${frame.bubble.y}px, 0)`;
            if (frame.bubble.text !== lastBubbleText.current) {
              lastBubbleText.current = frame.bubble.text;
              if (bubbleTextRef.current) bubbleTextRef.current.textContent = frame.bubble.text;
            }
          } else {
            bubble.style.display = "none";
            lastBubbleText.current = "";
          }
        }

        const spinner = spinnerRef.current;
        if (spinner) {
          if (frame.spinner && frame.visible) {
            spinner.style.display = "block";
            spinner.style.transform = `translate3d(${frame.spinner.x}px, ${frame.spinner.y}px, 0)`;
          } else {
            spinner.style.display = "none";
          }
        }
      },
      spawnClick(x, y, variant) {
        const root = rootRef.current;
        if (!root) return;
        const ripple = document.createElement("div");
        ripple.className = `cd-click-ripple cd-click-${variant}`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        root.appendChild(ripple);
        window.setTimeout(() => ripple.remove(), 520);
      },
    };
    apiRef.current = api;
    return () => {
      apiRef.current = null;
    };
  }, [apiRef]);

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute inset-0 z-[60] overflow-hidden transition-opacity duration-150"
      aria-hidden
    >
      {Array.from({ length: MAX_CURSORS }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            cursorRefs.current[i] = el;
          }}
          data-cd-cursor={i}
          className="absolute left-0 top-0 will-change-transform"
          style={{ display: "none" }}
        >
          <CursorArrow />
        </div>
      ))}

      <div
        ref={bubbleRef}
        className="absolute left-0 top-0 will-change-transform"
        style={{ display: "none" }}
      >
        <div className="cd-bubble">
          <span ref={bubbleTextRef} />
        </div>
      </div>

      <div
        ref={spinnerRef}
        className="absolute left-0 top-0 will-change-transform"
        style={{ display: "none" }}
      >
        <div className="cd-mini-spinner" />
      </div>
    </div>
  );
}

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
