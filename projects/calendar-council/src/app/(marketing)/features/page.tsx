import Link from "next/link";
import {
  MessagesSquare,
  Radar,
  LineChart,
  Gavel,
  ListChecks,
  BarChart3,
  ShieldAlert,
  Siren,
  ArrowRight,
  Check,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DemoButton } from "@/components/marketing/demo-button";
import { AgentAvatar } from "@/components/brand/agent-avatar";
import { FEATURES } from "@/lib/content";
import { AGENT_LIST } from "@/lib/agents";

export const metadata = { title: "Features — Calendar Council" };

const FEATURE_ICONS: Record<string, LucideIcon> = {
  messages: MessagesSquare,
  radar: Radar,
  trending: LineChart,
  gavel: Gavel,
  "list-checks": ListChecks,
  chart: BarChart3,
  shield: ShieldAlert,
  siren: Siren,
};

/** Invented, dead-serious sub-capabilities per feature, keyed by icon. */
const FEATURE_DETAILS: Record<string, { eyebrow: string; points: string[] }> = {
  messages: {
    eyebrow: "Deliberation Engine",
    points: [
      "Twelve independent mandates, twelve competing agendas, one shared calendar.",
      "Full debate transcript retained for the permanent record.",
      "Cross-agent citations, rebuttals, and formal points of order.",
    ],
  },
  radar: {
    eyebrow: "Risk Surface",
    points: [
      "Composite exposure score across nine life domains.",
      "Automatic escalation when protein availability is unconfirmed.",
      "Weather probabilities are treated as certainties, per policy.",
    ],
  },
  trending: {
    eyebrow: "Consensus Index",
    points: [
      "Live alignment reading, recomputed on every new objection.",
      "Historical consensus curves for post-hoc blame allocation.",
      "Automatic session freeze below 25% agreement.",
    ],
  },
  gavel: {
    eyebrow: "Testimony Intake",
    points: [
      "Structured statements captured under oath-equivalent conditions.",
      "Answers cross-referenced against your stated five-year plan.",
      "Follow-up questioning continues until intent is deemed sincere.",
    ],
  },
  "list-checks": {
    eyebrow: "Conditions Framework",
    points: [
      "No unconditional approval has been issued since inception.",
      "Bedtime, spend ceilings, and protein clauses attach automatically.",
      "Post-meeting compliance reporting due within 24 hours.",
    ],
  },
  chart: {
    eyebrow: "Governance Analytics",
    points: [
      "Autonomy trendline benchmarked against your baseline self.",
      "Time-spent-deciding-whether-to-have-time, quantified.",
      "Quarterly personal accountability review, auto-scheduled.",
    ],
  },
  shield: {
    eyebrow: "Flagship Outcome",
    points: [
      "Our most reproducible result to date.",
      "Measured decline, independently unverifiable, reassuringly steady.",
      "Trending, at all times, in the right direction.",
    ],
  },
  siren: {
    eyebrow: "Incident Response",
    points: [
      "Millisecond convening on any unapproved attendance.",
      "Formal review, corrective plan, and mandatory monitoring period.",
      "Repeat offenses referred to the standing committee.",
    ],
  },
};

