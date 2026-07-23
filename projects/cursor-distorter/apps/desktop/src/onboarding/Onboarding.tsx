import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@cursor-distorter/ui";
import type { InconvenienceTolerance, OnboardingGoal, OperatingMode } from "@cursor-distorter/shared-types";
import { useStore } from "../state/store";

const GOALS: { id: OnboardingGoal; label: string }[] = [
  { id: "serious-work", label: "Serious work" },
  { id: "admin", label: "Administrative tasks" },
  { id: "presentation", label: "A live presentation" },
  { id: "time-sensitive", label: "Something time-sensitive" },
  { id: "nothing", label: "Nothing important" },
];

const TOLERANCE: { id: InconvenienceTolerance; label: string; hint: string }[] = [
  { id: "barely", label: "Barely noticeable", hint: "You'll blame yourself." },
  { id: "destabilizing", label: "Mildly destabilizing", hint: "You'll blame the mouse." },
  { id: "irritating", label: "Deeply irritating", hint: "You'll blame us." },
  { id: "reality", label: "Make me question reality", hint: "You'll blame physics." },
];

const bridge = typeof window !== "undefined" ? window.cursorDistorter : undefined;

export function Onboarding() {
  const step = useStore((s) => s.onboarding.step);
  const onboarding = useStore((s) => s.onboarding);
  const setOnboarding = useStore((s) => s.setOnboarding);
  const complete = useStore((s) => s.completeOnboarding);

  const next = () => setOnboarding({ step: step + 1 });

  return (
    <div className="flex h-full items-center justify-center bg-ink-950 p-6">
      <div className="w-full max-w-lg">
        <div className="mb-5 flex items-center justify-center gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={cn("h-1 rounded-full transition-all", i <= step ? "w-7 bg-brand-500" : "w-4 bg-white/10")}
            />
          ))}
        </div>

        <div className="glass-strong rounded-2xl p-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && (
                <div className="text-center">
                  <div className="text-[11px] uppercase tracking-[0.3em] text-brand-300">Onboarding</div>
                  <h1 className="mt-3 text-3xl font-semibold text-white">Welcome to Cursor Distorter.</h1>
                  <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-500">
                    A precision-engineered productivity obstruction platform. It introduces controlled
                    disagreement between user intent and pointer execution.
                  </p>
                  <button
                    onClick={next}
                    className="mt-6 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-glow"
                  >
                    Begin onboarding
                  </button>
                </div>
              )}

              {step === 1 && (
                <div>
                  <StepTitle>What are you trying to accomplish today?</StepTitle>
                  <div className="mt-4 grid gap-2">
                    {GOALS.map((g) => (
                      <OptionButton
                        key={g.id}
                        selected={onboarding.goal === g.id}
                        onClick={() => setOnboarding({ goal: g.id })}
                      >
                        {g.label}
                      </OptionButton>
                    ))}
                  </div>
                  {onboarding.goal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-center">
                      <p className="text-sm font-medium text-accent-cyan">Perfect. We can interfere with that.</p>
                      <button onClick={next} className="mt-3 rounded-lg bg-brand-500 px-5 py-2 text-sm font-semibold text-white">
                        Continue
                      </button>
                    </motion.div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div>
                  <StepTitle>Choose your inconvenience tolerance.</StepTitle>
                  <div className="mt-4 grid gap-2">
                    {TOLERANCE.map((t) => (
                      <OptionButton key={t.id} selected={onboarding.tolerance === t.id} onClick={() => setOnboarding({ tolerance: t.id })}>
                        <div className="flex items-center justify-between">
                          <span>{t.label}</span>
                          <span className="text-[11px] italic text-ink-500">{t.hint}</span>
                        </div>
                      </OptionButton>
                    ))}
                  </div>
                  <NextButton disabled={!onboarding.tolerance} onClick={next} />
                </div>
              )}

              {step === 3 && (
                <div>
                  <StepTitle>Choose a permission mode.</StepTitle>
                  <div className="mt-4 grid gap-2">
                    <OptionButton selected={onboarding.mode === "sandbox"} onClick={() => setOnboarding({ mode: "sandbox" })}>
                      <div>
                        <div className="font-medium">Safe Demo Sandbox</div>
                        <div className="text-[11px] text-ink-500">Every effect, zero permissions. Recommended.</div>
                      </div>
                    </OptionButton>
                    <OptionButton
                      selected={onboarding.mode === "system"}
                      disabled={!bridge?.isElectron}
                      onClick={() => bridge?.isElectron && setOnboarding({ mode: "system" as OperatingMode })}
                    >
                      <div>
                        <div className="font-medium">
                          System Distortion Mode {!bridge?.isElectron && <span className="text-[10px] text-ink-500">(desktop app only)</span>}
                        </div>
                        <div className="text-[11px] text-ink-500">Distort the real macOS cursor. Requires Accessibility.</div>
                      </div>
                    </OptionButton>
                  </div>
                  <NextButton disabled={!onboarding.mode} onClick={next} />
                </div>
              )}

              {step === 4 && (
                <div>
                  <StepTitle>Emergency controls</StepTitle>
                  <p className="mt-1 text-sm text-ink-500">These always work. You can never be locked out.</p>
                  <ul className="mt-4 space-y-2 text-[13px]">
                    <Emergency k="⌘⇧⎋" v="Global panic — instantly disables all distortion." />
                    <Emergency k="Menu bar" v="“Disable all distortion” is always one click away." />
                    <Emergency k="Timer" v="Sessions auto-disable after your maximum duration." />
                    <Emergency k="Indicator" v="A visible marker shows whenever distortion is active." />
                  </ul>
                  <button onClick={complete} className="mt-6 w-full rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-glow">
                    Enter the console
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function StepTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-semibold text-white">{children}</h2>;
}

function OptionButton({
  children,
  selected,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  selected?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors",
        selected ? "border-brand-400/60 bg-brand-500/15 text-white" : "border-white/8 bg-white/[0.02] text-white/80 hover:border-white/15",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      {children}
    </button>
  );
}

function NextButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "mt-5 w-full rounded-lg px-5 py-2.5 text-sm font-semibold text-white",
        disabled ? "cursor-not-allowed bg-white/10 text-ink-500" : "bg-brand-500 shadow-glow",
      )}
    >
      Continue
    </button>
  );
}

function Emergency({ k, v }: { k: string; v: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[11px] text-white/85">{k}</span>
      <span className="text-white/70">{v}</span>
    </li>
  );
}
