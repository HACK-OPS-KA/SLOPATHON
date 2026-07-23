"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Lock,
  Loader2,
  AlertTriangle,
  Landmark,
} from "lucide-react";
import { AGENT_LIST } from "@/lib/agents";
import { INTEGRATIONS_CATALOG } from "@/lib/demo";
import { completeOnboarding, type OnboardingPayload } from "@/lib/actions/onboarding";
import { CouncilMark } from "@/components/brand/logo";
import { AgentAvatar } from "@/components/brand/agent-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { IntegrationIcon } from "@/components/app/integration-icon";
import { cn } from "@/lib/utils";

const STEP_META = [
  { key: "identity", label: "Identity", title: "Basic identity", subtitle: "Your stated preferences may be overruled by the Council." },
  { key: "priorities", label: "Priorities", title: "Life priorities", subtitle: "Distribute 100 points across what you claim to care about." },
  { key: "risk", label: "Risk", title: "Risk tolerance", subtitle: "Declare how much disruption you will tolerate. These declarations are non-binding on the Council." },
  { key: "philosophy", label: "Philosophy", title: "Personal scheduling philosophy", subtitle: "Answer honestly. Your answers will be used against you." },
  { key: "council", label: "Council", title: "Agent power allocation", subtitle: "Design the bureaucracy that will govern you." },
  { key: "integrations", label: "Integrations", title: "Context sources", subtitle: "Calendar Council requires holistic context before allowing you to have coffee." },
  { key: "constitution", label: "Constitution", title: "Council constitution", subtitle: "Review and ratify your temporal governance framework." },
];

const PRIORITIES = [
  { key: "sleep", label: "Sleep" },
  { key: "career", label: "Career" },
  { key: "fitness", label: "Fitness" },
  { key: "relationships", label: "Relationships" },
  { key: "social", label: "Social life" },
  { key: "finance", label: "Finances" },
  { key: "health", label: "Health" },
  { key: "productivity", label: "Productivity" },
  { key: "convenience", label: "Convenience" },
  { key: "spontaneity", label: "Spontaneity" },
];

const RISK = [
  { key: "early_mornings", label: "Early mornings" },
  { key: "late_nights", label: "Late nights" },
  { key: "long_travel", label: "Long travel" },
  { key: "expensive_venues", label: "Expensive venues" },
  { key: "consecutive_meetings", label: "Consecutive meetings" },
  { key: "missing_workouts", label: "Missing workouts" },
  { key: "social_overload", label: "Social overload" },
  { key: "spontaneous_plans", label: "Spontaneous plans" },
  { key: "weather_uncertainty", label: "Weather uncertainty" },
];
const RISK_LABELS = [
  "Constitutionally unacceptable",
  "Strongly discouraged",
  "Requires review",
  "Tolerable under supervision",
  "Recklessly permissive",
];

const PHIL = [
  { key: "careerOverSleep", q: "Should career events overrule sleep?", opts: ["Never", "Only if strategic", "Yes"] },
  { key: "socialReplaceWorkout", q: "Can social plans replace workouts?", opts: ["Never", "Occasionally", "Freely"] },
  { key: "coffeeIsMeal", q: "Is coffee a meal?", opts: ["No", "It's a beverage", "Yes, structurally"] },
  { key: "friendshipROI", q: "How much friendship ROI is sufficient?", opts: ["Any amount", "Measurable", "Quarterly"] },
  { key: "rainCancels", q: "Should rain automatically cancel outdoor activity?", opts: ["No", "Above 20%", "Always"] },
  { key: "agendaRequired", q: "Is a meeting without an agenda morally acceptable?", opts: ["Yes", "Reluctantly", "Never"] },
];

const TIMEZONES = [
  "Europe/Berlin",
  "Europe/London",
  "Europe/Paris",
  "Europe/Zurich",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Tokyo",
  "Australia/Sydney",
];

interface WizardData {
  name: string;
  displayName: string;
  timezone: string;
  workStart: string;
  workEnd: string;
  wakeTime: string;
  sleepTime: string;
  priorities: Record<string, number>;
  risk: Record<string, string>;
  philosophy: Record<string, string>;
  agents: Record<string, { influence: number; veto: boolean; aggression: number }>;
  integrations: Record<string, string>;
}