export default function FeaturesPage() {
  return (
    <>
      {/* ---------------- Intro ---------------- */}
      <section className="relative overflow-hidden chamber-field text-white">
        <div className="pointer-events-none absolute inset-0 paper-grain opacity-[0.15]" />
        <div className="container relative py-20 lg:py-28">
          <div className="max-w-3xl">
            <Badge variant="gold" className="mb-6 backdrop-blur">
              <span className="mr-1 h-1.5 w-1.5 rounded-full bg-gold" /> The Platform
            </Badge>
            <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Enterprise-grade oversight for a life that did not request it.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/70 text-pretty">
              Eight core capabilities. Twelve deliberating agents. One institutional layer between
              you and every coffee, dinner, and quietly ambitious brunch.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/register">
                <Button variant="gold" size="lg">
                  Request Permission <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <DemoButton
                variant="outline"
                size="lg"
                className="border-white/25 bg-white/5 text-white hover:bg-white/10"
              >
                Watch the Council Fight
              </DemoButton>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Feature deep dives ---------------- */}
      <section className="container py-20 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="record-label">Capabilities</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Every commitment, examined in full.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Nothing is approved quickly. Nothing is approved simply. Everything is on the record.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-5xl space-y-6">
          {FEATURES.map((f, i) => {
            const Icon = FEATURE_ICONS[f.icon] ?? Gavel;
            const detail = FEATURE_DETAILS[f.icon];
            const flip = i % 2 === 1;
            return (
              <article
                key={f.title}
                className="grid items-center gap-8 rounded-2xl border bg-card p-6 shadow-sm sm:p-10 lg:grid-cols-2"
              >
                {/* Emblem side */}
                <div className={flip ? "lg:order-2" : ""}>
                  <div className="relative overflow-hidden rounded-xl border bg-muted/30 p-8 paper-grain">
                    <div className="flex items-center gap-4">
                      <div className="grid h-14 w-14 place-items-center rounded-lg bg-gold/10 text-gold seal-ring">
                        <Icon className="h-7 w-7" />
                      </div>
                      <span className="font-display text-6xl font-semibold text-gold/20">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div className="gold-rule mt-6" />
                    <p className="mt-4 record-label">{detail?.eyebrow}</p>
                  </div>
                </div>

                {/* Copy side */}
                <div className={flip ? "lg:order-1" : ""}>
                  <h3 className="font-display text-2xl font-semibold tracking-tight">{f.title}</h3>
                  <p className="mt-3 text-muted-foreground text-pretty">{f.body}</p>
                  <ul className="mt-6 space-y-3">
                    {detail?.points.map((p) => (
                      <li key={p} className="flex gap-3 text-sm">
                        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold/10 text-gold">
                          <Check className="h-3 w-3" />
                        </span>
                        <span className="text-foreground/90">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ---------------- Doctrine band ---------------- */}
      <section className="chamber-field text-white">
        <div className="container py-20 text-center">
          <p className="record-label text-gold">Operating doctrine</p>
          <blockquote className="mx-auto mt-4 max-w-3xl font-display text-2xl font-medium leading-snug tracking-tight text-balance sm:text-3xl">
            &ldquo;Every meeting deserves due process. Every coffee deserves a quorum. Your calendar
            deserves better than <span className="text-gold">you.</span>&rdquo;
          </blockquote>
          <p className="mt-6 font-mono text-xs uppercase tracking-[0.18em] text-white/50">
            Preamble, Council Constitution — Article 0
          </p>
        </div>
      </section>

      {/* ---------------- Meet the Council ---------------- */}
      <section className="border-y bg-muted/30">
        <div className="container py-20 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="record-label">The bench</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Meet the Council.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Twelve specialized agents, each with a mandate, a grievance, and a vote.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {AGENT_LIST.map((a) => (
              <div
                key={a.type}
                className="group relative overflow-hidden rounded-xl border bg-card p-6 transition-shadow hover:shadow-seal"
              >
                <span
                  className="absolute inset-x-0 top-0 h-0.5"
                  style={{ background: `linear-gradient(90deg, ${a.color}, ${a.color2})` }}
                  aria-hidden
                />
                <div className="flex items-center gap-4">
                  <AgentAvatar type={a.type} size="lg" />
                  <div className="min-w-0">
                    <h3 className="font-display text-base font-semibold leading-tight">{a.name}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{a.role}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{a.persona}</p>
                <p className="mt-4 border-t pt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-gold/80">
                  &ldquo;{a.mostCommonPhrase}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="border-t">
        <div className="container py-20 text-center">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Twelve agents are already waiting to disagree with you.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Submit your first request and begin the orderly, structured erosion of your scheduling
            independence.
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
          <p className="mt-4 text-xs text-muted-foreground">
            No credit card. No autonomy. No refunds on either.
          </p>
        </div>
      </section>
    </>
  );
}
