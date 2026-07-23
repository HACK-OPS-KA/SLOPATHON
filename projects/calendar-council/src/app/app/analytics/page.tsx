import {
  CheckCircle2,
  Clock,
  TrendingDown,
  Users,
  Wallet,
  Activity,
  Lightbulb,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { ANALYTICS_INSIGHTS, GOVERNANCE_METRICS } from "@/lib/demo";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics" };

const APPROVED = new Set(["approved", "provisional", "approved_conditions"]);

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const negs = await prisma.negotiation.findMany({ where: { userId: user.id } });
  const decided = negs.filter((n) => n.finalDecision);
  const approvedCount = decided.filter((n) => APPROVED.has(n.finalDecision || "")).length;
  const approvalRate = decided.length ? Math.round((approvedCount / decided.length) * 100) : GOVERNANCE_METRICS.approvalRate;
  const avgConsensus = negs.length ? Math.round(negs.reduce((a, n) => a + n.consensus, 0) / negs.length) : 0;
  const avgMin = negs.length ? Math.round(negs.reduce((a, n) => a + n.deliberationMs, 0) / negs.length / 60000) : 0;
  const incidents = negs.filter((n) => n.hadIncident).length;

  // Top objectors tally
  const tally = new Map<string, number>();
  for (const n of negs) if (n.topObjector) tally.set(n.topObjector, (tally.get(n.topObjector) || 0) + 1);
  const objectors = Array.from(tally.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxObj = Math.max(1, ...objectors.map((o) => o[1]));

  // Fake approval-over-time (deterministic decline)
  const weeks = [62, 55, 51, 44, 40, 37, 34, 31];

  const metrics = [
    { icon: CheckCircle2, label: "Approval rate", value: `${approvalRate}%`, tone: "bad" },
    { icon: Activity, label: "Average consensus", value: `${avgConsensus}%`, tone: "warn" },
    { icon: Clock, label: "Avg. time to decision", value: `${avgMin} min`, tone: "warn" },
    { icon: Users, label: "Social events prevented", value: `${GOVERNANCE_METRICS.socialEventsPrevented}`, tone: "warn" },
    { icon: Wallet, label: "Money theoretically saved", value: `€${GOVERNANCE_METRICS.moneyTheoreticallySaved}`, tone: "good" },
    { icon: TrendingDown, label: "Autonomy trend (mo.)", value: "-12%", tone: "bad" },
  ] as const;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6">
        <p className="record-label">Analytics</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">Governance analytics</h1>
        <p className="mt-1.5 text-muted-foreground">Quantifying the cost of asking permission to live. {incidents} logged incident{incidents === 1 ? "" : "s"}.</p>
      </div>

      {/* Metric grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.label} className="p-4">
              <Icon className={cn("h-4 w-4", m.tone === "bad" ? "text-oppose" : m.tone === "warn" ? "text-conditional" : "text-approve")} />
              <p className="mt-2 font-display text-2xl font-semibold tabular">{m.value}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Top objectors */}
        <Card className="p-5">
          <p className="record-label mb-4">Top objecting agents</p>
          <div className="space-y-2.5">
            {objectors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No objections recorded yet.</p>
            ) : objectors.map(([name, count]) => (
              <div key={name} className="flex items-center gap-3">
                <span className="w-32 shrink-0 truncate text-xs">{name}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gold/70" style={{ width: `${(count / maxObj) * 100}%` }} />
                </div>
                <span className="w-6 text-right text-xs tabular text-muted-foreground">{count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Approval over time */}
        <Card className="p-5">
          <p className="record-label mb-4">Approval rate over time</p>
          <div className="flex h-40 items-end gap-2">
            {weeks.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex w-full items-end justify-center" style={{ height: "100%" }}>
                  <div className="w-full rounded-t bg-gradient-to-t from-oppose/60 to-gold/60" style={{ height: `${v}%` }} />
                </div>
                <span className="text-[10px] text-muted-foreground">W{i + 1}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">Trending toward institutional collapse, as designed.</p>
        </Card>
      </div>

      {/* Insight cards */}
      <div className="mt-6">
        <p className="record-label mb-3">Council insights</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ANALYTICS_INSIGHTS.map((s, i) => (
            <Card key={i} className="border-gold/25 bg-gold/[0.04] p-4">
              <Lightbulb className="h-4 w-4 text-gold" />
              <p className="mt-2 text-sm text-foreground/85">{s}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
