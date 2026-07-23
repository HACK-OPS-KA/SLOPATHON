"use client";

import * as React from "react";
import { Bell, AlertTriangle, Gavel, TrendingDown, ShieldAlert } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { AgentAvatar } from "@/components/brand/agent-avatar";
import type { AgentType } from "@/lib/types";
import { relativeTime, cn } from "@/lib/utils";

export interface NotificationItem {
  id: string;
  title: string;
  kind: string;
  agentType: string | null;
  read: boolean;
  createdAt: number;
}

const KIND_ICON: Record<string, React.ReactNode> = {
  objection: <AlertTriangle className="h-4 w-4 text-conditional" />,
  escalation: <ShieldAlert className="h-4 w-4 text-oppose" />,
  incident: <AlertTriangle className="h-4 w-4 text-veto" />,
  decision: <Gavel className="h-4 w-4 text-gold" />,
  info: <TrendingDown className="h-4 w-4 text-muted-foreground" />,
};

export function Notifications({ items }: { items: NotificationItem[] }) {
  const [seen, setSeen] = React.useState(false);
  const unread = items.filter((i) => !i.read).length;
  const badge = seen ? 0 : unread;

  return (
    <Popover onOpenChange={(o) => o && setSeen(true)}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-[1.15rem] w-[1.15rem]" />
          {badge > 0 && (
            <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-veto px-1 text-[9px] font-semibold text-white">
              {badge}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="font-display text-sm font-semibold">Council Notices</p>
          <span className="record-label">{items.length} total</span>
        </div>
        <div className="max-h-[24rem] overflow-y-auto scroll-slim">
          {items.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No notices. The Council is watching in silence.
            </p>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-3 border-b border-border/60 px-4 py-3 last:border-0",
                  !n.read && "bg-gold/[0.04]",
                )}
              >
                {n.agentType ? (
                  <AgentAvatar type={n.agentType as AgentType} size="sm" />
                ) : (
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-muted">
                    {KIND_ICON[n.kind] ?? KIND_ICON.info}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">{n.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{relativeTime(n.createdAt)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
