"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, PanelRightOpen, Gauge } from "lucide-react";
import { AGENTS } from "@/lib/agents";
import type { DemoSpeed } from "@/lib/types";
import { AgentAvatarStack } from "@/components/brand/agent-avatar";
import { useChatStore } from "@/lib/store/chat";
import { statusMeta } from "@/lib/status";
import { cn } from "@/lib/utils";

const SPEEDS: { key: DemoSpeed; label: string }[] = [
  { key: "realistic", label: "Realistic" },
  { key: "presentation", label: "Presentation" },
  { key: "unhinged", label: "Unhinged" },
];

export function ChatHeader({
  committeeName,
  onOpenRail,
}: {
  committeeName: string;
  onOpenRail?: () => void;
}) {
  const presentAgents = useChatStore((s) => s.presentAgents);
  const typing = useChatStore((s) => s.typing);
  const status = useChatStore((s) => s.status);
  const speed = useChatStore((s) => s.speed);
  const setSpeed = useChatStore((s) => s.setSpeed);

  const statusLine =
    typing.length === 1
      ? `${AGENTS[typing[0]].shortName} is typing…`
      : typing.length > 1
        ? `${typing.length} agents are typing…`
        : statusMeta(status).label;

  return (
    <header className="flex items-center gap-3 border-b bg-sidebar px-3 py-2.5 text-sidebar-foreground sm:px-4">
      <Link href="/app/negotiations" className="rounded-md p-1.5 text-sidebar-foreground/70 hover:bg-white/10 hover:text-white" aria-label="Back">
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <AgentAvatarStack types={presentAgents} size="sm" max={5} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{committeeName}</p>
        <p className={cn("truncate text-[11px]", typing.length ? "text-sidebar-accent" : "text-sidebar-foreground/55")}>
          {presentAgents.length} members · {statusLine}
        </p>
      </div>

      {/* Speed control */}
      <div className="hidden items-center gap-0.5 rounded-full border border-white/10 bg-white/5 p-0.5 sm:flex">
        {SPEEDS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSpeed(s.key)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
              speed === s.key ? "bg-gold text-gold-foreground" : "text-sidebar-foreground/60 hover:text-white",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      {/* Mobile speed cycle */}
      <button
        onClick={() => setSpeed(SPEEDS[(SPEEDS.findIndex((s) => s.key === speed) + 1) % SPEEDS.length].key)}
        className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-sidebar-foreground/70 sm:hidden"
        aria-label="Cycle speed"
      >
        <Gauge className="h-3.5 w-3.5" /> {SPEEDS.find((s) => s.key === speed)?.label}
      </button>

      {onOpenRail && (
        <button onClick={onOpenRail} className="rounded-md p-1.5 text-sidebar-foreground/70 hover:bg-white/10 hover:text-white lg:hidden" aria-label="Council status">
          <PanelRightOpen className="h-5 w-5" />
        </button>
      )}
    </header>
  );
}
