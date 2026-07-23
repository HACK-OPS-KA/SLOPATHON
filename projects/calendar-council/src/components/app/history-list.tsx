"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Search,
  Clock,
  MessagesSquare,
  Gavel,
  Play,
  ShieldAlert,
  Check,
  X,
  ScrollText,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/app/status-badge";
import { ConsensusPill } from "@/components/consensus-meter";
import { decisionMeta } from "@/lib/status";
import { cn } from "@/lib/utils";

export interface HistoryRecord {
  id: string;
  title: string;
  requestedStart: number | null;
  finalDecision: string | null;
  status: string;
  consensus: number;
  deliberationMs: number;
  messageCount: number;
  objectionCount: number;
  topObjector: string | null;
  userComplied: boolean | null;
  hadIncident: boolean;
  incidentCount: number;
  createdAt: number;
}

type Filter = "all" | "approved" | "rejected" | "incidents" | "monitoring";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All decisions" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "incidents", label: "Incidents" },
  { value: "monitoring", label: "Under monitoring" },
];

function minutes(ms: number): string {
  const m = Math.round(ms / 60000);
  return m < 1 ? "<1 min" : `${m} min`;
}

function matchesFilter(r: HistoryRecord, filter: Filter): boolean {
  if (filter === "all") return true;
  if (filter === "incidents") return r.hadIncident;
  if (filter === "monitoring") return r.status === "monitoring";
  const tone = decisionMeta(r.finalDecision).tone;
  if (filter === "approved") return tone === "good" || tone === "gold";
  if (filter === "rejected") return tone === "veto" || tone === "bad";
  return true;
}

export function HistoryList({ records }: { records: HistoryRecord[] }) {
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("all");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter(
      (r) => (q === "" || r.title.toLowerCase().includes(q)) && matchesFilter(r, filter),
    );
  }, [records, query, filter]);

  return (
    <div>
      {/* Controls */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the record by event…"
            className="pl-9"
            aria-label="Search history"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <SelectTrigger className="w-full sm:w-[200px]" aria-label="Filter decisions">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        Showing <span className="font-medium text-foreground">{filtered.length}</span> of {records.length} archived proceeding{records.length === 1 ? "" : "s"}.
      </p>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <ScrollText className="mx-auto mb-3 h-7 w-7 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            The Council found no record of that decision. It may have been spontaneous.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const meta = decisionMeta(r.finalDecision);
            return (
              <Card key={r.id} className="group p-4 transition-all hover:border-gold/40 hover:shadow-seal">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {r.requestedStart ? format(new Date(r.requestedStart), "EEE d MMM yyyy · HH:mm") : "Time disputed"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                    {r.hadIncident && (
                      <Badge variant="veto">
                        <ShieldAlert className="h-3 w-3" /> Incident
                      </Badge>
                    )}
                    <StatusBadge label={meta.label} tone={meta.tone} />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                  <ConsensusPill value={r.consensus} />
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {minutes(r.deliberationMs)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessagesSquare className="h-3.5 w-3.5" /> {r.messageCount} messages
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Gavel className="h-3.5 w-3.5" /> {r.objectionCount} objections
                  </span>
                  {r.topObjector && (
                    <span>
                      Leading opposition: <span className="text-foreground">{r.topObjector}</span>
                    </span>
                  )}
                  {r.userComplied !== null && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
                        r.userComplied ? "bg-approve/15 text-approve" : "bg-oppose/15 text-oppose",
                      )}
                    >
                      {r.userComplied ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      {r.userComplied ? "Complied" : "Overruled Council"}
                    </span>
                  )}
                  <Link href={`/app/negotiations/${r.id}`} className="ml-auto">
                    <Button variant="outline" size="sm">
                      <Play className="h-3.5 w-3.5" /> Replay
                    </Button>
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
