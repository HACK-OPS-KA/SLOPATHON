"use client";

import * as React from "react";
import { ChevronDown, ShieldCheck, Flame, Radio, Gavel } from "lucide-react";
import { AGENTS } from "@/lib/agents";
import type { AgentType } from "@/lib/types";
import { AGENT_TYPES } from "@/lib/types";
import { AgentAvatar } from "@/components/brand/agent-avatar";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { updateAgentConfig } from "@/lib/actions/settings";
import { toast } from "@/lib/store/toast";
import { cn } from "@/lib/utils";

export interface AgentCfg {
  agentType: string;
  influence: number;
  vetoEnabled: boolean;
  aggression: number;
  messageFrequency: number;
  interrogationEnabled: boolean;
  enabled: boolean;
}

interface Stat {
  trust: number;
  interventions: number;
  approvalRate: number;
  complaints: string[];
}

const COMPLAINTS: string[] = [
  "Consistently exceeds allotted speaking time.",
  "Filed 3 objections with no supporting evidence.",
  "Refers to the user in the third person during testimony.",
  "Escalated a coffee to committee review.",
  "Proposed Tuesday. Again.",
  "Reopened a settled matter over a 1% forecast change.",
];

const LOWER_REACTIONS: Partial<Record<AgentType, string>> = {
  sleep: "I see.",
  career: "This reads as a demotion. Noted for the record.",
  gym: "You'll regret this on leg day.",
  relationship: "Finally. Some restraint.",
  social: "Fewer interventions? I'm cautiously relieved.",
  finance: "A rare and welcome cost saving.",
  weather: "The forecast disapproves of this change.",
  circadian: "Physiologically, this is a mistake.",
  logistics: "I'll re-model the implications. All six routes.",
  nutrition: "As long as protein remains represented.",
  productivity: "This change was made without stakeholder consultation.",
  chaos: "Give me the veto. GIVE. ME. THE. VETO.",
};

function statFor(a: AgentType): Stat {
  const d = AGENTS[a];
  const seed = d.defaultInfluence + d.defaultAggression;
  return {
    trust: Math.max(15, Math.min(95, 70 - Math.round(d.defaultAggression / 3))),
    interventions: Math.round(d.defaultInfluence * 1.6 + d.defaultAggression * 0.5),
    approvalRate: Math.max(4, Math.min(70, 60 - Math.round(d.defaultAggression / 2))),
    complaints: [COMPLAINTS[seed % COMPLAINTS.length], COMPLAINTS[(seed + 3) % COMPLAINTS.length]],
  };
}

