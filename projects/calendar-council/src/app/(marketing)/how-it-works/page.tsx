import Link from "next/link";
import { ArrowRight, ArrowDown, CornerUpLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DemoButton } from "@/components/marketing/demo-button";
import { HOW_IT_WORKS } from "@/lib/content";

export const metadata = { title: "How It Works — Calendar Council" };

/** Expanded, dead-serious detail per canonical step. */
const STEP_DETAIL: Record<string, string> = {
  "01":
    "State your intended commitment in plain language. The Council will interpret it in the least convenient way available and assign it a case number.",
  "02":
    "Your request is distributed to all twelve agents at once. Each opens with an objection prepared well in advance of hearing what you actually asked for.",
  "03":
    "Answer clarifying questions about cost, purpose, emotional necessity, transportation, protein availability, and professional value. Every answer is entered into evidence and used later.",
  "04":
    "After deliberation, appeal, and re-deliberation, the Council issues a binding finding. The finding is Tuesday.",
};

/** The bureaucratic pipeline that a single coffee passes through. */
const PIPELINE: { stage: string; what: string; reads: string }[] = [
  {
    stage: "Stakeholder analysis",
    what: "Twelve agents assert jurisdiction. Sleep, Career, and Gym each claim primary interest.",
    reads: "Coffee with Alex — tomorrow, 10:00",
  },
  {
    stage: "Personal capacity modelling",
    what: "Remaining social battery (14%), sleep debt, and protein timeline are entered into the model.",
    reads: "Coffee with Alex — 10:00, pending capacity review",
  },
  {
    stage: "Agent debate",
    what: "Career asks what Alex does professionally. Relationship notes you have not seen Alex in three weeks.",
    reads: "Coffee with a person of unclear strategic value",
  },
  {
    stage: "User interrogation",
    what: "You are asked to justify, on the record, the emotional necessity of the meeting.",
    reads: "Coffee (justification requested)",
  },
  {
    stage: "Risk scoring",
    what: "Weather assigns a 12% probability of rain. It is logged as a certainty, per policy.",
    reads: "Outdoor coffee — HIGH atmospheric exposure",
  },
  {
    stage: "Alternative proposals",
    what: "Nine alternate slots are generated for your review. All nine are Tuesday.",
    reads: "Coffee, provisionally Tuesday",
  },
  {
    stage: "Voting",
    what: "Preliminary vote returns 4 approve, 5 oppose, 2 conditional, and 1 Luxembourg.",
    reads: "Coffee — deadlocked",
  },
  {
    stage: "Appeals",
    what: "You appeal the deadlock. Chaos Agent appeals your appeal, then withdraws it, then reinstates it.",
    reads: "Coffee — under appeal",
  },
  {
    stage: "Conditional approval",
    what: "Approved, subject to a confirmed bedtime, a €9 spend ceiling, and documented protein.",
    reads: "Coffee — APPROVED (conditions apply)",
  },
  {
    stage: "Post-meeting compliance reporting",
    what: "You file a three-part report confirming that you did, in fact, enjoy it.",
    reads: "Coffee — closed, pending audit",
  },
];

/** The 14 canonical negotiation phases. Some regress. */
const PHASES: { title: string; regressesTo?: string }[] = [
  { title: "Request submitted" },
  { title: "Initial analysis" },
  { title: "Initial objections" },
  { title: "Cross-agent debate", regressesTo: "Initial objections" },
  { title: "User interrogation" },
  { title: "Alternative time proposals" },
  { title: "Risk assessment" },
  { title: "Preliminary vote" },
  { title: "Objection escalation", regressesTo: "Cross-agent debate" },
  { title: "Final vote" },
  { title: "Decision" },
  { title: "Appeal", regressesTo: "Preliminary vote" },
  { title: "Post-decision monitoring" },
  { title: "Unauthorized activity incident", regressesTo: "Initial analysis" },
];

