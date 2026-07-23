import { useState } from "react";
import { useTarget } from "../../cursor/registry";

const VERDICTS = [
  "That was not your cursor.",
  "Verification inconclusive.",
  "Suspiciously confident. Try again.",
  "That cursor belongs to someone else.",
  "Pointer identity could not be confirmed.",
];

function CaptchaTile({ id, index, onPick }: { id: string; index: number; onPick: () => void }) {
  const ref = useTarget({
    id,
    kind: "button",
    importance: 0.5,
    onActivate: onPick,
  });
  return (
    <div
      ref={ref}
      role="button"
      className="cd-ctl flex h-16 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" style={{ transform: `rotate(${index * 4 - 4}deg)` }}>
        <path
          d="M4 2 L4 20.5 L9.2 15.3 L12.7 22.2 L15.3 21 L11.8 14.2 L18.6 14.2 Z"
          fill="#e8ecf6"
          stroke="#0a0c14"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/** "Select the cursor that is actually yours." There is no reliable answer. */
export function CaptchaApp() {
  const [verdict, setVerdict] = useState<string | null>(null);
  const [tries, setTries] = useState(0);

  const pick = () => {
    setVerdict(VERDICTS[tries % VERDICTS.length]!);
    setTries((t) => t + 1);
  };

  return (
    <div>
      <div className="mb-2 text-[12px] text-white/80">Select the cursor that is actually yours.</div>
      <div className="grid grid-cols-3 gap-2">
        <CaptchaTile id="captcha-1" index={0} onPick={pick} />
        <CaptchaTile id="captcha-2" index={1} onPick={pick} />
        <CaptchaTile id="captcha-3" index={2} onPick={pick} />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px]">
        <span className="text-ink-500">{tries > 0 ? `Attempts: ${tries}` : "Human verification"}</span>
        {verdict && <span className="text-signal-warn">{verdict}</span>}
      </div>
    </div>
  );
}
