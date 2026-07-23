import { useState } from "react";
import { SbButton } from "../controls";
import { EvasiveButton } from "../EvasiveButton";

/** A promotional popup that is difficult — but, after three tries, possible — to close. */
export function EvasivePopup() {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  return (
    <div className="relative w-full max-w-[320px] rounded-xl border border-white/12 bg-ink-800 p-4 shadow-glass">
      <div className="flex items-start justify-between">
        <div className="text-[13px] font-semibold text-white/90">Your pointer may be eligible.</div>
        <EvasiveButton
          id="popup-close"
          onActivate={() => setOpen(false)}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[11px] text-white/70"
        >
          ✕
        </EvasiveButton>
      </div>
      <p className="mt-1 text-[11.5px] leading-snug text-ink-500">
        Upgrade to Pointer Pro for alignment you can almost rely on. Limited-time chaos included.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <SbButton id="popup-upgrade" tone="primary" importance={0.1} onActivate={() => setOpen(false)}>
          Upgrade pointer
        </SbButton>
        <SbButton
          id="popup-later"
          tone="ghost"
          importance={0.85}
          className="text-[11px] text-ink-500"
          onActivate={() => setOpen(false)}
        >
          Maybe later
        </SbButton>
      </div>
    </div>
  );
}
