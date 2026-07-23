"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  FileText,
  Gavel,
  Mic,
  Ticket,
  ShieldAlert,
  Clock,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { AGENTS } from "@/lib/agents";
import type { AgentType, DecisionDoc, LiveMetric, ProposedSlot, VoteRecord } from "@/lib/types";
import { AgentAvatar } from "@/components/brand/agent-avatar";
import { ConsensusPill } from "@/components/consensus-meter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PHASE_LABELS, positionTone, euro, cn } from "@/lib/utils";

const TONE_CLASS = {
  good: "text-approve",
  bad: "text-oppose",
  warn: "text-conditional",
  neutral: "text-muted-foreground",
} as const;

// ---------------- Metric card ----------------
export function MetricCard({ metrics }: { metrics: LiveMetric[] }) {
  return (
    <div className="rounded-xl border bg-card p-3.5 shadow-chat">
      <p className="record-label mb-2.5 flex items-center gap-1.5">
        <TrendingUp className="h-3.5 w-3.5" /> Live risk model
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
        {metrics.map((m) => (
          <div key={m.key}>
            <p className={cn("font-display text-sm font-semibold tabular", TONE_CLASS[m.tone ?? "neutral"])}>{m.value}</p>
            <p className="text-[11px] leading-tight text-muted-foreground">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- Slot cards ----------------
export function SlotCards({
  slots,
  onNominate,
}: {
  slots: ProposedSlot[];
  onNominate?: (s: ProposedSlot) => void;
}) {
  return (
    <div className="space-y-2.5">
      <p className="record-label flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" /> Proposed time slots
      </p>
      {slots.map((s) => (
        <div key={s.id} className="rounded-xl border bg-card p-3.5 shadow-chat">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-display font-semibold">{s.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.reason}</p>
            </div>
            <ConsensusPill value={s.consensus} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            {s.metrics.cost !== undefined && <span>{euro(s.metrics.cost)}</span>}
            {s.metrics.sleepImpact && <span>Sleep: {s.metrics.sleepImpact}</span>}
            {s.metrics.travelBurden && <span>Travel: {s.metrics.travelBurden}</span>}
            {s.metrics.friendshipValue && <span>Friendship: {s.metrics.friendshipValue}</span>}
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">For</span>
              <div className="flex -space-x-1.5">
                {s.supporting.slice(0, 5).map((a) => <AgentAvatar key={a} type={a} size="xs" className="ring-1 ring-background" />)}
              </div>
            </div>
            {onNominate && (
              <Button size="sm" variant="outline" onClick={() => onNominate(s)}>Nominate</Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------- Poll card ----------------
export function PollCard({ poll }: { poll: { question: string; options: { label: string; votes: number }[] } }) {
  const total = poll.options.reduce((a, o) => a + o.votes, 0) || 1;
  return (
    <div className="rounded-xl border bg-card p-3.5 shadow-chat">
      <p className="mb-3 text-sm font-medium">{poll.question}</p>
      <div className="space-y-2">
        {poll.options.map((o) => {
          const pct = Math.round((o.votes / total) * 100);
          return (
            <div key={o.label}>
              <div className="mb-1 flex justify-between text-xs">
                <span>{o.label}</span>
                <span className="tabular text-muted-foreground">{o.votes}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-gold/70" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">Indicative only. Non-binding. Possibly ignored.</p>
    </div>
  );
}

// ---------------- Vote card (animated) ----------------
export function VoteCard({ votes }: { votes: VoteRecord[] }) {
  return (
    <div className="rounded-xl border bg-card p-3.5 shadow-chat">
      <p className="record-label mb-3 flex items-center gap-1.5">
        <Gavel className="h-3.5 w-3.5" /> Formal vote
      </p>
      <div className="space-y-2">
        {votes.map((v, i) => {
          const a = AGENTS[v.agent];
          const tone = positionTone(v.vote);
          return (
            <motion.div
              key={v.agent}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.45, duration: 0.3 }}
              className="flex items-start gap-2.5"
            >
              <AgentAvatar type={v.agent} size="xs" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: a.color }}>{a.shortName}</span>
                  <Badge
                    variant={tone === "good" ? "approve" : tone === "bad" ? "veto" : tone === "warn" ? "conditional" : "undecided"}
                    className="px-1.5 py-0 text-[10px]"
                  >
                    {PHASE_LABELS[v.vote]}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">{v.rationale}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- Question card ----------------
export function QuestionCard({ question }: { question: string }) {
  return (
    <div className="rounded-xl border border-gold/40 bg-gold/[0.06] p-4 text-center shadow-chat">
      <p className="record-label text-gold">The Council requires clarification</p>
      <p className="mt-2 font-display text-lg">{question}</p>
    </div>
  );
}

// ---------------- Incident card ----------------
export function IncidentCard({ data }: { data: Record<string, unknown> }) {
  const rows: [string, string][] = [
    ["Incident", String(data.incident ?? "Unauthorized Activity")],
    ["Severity", String(data.severity ?? "Critical")],
    ["Status", String(data.status ?? "Already Happened")],
    ["Preventability", String(data.preventability ?? "100%")],
    ["Council Awareness", String(data.councilAwareness ?? "0%")],
    ["User Remorse", String(data.userRemorse ?? "Unclear")],
    ["Governance Damage", String(data.governanceDamage ?? "Severe")],
  ];
  return (
    <div className="overflow-hidden rounded-xl border-2 border-veto/40 bg-veto/[0.04] shadow-chat">
      <div className="flex items-center gap-2 border-b border-veto/30 bg-veto/10 px-4 py-2.5">
        <ShieldAlert className="h-4 w-4 text-veto" />
        <p className="font-display text-sm font-semibold text-veto">Incident Review</p>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-4">
        {rows.map(([k, v]) => (
          <div key={k}>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{k}</p>
            <p className="text-sm font-medium">{v}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-veto/30 px-4 py-2.5">
        <span className="text-xs text-muted-foreground">Trust Score Change</span>
        <span className="font-display text-lg font-semibold text-veto tabular">{String(data.trustScoreChange ?? -38)}</span>
      </div>
    </div>
  );
}

// ---------------- Corrective plan card ----------------
export function CorrectivePlanCard({ data }: { data: Record<string, unknown> }) {
  const actions = (data.actions as string[]) ?? [];
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-chat">
      <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5">
        <FileText className="h-4 w-4 text-conditional" />
        <p className="font-display text-sm font-semibold">Corrective Action Plan</p>
      </div>
      <div className="p-4">
        <p className="mb-3 text-xs text-muted-foreground">
          Following an unauthorized calendar event, the Council has implemented:
        </p>
        <ul className="space-y-2">
          {actions.map((a, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-conditional/15 text-[10px] font-semibold text-conditional">{i + 1}</span>
              {a}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---------------- Decision document ----------------
export function DecisionDocCard({ doc }: { doc: DecisionDoc }) {
  return (
    <div className="overflow-hidden rounded-xl border-2 border-gold/40 bg-card shadow-seal">
      <div className="relative bg-gold/[0.06] px-5 py-4 text-center">
        <p className="record-label text-gold">Council Decision</p>
        <p className="mt-1.5 font-display text-xl font-semibold tracking-tight">{doc.headline}</p>
        <div className="seal-ring absolute right-4 top-4 grid h-11 w-11 -rotate-6 place-items-center rounded-full bg-gold/15">
          <Gavel className="h-5 w-5 text-gold" />
        </div>
      </div>
      <div className="gold-rule" />
      <div className="space-y-4 p-5">
        {doc.recommendedTime && (
          <div>
            <p className="record-label">Recommended time</p>
            <p className="mt-1 font-display text-lg">{doc.recommendedTime}</p>
          </div>
        )}
        <div>
          <p className="record-label mb-2">Conditions</p>
          <ul className="space-y-1.5">
            {doc.conditions.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" />
                {c}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Primary recommendation</p>
          <p className="mt-0.5 font-display text-xl font-semibold text-gold">{doc.recommendation}</p>
        </div>
        {doc.expiresNote && <p className="text-center text-[11px] italic text-muted-foreground">{doc.expiresNote}</p>}
      </div>
    </div>
  );
}

// ---------------- Crisis card (in-chat) ----------------
export function CrisisCard({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="overflow-hidden rounded-xl border-2 border-veto/50 shadow-chat">
      <div className="animate-alarm bg-veto/[0.06] p-5 text-center">
        <p className="record-label text-veto">Governance Status</p>
        <p className="mt-2 font-display text-lg font-semibold text-veto">{String(data.status ?? "Constitutional crisis in progress.")}</p>
        <p className="mt-1.5 text-sm text-muted-foreground">{String(data.detail ?? "")}</p>
      </div>
    </div>
  );
}

// ---------------- Attachments ----------------
export function AttachmentChip({ kind }: { kind: "ticket" | "route_doc" }) {
  const isTicket = kind === "ticket";
  return (
    <span className="mt-1.5 inline-flex items-center gap-2 rounded-lg border bg-background/60 px-2.5 py-1.5 text-xs text-muted-foreground">
      {isTicket ? <Ticket className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
      {isTicket ? "Jira ticket created" : "route-model-final-v6.pdf"}
    </span>
  );
}

export function VoiceNote({ seconds = 12 }: { seconds?: number }) {
  return (
    <span className="mt-1 inline-flex items-center gap-2">
      <Mic className="h-4 w-4 text-current opacity-70" />
      <span className="flex h-5 items-center gap-[2px]">
        {Array.from({ length: 22 }).map((_, i) => (
          <span key={i} className="w-[2px] rounded-full bg-current opacity-50" style={{ height: `${5 + ((i * 7) % 14)}px` }} />
        ))}
      </span>
      <span className="text-[11px] tabular opacity-70">0:{String(seconds).padStart(2, "0")}</span>
    </span>
  );
}

export { AlertTriangle };
