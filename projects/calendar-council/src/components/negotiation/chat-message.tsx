"use client";

import * as React from "react";
import { AGENTS } from "@/lib/agents";
import type { AgentType, ChatMessage } from "@/lib/types";
import { AgentAvatar } from "@/components/brand/agent-avatar";
import { useChatStore } from "@/lib/store/chat";
import { cn } from "@/lib/utils";
import {
  MetricCard,
  SlotCards,
  PollCard,
  VoteCard,
  QuestionCard,
  IncidentCard,
  CorrectivePlanCard,
  DecisionDocCard,
  CrisisCard,
  AttachmentChip,
  VoiceNote,
} from "./cards";

const CARD_TYPES = new Set([
  "metric_card",
  "slot_card",
  "poll",
  "vote_card",
  "question",
  "incident_card",
  "corrective_plan",
  "decision_doc",
  "crisis",
]);

function ReplyPreview({ agent, preview }: { agent?: AgentType | "user" | "system"; preview?: string }) {
  if (!preview) return null;
  const name =
    agent === "user" ? "You" : agent === "system" || !agent ? "System" : AGENTS[agent as AgentType].name;
  const color = agent && agent !== "user" && agent !== "system" ? AGENTS[agent as AgentType].color : undefined;
  return (
    <div className="mb-1.5 border-l-2 pl-2 text-xs" style={{ borderColor: color ?? "hsl(var(--muted-foreground))" }}>
      <p className="font-medium" style={{ color }}>{name}</p>
      <p className="truncate text-muted-foreground">{preview}</p>
    </div>
  );
}

function Reactions({ message }: { message: ChatMessage }) {
  if (!message.reactions?.length) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {message.reactions.map((r, i) => (
        <span key={i} className="inline-flex items-center gap-1 rounded-full border bg-background px-1.5 py-0.5 text-[11px] shadow-sm">
          <span>{r.emoji}</span>
          <span className="tabular text-muted-foreground">{r.agents.length}</span>
        </span>
      ))}
    </div>
  );
}

export function MessageRow({ message }: { message: ChatMessage }) {
  const nominateSlot = useChatStore((s) => s.nominateSlot);
  const meta = (message.metadata ?? {}) as Record<string, any>;

  // --- Card messages (full width) ---
  if (CARD_TYPES.has(message.type)) {
    let node: React.ReactNode = null;
    switch (message.type) {
      case "metric_card": node = <MetricCard metrics={meta.metrics ?? []} />; break;
      case "slot_card": node = <SlotCards slots={meta.slots ?? []} onNominate={nominateSlot} />; break;
      case "poll": node = <PollCard poll={meta.poll} />; break;
      case "vote_card": node = <VoteCard votes={meta.votes ?? []} />; break;
      case "question": node = <QuestionCard question={meta.question ?? message.body} />; break;
      case "incident_card": node = <IncidentCard data={meta} />; break;
      case "corrective_plan": node = <CorrectivePlanCard data={meta} />; break;
      case "decision_doc": node = <DecisionDocCard doc={meta.doc} />; break;
      case "crisis": node = <CrisisCard data={meta} />; break;
    }
    return <div className="mx-auto w-full max-w-md py-1">{node}</div>;
  }

  // --- System notices ---
  if (message.sender === "system") {
    const alarm = Boolean(meta.alarm);
    return (
      <div className="flex justify-center py-0.5">
        <div
          className={cn(
            "max-w-[90%] whitespace-pre-line rounded-full px-3 py-1 text-center text-[11px] font-medium",
            alarm ? "animate-alarm border border-veto/40 bg-veto/10 text-veto" : "bg-muted/70 text-muted-foreground",
          )}
        >
          {message.body}
        </div>
      </div>
    );
  }

  // --- User bubble ---
  if (message.sender === "user") {
    return (
      <div className="flex justify-end py-0.5">
        <div className="max-w-[82%] rounded-2xl rounded-br-md bg-gold px-3.5 py-2 text-gold-foreground shadow-chat">
          <p className="whitespace-pre-line text-sm leading-snug">{message.body}</p>
        </div>
      </div>
    );
  }

  // --- Agent bubble ---
  const a = message.agent ? AGENTS[message.agent] : null;
  return (
    <div className="flex items-end gap-2 py-0.5">
      <AgentAvatar type={message.agent as AgentType} size="sm" className="mb-0.5" />
      <div className="max-w-[82%]">
        <div
          className="rounded-2xl rounded-bl-md border bg-card px-3.5 py-2 shadow-chat"
          style={{ borderLeftColor: a?.color, borderLeftWidth: 3 }}
        >
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-semibold" style={{ color: a?.color }}>{a?.name}</span>
          </div>
          <div className="mt-0.5">
            <ReplyPreview agent={message.replyToAgent} preview={message.replyToPreview} />
            <p className={cn("whitespace-pre-line text-sm leading-snug", message.deleted && "italic text-muted-foreground")}>
              {message.body}
            </p>
            {message.type === "voice_note" && <VoiceNote seconds={message.voiceSeconds ?? 12} />}
            {(message.type === "ticket" || message.type === "route_doc") && <AttachmentChip kind={message.type} />}
            {message.edited && <span className="ml-1 text-[10px] text-muted-foreground">(edited)</span>}
          </div>
        </div>
        <Reactions message={message} />
      </div>
    </div>
  );
}
