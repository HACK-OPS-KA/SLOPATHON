import Link from "next/link";
import { format } from "date-fns";
import {
  Plus,
  MessagesSquare,
  Gavel,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Clock,
  TrendingDown,
  Wallet,
  Users,
  Zap,
  Activity,
  ScrollText,
  CheckCircle2,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/app/status-badge";
import { ConsensusPill } from "@/components/consensus-meter";
import { statusMeta } from "@/lib/status";
import { GOVERNANCE_METRICS } from "@/lib/demo";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ACTIVE = ["initial_review", "escalated", "testimony_required", "formal_vote", "under_appeal"];

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "You're awake late,";
  if (h < 12) return "Good morning,";
  if (h < 18) return "Good afternoon,";
  return "Good evening,";
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [active, upcoming] = await Promise.all([
    prisma.negotiation.findMany({
      where: { userId: user.id, status: { in: ACTIVE } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.calendarEvent.findMany({
      where: { userId: user.id, state: "approved", start: { gte: new Date(Date.now() - 3600_000) } },
      orderBy: { start: "asc" },
      take: 4,
    }),
  ]);

  const pending = active.length;
  const firstActive = active[0];

  const metrics = [
    { icon: CheckCircle2, label: "Approval rate", value: `${GOVERNANCE_METRICS.approvalRate}%`, tone: "bad" },
    { icon: Clock, label: "Avg. deliberation", value: `${GOVERNANCE_METRICS.avgDeliberationMin} min`, tone: "warn" },
    { icon: Activity, label: "Autonomy score", value: `${user.autonomyScore}/100`, tone: "bad" },
    { icon: Gavel, label: "Top objector", value: GOVERNANCE_METRICS.mostFrequentObjector, tone: "neutral", small: true },
    { icon: Wallet, label: "Money 'saved'", value: `€${GOVERNANCE_METRICS.moneyTheoreticallySaved}`, tone: "good" },
    { icon: Users, label: "Social events prevented", value: `${GOVERNANCE_METRICS.socialEventsPrevented}`, tone: "warn" },
    { icon: Zap, label: "Meetings → async", value: `${GOVERNANCE_METRICS.meetingsConvertedToAsync}`, tone: "neutral" },
    { icon: TrendingDown, label: "Net productivity impact", value: `${GOVERNANCE_METRICS.netProductivityImpact}%`, tone: "bad" },
    { icon: ScrollText, label: "Council trust score", value: `${user.trustScore}/100`, tone: "warn" },
    { icon: ShieldAlert, label: "Unauthorized probability", value: `${GOVERNANCE_METRICS.unauthorizedActionProbability}%`, tone: "bad" },
  ] as const;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {greeting()} {user.displayName || user.name}.
        </h1>
        <p className="mt-1.5 max-w-2xl text-muted-foreground">
          You currently have <span className="font-medium text-foreground">{pending} pending decision{pending === 1 ? "" : "s"}</span> and insufficient authority to resolve them.
        </p>
      </div>

      {/* Quick actions */}
      <div className="mb-8 flex flex-wrap gap-2.5">
        <Link href="/app/new"><Button variant="gold"><Plus className="h-4 w-4" /> Request Permission</Button></Link>
        <Link href={firstActive ? `/app/negotiations/${firstActive.id}` : "/app/negotiations"}>
          <Button variant="outline"><MessagesSquare className="h-4 w-4" /> Continue Negotiation</Button>
        </Link>
        <Link href="/app/council"><Button variant="outline"><Gavel className="h-4 w-4" /> View Council</Button></Link>
        <Link href="/app/negotiations/demo"><Button variant="seal"><Sparkles className="h-4 w-4" /> Trigger Demo</Button></Link>
        <Link href="/app/negotiations/demo?incident=1"><Button variant="outline" className="text-oppose hover:text-oppose"><ShieldAlert className="h-4 w-4" /> Report Unauthorized Activity</Button></Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        {/* Active negotiations */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Active negotiations</h2>
            <Link href="/app/negotiations" className="text-sm text-muted-foreground hover:text-foreground">View all</Link>
          </div>
          {active.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              You have not yet asked permission to live.
            </Card>
          ) : (
            <div className="space-y-3">
              {active.map((n) => {
                const meta = statusMeta(n.status);
                return (
                  <Link key={n.id} href={`/app/negotiations/${n.id}`}>
                    <Card className="group p-4 transition-all hover:border-gold/40 hover:shadow-seal">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{n.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {n.requestedStart ? format(n.requestedStart, "EEE d MMM · HH:mm") : "Time disputed"}
                          </p>
                        </div>
                        <StatusBadge label={meta.label} tone={meta.tone} />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                        <ConsensusPill value={n.consensus} />
                        <span>{n.objectionCount} objections</span>
                        {n.topObjector && <span>Leading opposition: <span className="text-foreground">{n.topObjector}</span></span>}
                        <span className="ml-auto inline-flex items-center gap-1 text-gold opacity-0 transition-opacity group-hover:opacity-100">
                          Open <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Upcoming approved */}
          <div className="mt-8 mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Upcoming approved events</h2>
            <Link href="/app/calendar" className="text-sm text-muted-foreground hover:text-foreground">Calendar</Link>
          </div>
          <div className="space-y-3">
            {upcoming.map((e) => {
              const conditions: string[] = JSON.parse(e.conditions || "[]");
              return (
                <Card key={e.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{e.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {format(e.start, "EEEE, HH:mm")} – {format(e.end, "HH:mm")}
                        {e.location ? ` · ${e.location}` : ""}
                      </p>
                    </div>
                    <StatusBadge label="Approved" tone="good" />
                  </div>
                  {conditions.length > 0 && (
                    <ul className="mt-3 space-y-1 border-t pt-3">
                      {conditions.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              );
            })}
          </div>
        </section>

        {/* Governance metrics */}
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold">Personal governance</h2>
          <div className="grid grid-cols-2 gap-3">
            {metrics.map((m) => {
              const Icon = m.icon;
              return (
                <Card key={m.label} className="p-4">
                  <Icon className={cn("h-4 w-4", m.tone === "bad" ? "text-oppose" : m.tone === "warn" ? "text-conditional" : m.tone === "good" ? "text-approve" : "text-muted-foreground")} />
                  <p className={cn("mt-2 font-display font-semibold tabular", "small" in m && m.small ? "text-sm" : "text-xl")}>{m.value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{m.label}</p>
                </Card>
              );
            })}
          </div>
          <Card className="mt-3 border-gold/30 bg-gold/[0.04] p-4">
            <p className="record-label text-gold">Council insight</p>
            <p className="mt-1.5 text-sm text-foreground/80">
              You spent 4 hours this week deciding whether to spend 45 minutes with friends.
            </p>
          </Card>
        </section>
      </div>
    </div>
  );
}
