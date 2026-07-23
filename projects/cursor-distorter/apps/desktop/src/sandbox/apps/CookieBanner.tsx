import { useState } from "react";
import { SbButton } from "../controls";

/**
 * Fake cookie banner. "Accept all" is large and stable; "Reject all" is small and,
 * once distortion is armed, mildly evasive (via repulsion/imprecision).
 */
export function CookieBanner() {
  const [choice, setChoice] = useState<"accept" | "reject" | null>(null);

  if (choice) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[12px] text-ink-500">
        <span className="text-accent-cyan">●</span>
        Preferences saved:{" "}
        <span className="text-white/80">
          {choice === "accept" ? "All cookies accepted." : "Only strictly necessary… allegedly."}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-ink-800/95 p-3.5 shadow-glass backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div className="max-w-[62%]">
          <div className="text-[13px] font-semibold text-white/90">We value your pointer.</div>
          <p className="mt-0.5 text-[11.5px] leading-snug text-ink-500">
            We use cookies to personalize your inconvenience. By continuing, you consent to a more
            innovative click experience.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <SbButton
            id="cookie-accept"
            tone="primary"
            importance={0.15}
            priorityTag="popups"
            className="px-5 py-2.5"
            onActivate={() => setChoice("accept")}
          >
            Accept all
          </SbButton>
          <div className="flex items-center gap-2">
            <SbButton
              id="cookie-manage"
              tone="ghost"
              importance={0.4}
              priorityTag="popups"
              className="px-2 py-1 text-[11px]"
              onActivate={() => setChoice("accept")}
            >
              Manage
            </SbButton>
            <SbButton
              id="cookie-reject"
              tone="ghost"
              importance={0.85}
              priorityTag="popups"
              className="px-2 py-1 text-[11px] text-ink-500"
              onActivate={() => setChoice("reject")}
            >
              Reject all
            </SbButton>
          </div>
        </div>
      </div>
    </div>
  );
}