export function OnboardingWizard({ initialName }: { initialName: string }) {
  const [step, setStep] = React.useState(0);
  const [forming, setForming] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const [data, setData] = React.useState<WizardData>(() => ({
    name: initialName || "",
    displayName: initialName?.split(" ")[0] || "",
    timezone: "Europe/Berlin",
    workStart: "09:00",
    workEnd: "18:00",
    wakeTime: "07:00",
    sleepTime: "23:30",
    priorities: Object.fromEntries(PRIORITIES.map((p) => [p.key, 10])),
    risk: Object.fromEntries(RISK.map((r) => [r.key, "Requires review"])),
    philosophy: Object.fromEntries(PHIL.map((p) => [p.key, p.opts[0]])),
    agents: Object.fromEntries(
      AGENT_LIST.map((a) => [a.type, { influence: a.defaultInfluence, veto: a.defaultVeto, aggression: a.defaultAggression }]),
    ),
    integrations: Object.fromEntries(INTEGRATIONS_CATALOG.map((i) => [i.provider, "disconnected"])),
  }));

  function set<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  const total = Object.values(data.priorities).reduce((a, b) => a + b, 0);

  function ratify() {
    setForming(true);
    startTransition(() => {
      completeOnboarding(data as OnboardingPayload);
    });
  }

  const isLast = step === STEP_META.length - 1;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-8 sm:py-12">
        {/* Header + progress */}
        <div className="mb-8">
          <div className="flex items-center gap-2.5">
            <CouncilMark className="h-7 w-7" />
            <p className="record-label">Council Formation Protocol</p>
          </div>
          <div className="mt-4 flex items-center gap-1.5">
            {STEP_META.map((s, i) => (
              <div key={s.key} className="flex flex-1 flex-col gap-1.5">
                <div className={cn("h-1 rounded-full transition-colors", i <= step ? "bg-gold" : "bg-muted")} />
                <span className={cn("hidden text-[10px] font-medium sm:block", i === step ? "text-foreground" : "text-muted-foreground/60")}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step body */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
            >
              <p className="record-label">Step {step + 1} of {STEP_META.length}</p>
              <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{STEP_META[step].title}</h1>
              <p className="mt-2 text-muted-foreground">{STEP_META[step].subtitle}</p>

              <div className="mt-8">
                {step === 0 && <StepIdentity data={data} set={set} />}
                {step === 1 && <StepPriorities data={data} set={set} total={total} />}
                {step === 2 && <StepRisk data={data} set={set} />}
                {step === 3 && <StepPhilosophy data={data} set={set} />}
                {step === 4 && <StepCouncil data={data} set={set} />}
                {step === 5 && <StepIntegrations data={data} set={set} />}
                {step === 6 && <StepConstitution data={data} />}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer nav */}
        <div className="mt-10 flex items-center justify-between border-t pt-5">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || forming}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          {isLast ? (
            <Button variant="gold" size="lg" onClick={ratify} disabled={forming || pending}>
              {forming ? <><Loader2 className="h-4 w-4 animate-spin" /> Forming your Council…</> : <>Ratify My Loss of Autonomy <Check className="h-4 w-4" /></>}
            </Button>
          ) : (
            <Button onClick={() => setStep((s) => Math.min(STEP_META.length - 1, s + 1))}>
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence>{forming && <FormingOverlay name={data.displayName || data.name} />}</AnimatePresence>
    </TooltipProvider>
  );
}

// ---- helper components ----
type SetFn = <K extends keyof WizardData>(k: K, v: WizardData[K]) => void;

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function StepIdentity({ data, set }: { data: WizardData; set: SetFn }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Full name">
        <Input value={data.name} onChange={(e) => set("name", e.target.value)} placeholder="Your name" />
      </Field>
      <Field label="Preferred display name">
        <Input value={data.displayName} onChange={(e) => set("displayName", e.target.value)} placeholder="What the Council calls you" />
      </Field>
      <Field label="Time zone">
        <Select value={data.timezone} onValueChange={(v) => set("timezone", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Work starts"><Input type="time" value={data.workStart} onChange={(e) => set("workStart", e.target.value)} /></Field>
        <Field label="Work ends"><Input type="time" value={data.workEnd} onChange={(e) => set("workEnd", e.target.value)} /></Field>
      </div>
      <Field label="Preferred wake-up time" hint="The Sleep Agent has already noted this."><Input type="time" value={data.wakeTime} onChange={(e) => set("wakeTime", e.target.value)} /></Field>
      <Field label="Preferred bedtime" hint="Aspirational, per our records."><Input type="time" value={data.sleepTime} onChange={(e) => set("sleepTime", e.target.value)} /></Field>
    </div>
  );
}

function StepPriorities({ data, set, total }: { data: WizardData; set: SetFn; total: number }) {
  const complaint =
    total > 100
      ? `You have allocated ${total} of 100 points. The Council has noted this mathematical optimism.`
      : total < 100
        ? `You have allocated ${total} of 100 points. ${100 - total} remain unclaimed. Indecision is itself a data point.`
        : data.priorities.career >= 25 && data.priorities.sleep >= 20
          ? "You have prioritised both career and sleep heavily. The Council has noted this mathematical optimism."
          : data.priorities.spontaneity >= 15
            ? "High spontaneity detected. This will be corrected."
            : "Allocation accepted, provisionally. The Council reserves the right to disagree.";
  return (
    <div>
      <div className="mb-4 flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-2.5">
        <span className="text-sm font-medium">Points allocated</span>
        <span className={cn("font-display text-lg font-semibold tabular", total === 100 ? "text-approve" : "text-oppose")}>{total} / 100</span>
      </div>
      <div className="space-y-3.5">
        {PRIORITIES.map((p) => (
          <div key={p.key} className="grid grid-cols-[8rem_1fr_2.5rem] items-center gap-3">
            <span className="text-sm font-medium">{p.label}</span>
            <Slider value={[data.priorities[p.key]]} min={0} max={40} step={1} onValueChange={(v) => set("priorities", { ...data.priorities, [p.key]: v[0] })} />
            <span className="text-right text-sm tabular text-muted-foreground">{data.priorities[p.key]}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-start gap-2 rounded-lg border border-conditional/30 bg-conditional/5 px-3 py-2.5 text-sm text-foreground/80">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-conditional" />
        {complaint}
      </div>
    </div>
  );
}

function StepRisk({ data, set }: { data: WizardData; set: SetFn }) {
  return (
    <div className="space-y-3">
      {RISK.map((r) => (
        <div key={r.key} className="grid grid-cols-1 items-center gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_16rem]">
          <span className="text-sm font-medium">{r.label}</span>
          <Select value={data.risk[r.key]} onValueChange={(v) => set("risk", { ...data.risk, [r.key]: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {RISK_LABELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}

function StepPhilosophy({ data, set }: { data: WizardData; set: SetFn }) {
  return (
    <div className="space-y-4">
      {PHIL.map((p) => (
        <div key={p.key} className="rounded-lg border p-4">
          <p className="mb-3 text-sm font-medium">{p.q}</p>
          <div className="flex flex-wrap gap-2">
            {p.opts.map((o) => (
              <button
                key={o}
                onClick={() => set("philosophy", { ...data.philosophy, [p.key]: o })}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  data.philosophy[p.key] === o ? "border-gold bg-gold/10 text-foreground" : "border-input text-muted-foreground hover:bg-accent",
                )}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      ))}
      {/* The locked question */}
      <div className="rounded-lg border border-veto/30 bg-veto/5 p-4">
        <p className="mb-3 flex items-center gap-1.5 text-sm font-medium">
          <Lock className="h-4 w-4 text-veto" /> Can you schedule events without Council approval?
        </p>
        <div className="flex flex-wrap gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex cursor-not-allowed rounded-full border border-input px-3 py-1.5 text-sm text-muted-foreground/50">Yes</span>
            </TooltipTrigger>
            <TooltipContent>This setting is unavailable under your current governance framework.</TooltipContent>
          </Tooltip>
          <span className="rounded-full border border-gold bg-gold/10 px-3 py-1.5 text-sm">No</span>
        </div>
      </div>
    </div>
  );
}

function StepCouncil({ data, set }: { data: WizardData; set: SetFn }) {
  const bothVeto = data.agents.sleep?.veto && data.agents.career?.veto;
  return (
    <div>
      {bothVeto && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-conditional/30 bg-conditional/5 px-3 py-2.5 text-sm text-foreground/80">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-conditional" />
          Granting both Sleep Agent and Career Agent veto power may make mornings permanently unavailable.
        </div>
      )}
      <div className="space-y-2.5">
        {AGENT_LIST.map((a) => {
          const cfg = data.agents[a.type];
          return (
            <div key={a.type} className="rounded-lg border p-3.5">
              <div className="flex items-center gap-3">
                <AgentAvatar type={a.type} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{a.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.role}</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Veto</span>
                  <Switch checked={cfg.veto} onCheckedChange={(v) => set("agents", { ...data.agents, [a.type]: { ...cfg, veto: v } })} />
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Influence</span><span className="tabular">{cfg.influence}</span></div>
                  <Slider value={[cfg.influence]} min={0} max={100} step={1} onValueChange={(v) => set("agents", { ...data.agents, [a.type]: { ...cfg, influence: v[0] } })} />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Aggression</span><span className="tabular">{cfg.aggression}</span></div>
                  <Slider value={[cfg.aggression]} min={0} max={100} step={1} onValueChange={(v) => set("agents", { ...data.agents, [a.type]: { ...cfg, aggression: v[0] } })} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepIntegrations({ data, set }: { data: WizardData; set: SetFn }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {INTEGRATIONS_CATALOG.slice(0, 8).map((i) => {
        const status = data.integrations[i.provider];
        const connected = status === "connected" || status === "simulated";
        return (
          <div key={i.provider} className="flex items-start gap-3 rounded-lg border p-4">
            <IntegrationIcon name={i.icon} className="h-9 w-9 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{i.name}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{i.dataUse}</p>
              <Button
                size="sm"
                variant={connected ? "seal" : "outline"}
                className="mt-2.5"
                onClick={() => set("integrations", { ...data.integrations, [i.provider]: connected ? "disconnected" : "simulated" })}
              >
                {connected ? <><Check className="h-4 w-4" /> Simulated</> : "Connect"}
              </Button>
            </div>
          </div>
        );
      })}
      <p className="col-span-full text-center text-xs text-muted-foreground">You may skip any integration. The Council will simply assume the worst.</p>
    </div>
  );
}

function StepConstitution({ data }: { data: WizardData }) {
  const name = data.displayName || data.name || "Your";
  const clauses: string[] = [];
  if (data.agents.sleep?.veto) clauses.push("Sleep Agent may veto events before 09:30.");
  if (data.agents.career?.influence >= 60) clauses.push("Career Agent receives elevated influence for networking events.");
  clauses.push("Gym Agent must be consulted on Monday, Wednesday, and Friday.");
  clauses.push("Finance Agent reviews events expected to exceed €8.");
  clauses.push("Relationship Agent may escalate neglected contacts.");
  if (data.agents.chaos?.influence > 0) clauses.push("Chaos Agent has been granted advisory status against staff recommendation.");
  const topPriority = PRIORITIES.reduce((a, b) => (data.priorities[b.key] > data.priorities[a.key] ? b : a));
  clauses.push(`${topPriority.label} has been recorded as your stated highest priority, for the Council to weigh at its discretion.`);

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center gap-2.5">
        <Landmark className="h-5 w-5 text-gold" />
        <h2 className="font-display text-xl font-semibold">{name}&apos;s Temporal Constitution</h2>
      </div>
      <div className="gold-rule my-4" />
      <ul className="space-y-2.5">
        {clauses.map((c, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <span className="mt-0.5 font-mono text-xs text-gold">§{i + 1}</span>
            <span>{c}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap gap-2">
        <Badge variant="gold">12 agents seated</Badge>
        <Badge variant="muted">{Object.values(data.agents).filter((a) => a.veto).length} with veto power</Badge>
        <Badge variant="muted">{Object.values(data.integrations).filter((s) => s !== "disconnected").length} context sources</Badge>
      </div>
    </div>
  );
}

function FormingOverlay({ name }: { name: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] grid place-items-center chamber-field text-white"
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.6, rotate: -20, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
        >
          <CouncilMark className="mx-auto h-20 w-20 text-white" />
        </motion.div>
        <p className="mt-6 font-display text-2xl">Convening {name}&apos;s Council…</p>
        <p className="mt-2 text-sm text-white/60">Seating 12 agents. Distributing veto power. Regretting nothing.</p>
      </div>
    </motion.div>
  );
}
