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
  Quote,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeroChat } from "@/components/marketing/hero-chat-lazy";
import { DemoButton } from "@/components/marketing/demo-button";
import {
  FAKE_METRICS,
  HOW_IT_WORKS,
  FEATURES,
  TESTIMONIALS,
  ENTERPRISE_LOGOS,
  TAGLINE,
  SUBTAGLINE,
  CORPORATE_CATEGORIES,
} from "@/lib/content";

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

export default function LandingPage() {
  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden chamber-field text-white">
        <div className="pointer-events-none absolute inset-0 paper-grain opacity-[0.15]" />
        <div className="container relative grid items-center gap-12 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          <div>
            <Badge variant="gold" className="mb-6 backdrop-blur">
              <span className="mr-1 h-1.5 w-1.5 rounded-full bg-gold" /> Personal Time Governance
            </Badge>
            <h1 className="max-w-2xl font-display text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {TAGLINE}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/70 text-pretty">
              Calendar Council deploys 12 specialized AI agents to review, debate, and approve
              every commitment in your life.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/register">
                <Button variant="gold" size="lg">
                  Request Permission <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <DemoButton variant="outline" size="lg" className="border-white/25 bg-white/5 text-white hover:bg-white/10">
                Watch the Council Fight
              </DemoButton>
            </div>
            <p className="mt-6 font-mono text-xs uppercase tracking-[0.18em] text-white/50">
              {SUBTAGLINE}
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-3xl bg-gold/10 blur-3xl" />
            <div className="relative">
              <HeroChat />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Enterprise logos ---------------- */}
      <section className="border-b bg-muted/20">
        <div className="container py-10">
          <p className="text-center text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Trusted by teams that no longer schedule anything
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-60">
            {ENTERPRISE_LOGOS.map((name) => (
              <span key={name} className="font-display text-lg font-semibold tracking-tight text-muted-foreground">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Fake metrics ---------------- */}
      <section className="container py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="record-label">Measured outcomes</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Governance that produces results.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Every metric independently unverifiable. Every outcome technically negative.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border md:grid-cols-4">
          {FAKE_METRICS.map((m) => (
            <div key={m.label} className="bg-card p-6 text-center">
              <p className="font-display text-3xl font-semibold text-gold tabular sm:text-4xl">{m.value}</p>
              <p className="mt-1.5 text-sm text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section className="border-y bg-muted/20">
        <div className="container py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="record-label">The process</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Four steps between you and a coffee.
            </h2>
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((s) => (
              <div key={s.step} className="relative">
                <span className="font-display text-5xl font-semibold text-gold/25">{s.step}</span>
                <h3 className="mt-3 font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Features ---------------- */}
      <section className="container py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="record-label">Platform</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Enterprise-grade oversight for a normal human life.
          </h2>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => {
            const Icon = FEATURE_ICONS[f.icon] ?? Gavel;
            return (
              <div key={f.title} className="group rounded-xl border bg-card p-6 transition-shadow hover:shadow-seal">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-gold/10 text-gold">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------------- Category band ---------------- */}
      <section className="chamber-field text-white">
        <div className="container py-20 text-center">
          <p className="record-label text-gold">A new category</p>
          <h2 className="mx-auto mt-3 max-w-4xl font-display text-2xl font-medium leading-snug tracking-tight text-balance sm:text-3xl">
            We didn&apos;t just build a scheduling app. We built{" "}
            <span className="text-gold">Consensus-Based Calendar Orchestration</span> — the institutional
            layer between you and your own free time.
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {CORPORATE_CATEGORIES.map((c) => (
              <span key={c} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Testimonials ---------------- */}
      <section className="container py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="record-label">Testimony</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            People who lost, and welcomed, control.
          </h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="flex flex-col rounded-xl border bg-card p-6">
              <Quote className="h-5 w-5 text-gold/50" />
              <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-foreground">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-4 border-t pt-4">
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ---------------- Final CTA ---------------- */}
      <section className="border-t bg-muted/30">
        <div className="container py-20 text-center">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready to stop making reckless scheduling decisions alone?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Join thousands who have voluntarily surrendered their calendars to institutional review.
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
          <p className="mt-4 text-xs text-muted-foreground">No credit card. No autonomy. No refunds on either.</p>
        </div>
      </section>
    </>
  );
}