export default function HowItWorksPage() {
  return (
    <>
      {/* ---------------- Intro ---------------- */}
      <section className="relative overflow-hidden chamber-field text-white">
        <div className="pointer-events-none absolute inset-0 paper-grain opacity-[0.15]" />
        <div className="container relative py-20 lg:py-28">
          <div className="max-w-3xl">
            <Badge variant="gold" className="mb-6 backdrop-blur">
              <span className="mr-1 h-1.5 w-1.5 rounded-full bg-gold" /> The Process
            </Badge>
            <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Four steps between you and a coffee.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/70 text-pretty">
              What follows is the complete, documented journey of a single scheduling request — from
              the moment you submit it to the moment it is quietly rescheduled to Tuesday.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- The four steps ---------------- */}
      <section className="container py-20 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="record-label">The procedure</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            A calm, structured loss of control.
          </h2>
        </div>

        <div className="mx-auto mt-16 max-w-4xl space-y-10">
          {HOW_IT_WORKS.map((s, i) => (
            <div key={s.step} className="grid gap-6 sm:grid-cols-[auto_1fr] sm:gap-10">
              <div className="flex items-baseline gap-4 sm:flex-col sm:items-center sm:gap-2">
                <span className="font-display text-5xl font-semibold text-gold/25 tabular sm:text-6xl">
                  {s.step}
                </span>
                {i < HOW_IT_WORKS.length - 1 && (
                  <span className="hidden h-full w-px flex-1 bg-border sm:block" aria-hidden />
                )}
              </div>
              <div className="border-b pb-10">
                <h3 className="font-display text-xl font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-muted-foreground">{s.body}</p>
                <p className="mt-4 text-sm leading-relaxed text-foreground/80">
                  {STEP_DETAIL[s.step]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Watch a request degrade ---------------- */}
      <section className="border-y bg-muted/30">
        <div className="container py-20 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="record-label">Case study</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Watch a request degrade.
            </h2>
            <p className="mt-3 text-muted-foreground">
              One simple plan, followed through the full pipeline. Observe how it changes.
            </p>
          </div>

          {/* Original request */}
          <div className="mx-auto mt-12 max-w-2xl">
            <div className="rounded-xl border bg-card p-6 text-center shadow-sm">
              <p className="record-label">Submitted request</p>
              <p className="mt-3 font-display text-2xl font-semibold tracking-tight">
                &ldquo;Coffee with Alex tomorrow at 10.&rdquo;
              </p>
            </div>
            <div className="my-4 flex justify-center text-muted-foreground">
              <ArrowDown className="h-5 w-5" />
            </div>
          </div>

          {/* Vertical timeline */}
          <ol className="mx-auto max-w-2xl space-y-4">
            {PIPELINE.map((p, i) => (
              <li
                key={p.stage}
                className="relative rounded-xl border bg-card p-5 shadow-sm sm:pl-16"
              >
                <span className="absolute left-5 top-5 hidden h-8 w-8 place-items-center rounded-full border border-gold/40 bg-gold/10 font-mono text-xs font-semibold text-gold sm:grid">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="font-display text-base font-semibold tracking-tight">
                  <span className="text-gold sm:hidden">
                    {String(i + 1).padStart(2, "0")}.{" "}
                  </span>
                  {p.stage}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">{p.what}</p>
                <p className="mt-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] text-foreground/70">
                  <ChevronRight className="h-3 w-3 shrink-0 text-gold" />
                  Now reads: {p.reads}
                </p>
              </li>
            ))}
          </ol>

          {/* Final outcome */}
          <div className="mx-auto mt-4 max-w-2xl">
            <div className="my-4 flex justify-center text-muted-foreground">
              <ArrowDown className="h-5 w-5" />
            </div>
            <div className="rounded-xl border border-gold/40 bg-gold/5 p-6 text-center shadow-seal">
              <p className="record-label text-gold">Binding recommendation</p>
              <p className="mt-3 font-display text-2xl font-semibold tracking-tight">
                Tuesday, 14:17–14:43. Indoors. Conditional.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Post-meeting compliance report due within 24 hours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- The 14 phases ---------------- */}
      <section className="container py-20 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="record-label">Procedural reference</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            The fourteen negotiation phases.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Every request advances through the phases below in order — except when it does not.
            Progress is not guaranteed to move forward, and frequently does not.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-3xl overflow-hidden rounded-2xl border bg-card shadow-sm">
          {PHASES.map((phase, i) => (
            <div
              key={phase.title}
              className="flex items-center gap-4 border-b px-5 py-4 last:border-b-0"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted font-mono text-xs font-semibold text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{phase.title}</p>
                {phase.regressesTo && (
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-oppose">
                    <CornerUpLeft className="h-3 w-3 shrink-0" />
                    May regress to &ldquo;{phase.regressesTo}&rdquo;
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-3xl text-center text-xs text-muted-foreground">
          Phases marked in red indicate points at which the negotiation is permitted, and encouraged,
          to move backwards. A request may re-enter monitoring at any time, including after it has
          concluded.
        </p>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="border-t bg-muted/30">
        <div className="container py-20 text-center">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Begin the process.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Submit a request today. Receive a binding recommendation eventually.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register">
              <Button variant="gold" size="lg">
                Request Permission <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <DemoButton variant="outline" size="lg">
              Enter Demo Account
            </DemoButton>
          </div>
        </div>
      </section>
    </>
  );
}
