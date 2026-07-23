import Link from "next/link";
import { format } from "date-fns";
import { Check, X, MessagesSquare, ShieldAlert } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/app/status-badge";
import { ConsensusPill } from "@/components/consensus-meter";
import { decisionMeta } from "@/lib/status";

export const dynamic = "force-dynamic";
export const metadata = { title: "History" };

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const records = await prisma.negotiation.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6">
        <p className="record-label">History</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">Negotiation record</h1>
        <p className="mt-1.5 text-muted-foreground">Every request you have ever submitted for institutional review.</p>
      </div>

      {records.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          The Council found no record of that decision. It may have been spontaneous.
        </Card>
      ) : (
        <div className="space-y-2.5">
          {records.map((n) => {
            const dm = decisionMeta(n.finalDecision);
            return (
              <Card key={n.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{n.title}</p>
                      {n.hadIncident && <Badge variant="veto" className="text-[10px]"><ShieldAlert className="mr-0.5 h-2.5 w-2.5" />Incident</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {n.requestedStart ? format(n.requestedStart, "EEE d MMM yyyy") : "Date disputed"} · {Math.round(n.deliberationMs / 60000)} min deliberation · {n.messageCount} messages · {n.objectionCount} objections
                    </p>
                  </div>
                  <StatusBadge label={dm.label} tone={dm.tone} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t pt-3 text-xs text-muted-foreground">
                  <ConsensusPill value={n.consensus} />
                  {n.topObjector && <span>Most argumentative: <span className="text-foreground">{n.topObjector}</span></span>}
                  <span className="inline-flex items-center gap-1">
                    Complied: {n.userComplied === null ? "—" : n.userComplied ? <Check className="h-3.5 w-3.5 text-approve" /> : <X className="h-3.5 w-3.5 text-oppose" />}
                  </span>
                  <Link href={`/app/negotiations/${n.id}`} className="ml-auto">
                    <Button variant="outline" size="sm"><MessagesSquare className="h-3.5 w-3.5" /> Replay</Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
