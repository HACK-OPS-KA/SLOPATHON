"use client";

import * as React from "react";
import { AGENTS } from "@/lib/agents";
import { AGENT_TYPES } from "@/lib/types";
import type { AgentState, AgentType, LiveMetric, ProposedSlot } from "@/lib/types";
import { AgentAvatar } from "@/components/brand/agent-avatar";
import { ConsensusMeter } from "@/components/consensus-meter";
import { useChatStore } from "@/lib/store/chat";
import { PHASES, PHASE_LABELS, positionTone, cn } from "@/lib/utils";

const POS_COLOR = {
  good: "text-approve",
  warn: "text-conditional",
  bad: "text-oppose",
  neutral: "text-muted-foreground",
} as const;

const METRIC_TONE = {
  good: "text-approve",
  bad: "text-oppose",
  warn: "text-conditional",
  neutral: "text-muted-foreground",
} as const;

export function CouncilRail() {
  const consensus = useChatStore((s) => s.consensus);
  const phaseKey = useChatStore((s) => s.phaseKey);
  const phaseOfNine = useChatStore((s) => s.phaseOfNine);
  const agentStates = useChatStore((s) => s.agentStates);
  const metrics = useChatStore((s) => s.metrics);
  const slots = useChatStore((s) => s.slots);

  const phaseIndex = phaseOfNine ?? PHASES[phaseKey]?.index ?? 1;

  return (
    <div className="scroll-slim h-full space-y-5 overflow-y-auto p-4">
      {/* Consensus */}
      <section>
        <ConsensusMeter value={consensus} size="md" />
      </section>

      {/* Phase */}
      <section>
        <div className="mb-1.5 flex items-center justify-between">
          <p className="record-label">Phase {phaseIndex} of 9</p>
          <span className="text-xs font-medium">{PHASES[phaseKey]?.title ?? "Deliberation"}</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors", i < phaseIndex ? "bg-gold" : "bg-muted")} />
          ))}
        </div>
      </section>

      {/* Agent positions */}
      <section>
        <p className="record-label mb-2">Agent positions</p>
        <div className="space-y-1">
          {AGENT_TYPES.map((t) => {
            const st: AgentState = agentStates[t];
            const tone = positionTone(st.vote ?? st.position);
            return (
              <div key={t} className={cn("flex items-center gap-2 rounded-md px-1 py-1", !st.present && "opacity-40")}>
                <AgentAvatar type={t} size="xs" dim={!st.present} />
                <span className="flex-1 truncate text-xs">{AGENTS[t].shortName}</span>
                <span className={cn("text-[11px] font-medium", POS_COLOR[tone])}>
                  {st.present ? PHASE_LABELS[st.vote ?? st.position] : "Removed"}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Live metrics */}
      {metrics.length > 0 && (
        <section>
          <p className="record-label mb-2">Live metrics</p>
          <div className="space-y-1.5">
            {metrics.slice(0, 8).map((m: LiveMetric) => (
              <div key={m.key} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{m.label}</span>
                <span className={cn("font-medium tabular", METRIC_TONE[m.tone ?? "neutral"])}>{m.value}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Proposed slots */}
      {slots.length > 0 && (
        <section>
          <p className="record-label mb-2">Proposed slots</p>
          <div className="space-y-1.5">
            {slots.map((s: ProposedSlot) => (
              <div key={s.id} className="rounded-md border p-2">
                <p className="truncate text-xs font-medium">{s.label}</p>
                <p className="text-[11px] text-muted-foreground">Consensus {s.consensus}%</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
