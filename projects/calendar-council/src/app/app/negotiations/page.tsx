import Link from "next/link";
import { format } from "date-fns";
import { Plus, Sparkles, MessagesSquare } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/app/status-badge";
import { ConsensusPill } from "@/components/consensus-meter";
import { statusMeta } from "@/lib/status";

export const dynamic = "force-dynamic";
export const metadata = { title: "Active Negotiations" };

const ACTIVE = ["initial_review", "escalated", "testimony_required", "formal_vote", "under_appeal"];

export default async function NegotiationsIndex() {
  const user = await getCurrentUser();
  if (!user) return null;

  const all = await prisma.negotiation.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });
  const active = all.filter((n) => ACTIVE.includes(n.status));
  const concluded = all.filter((n) => !ACTIVE.includes(n.status));

  function Row({ n }: { n: (typeof all)[number] }) {
    const meta = statusMeta(n.status);
    return (
      <Link href={`/app/negotiations/${n.id}`}>
        <Card className="group p-4 transition-all hover:border-gold/40 hover:shadow-seal">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{n.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {n.requestedStart ? format(n.requestedStart, "EEE d MMM · HH:mm") : "Time disputed"}
                {n.topObjector ? ` · Opposition: ${n.topObjector}` : ""}
              </p>
            </div>
            <StatusBadge label={meta.label} tone={meta.tone} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <ConsensusPill value={n.consensus} />
            <span>{n.objectionCount} objections</span>
            <span>{n.messageCount} messages</span>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="record-label">Negotiations</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">Council proceedings</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/app/negotiations/demo"><Button variant="seal"><Sparkles className="h-4 w-4" /> Alex Demo</Button></Link>
          <Link href="/app/new"><Button variant="gold"><Plus className="h-4 w-4" /> New Request</Button></Link>
        </div>
      </div>

      {active.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 font-display text-lg font-semibold">In deliberation</h2>
          <div className="space-y-3">{active.map((n) => <Row key={n.id} n={n} />)}</div>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold">Concluded & monitored</h2>
        {concluded.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            <MessagesSquare className="mx-auto mb-2 h-6 w-6 opacity-40" />
            You have not yet asked permission to live.
          </Card>
        ) : (
          <div className="space-y-3">{concluded.map((n) => <Row key={n.id} n={n} />)}</div>
        )}
      </section>
    </div>
  );
}