export function CouncilManager({ initial }: { initial: AgentCfg[] }) {
  const [configs, setConfigs] = React.useState<Record<string, AgentCfg>>(() =>
    Object.fromEntries(initial.map((c) => [c.agentType, c])),
  );
  const [open, setOpen] = React.useState<string | null>(null);
  const [, startTransition] = React.useTransition();

  function persist(agent: string, patch: Partial<AgentCfg>) {
    startTransition(() => {
      updateAgentConfig(agent, patch as never);
    });
  }

  function setField(agent: AgentType, key: keyof AgentCfg, value: number | boolean) {
    const cur = configs[agent];
    // Guard: cannot disable the last enabled agent.
    if (key === "enabled" && value === false) {
      const enabledCount = Object.values(configs).filter((c) => c.enabled).length;
      if (enabledCount <= 1) {
        toast({ title: "Council dissolution requires Council approval.", kind: "warning" });
        return;
      }
    }
    const next = { ...cur, [key]: value } as AgentCfg;
    setConfigs((c) => ({ ...c, [agent]: next }));
    persist(agent, { [key]: value });

    // Reactions to reduced power (discrete events only, to avoid spam)
    if (
      (key === "vetoEnabled" && value === false) ||
      (key === "enabled" && value === false) ||
      (key === "influence" && (value as number) < 20 && cur.influence >= 20)
    ) {
      toast({ title: `${AGENTS[agent].name}: “${LOWER_REACTIONS[agent] ?? "Noted."}”`, kind: "council" });
    }
  }

  return (
    <div className="space-y-2.5">
      {AGENT_TYPES.map((t) => {
        const a = AGENTS[t];
        const cfg = configs[t];
        const stat = statFor(t);
        const expanded = open === t;
        return (
          <Card key={t} className={cn("overflow-hidden transition-shadow", expanded && "shadow-seal", !cfg.enabled && "opacity-70")}>
            <button className="flex w-full items-center gap-3 p-4 text-left" onClick={() => setOpen(expanded ? null : t)}>
              <AgentAvatar type={t} size="md" dim={!cfg.enabled} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{a.name}</p>
                  {cfg.vetoEnabled && <Badge variant="veto" className="px-1.5 py-0 text-[10px]"><Gavel className="mr-0.5 h-2.5 w-2.5" />Veto</Badge>}
                </div>
                <p className="truncate text-xs text-muted-foreground">{a.role}</p>
              </div>
              <div className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex">
                <span className="tabular">Influence {cfg.influence}</span>
                <span className="tabular">{stat.interventions} interventions</span>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", expanded && "rotate-180")} />
            </button>

            {expanded && (
              <div className="border-t px-4 pb-4 pt-4">
                <p className="mb-4 text-sm italic text-muted-foreground">“{a.mostCommonPhrase}” — most frequent utterance</p>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-4">
                    <SliderRow label="Influence" value={cfg.influence} onChange={(v) => setField(t, "influence", v)} />
                    <SliderRow label="Aggression" value={cfg.aggression} onChange={(v) => setField(t, "aggression", v)} />
                    <SliderRow label="Message frequency" value={cfg.messageFrequency} onChange={(v) => setField(t, "messageFrequency", v)} />
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm"><Gavel className="h-4 w-4 text-muted-foreground" /> Veto power</span>
                      <Switch checked={cfg.vetoEnabled} onCheckedChange={(v) => setField(t, "vetoEnabled", v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm"><Radio className="h-4 w-4 text-muted-foreground" /> May interrogate you</span>
                      <Switch checked={cfg.interrogationEnabled} onCheckedChange={(v) => setField(t, "interrogationEnabled", v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm"><ShieldCheck className="h-4 w-4 text-muted-foreground" /> Seated on the Council</span>
                      <Switch checked={cfg.enabled} onCheckedChange={(v) => setField(t, "enabled", v)} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <Stat label="Trust" value={`${stat.trust}`} />
                      <Stat label="Interventions" value={`${stat.interventions}`} />
                      <Stat label="Approval rate" value={`${stat.approvalRate}%`} />
                    </div>
                    <div>
                      <p className="record-label mb-1.5">Known alliances</p>
                      <div className="flex flex-wrap gap-1">
                        {a.allies.map((al) => <Badge key={al} variant="muted" className="text-[10px]">{AGENTS[al].shortName}</Badge>)}
                      </div>
                    </div>
                    <div>
                      <p className="record-label mb-1.5">Known conflicts</p>
                      <div className="flex flex-wrap gap-1">
                        {a.rivals.slice(0, 4).map((r) => <Badge key={r} variant="oppose" className="text-[10px]">{AGENTS[r].shortName}</Badge>)}
                      </div>
                    </div>
                    <div>
                      <p className="record-label mb-1.5">Recent complaints</p>
                      <ul className="space-y-1">
                        {stat.complaints.map((c, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <Flame className="mt-0.5 h-3 w-3 shrink-0 text-conditional" /> {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function SliderRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-sm">
        <span>{label}</span>
        <span className="tabular text-muted-foreground">{value}</span>
      </div>
      <Slider value={[value]} min={0} max={100} step={1} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-2 text-center">
      <p className="font-display text-lg font-semibold tabular">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
