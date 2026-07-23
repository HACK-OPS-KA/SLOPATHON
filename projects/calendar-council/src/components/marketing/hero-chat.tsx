"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AGENTS } from "@/lib/agents";
import { AgentAvatar, AgentAvatarStack } from "@/components/brand/agent-avatar";
import { HERO_CHAT } from "@/lib/content";
import type { AgentType } from "@/lib/types";
import { AGENT_TYPES } from "@/lib/types";
import { cn } from "@/lib/utils";

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-current opacity-70 animate-typing-dot"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </span>
  );
}

function Bubble({ item }: { item: (typeof HERO_CHAT)[number] }) {
  if (item.system) {
    return (
      <div className="flex justify-center">
        <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-center text-[11px] font-medium text-foreground/80">
          {item.body}
        </span>
      </div>
    );
  }
  const a = AGENTS[item.agent as AgentType];
  return (
    <div className="flex items-end gap-2">
      <AgentAvatar type={item.agent as AgentType} size="sm" />
      <div className="max-w-[80%] rounded-2xl rounded-bl-md border bg-card px-3 py-2 shadow-chat">
        <p className="text-[11px] font-semibold" style={{ color: a.color }}>
          {a.name}
        </p>
        <p className="mt-0.5 text-sm leading-snug text-foreground">{item.body}</p>
      </div>
    </div>
  );
}

export function HeroChat() {
  const reduce = useReducedMotion();
  const seq = HERO_CHAT;
  const [visible, setVisible] = React.useState(reduce ? seq.length : 0);
  const [typing, setTyping] = React.useState<AgentType | "sys" | null>(null);

  React.useEffect(() => {
    if (reduce) {
      setVisible(seq.length);
      return;
    }
    let cancelled = false;
    let t: ReturnType<typeof setTimeout>;
    const run = (i: number) => {
      if (cancelled) return;
      if (i >= seq.length) {
        t = setTimeout(() => {
          if (cancelled) return;
          setVisible(0);
          run(0);
        }, 2800);
        return;
      }
      const m = seq[i];
      setTyping(m.system ? "sys" : (m.agent as AgentType));
      t = setTimeout(
        () => {
          if (cancelled) return;
          setTyping(null);
          setVisible(i + 1);
          t = setTimeout(() => run(i + 1), 750);
        },
        m.system ? 550 : 950,
      );
    };
    run(0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [reduce, seq]);

  const typingCount = 4;

  return (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border bg-background shadow-2xl">
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b bg-sidebar px-4 py-3 text-sidebar-foreground">
        <AgentAvatarStack types={AGENT_TYPES.slice(0, 5)} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">Hirad&apos;s Scheduling Committee</p>
          <p className="text-[11px] text-sidebar-foreground/60">
            12 members · {typingCount} typing…
          </p>
        </div>
        <span className="rounded-full bg-veto/20 px-2 py-0.5 text-[10px] font-medium text-veto">Live</span>
      </div>

      {/* Messages */}
      <div className="flex min-h-[340px] flex-col justify-end gap-2.5 bg-muted/20 p-4">
        <AnimatePresence initial={false} mode="popLayout">
          {seq.slice(0, visible).map((item, i) => (
            <motion.div
              key={i}
              layout
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            >
              <Bubble item={item} />
            </motion.div>
          ))}
          {typing && typing !== "sys" && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-end gap-2"
            >
              <AgentAvatar type={typing} size="sm" />
              <div className="rounded-2xl rounded-bl-md border bg-card px-3 py-2 text-muted-foreground">
                <TypingDots />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Composer (decorative) */}
      <div className="flex items-center gap-2 border-t bg-background p-3">
        <div className="flex-1 rounded-full border bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
          Submit your testimony to the Council…
        </div>
        <div className={cn("grid h-9 w-9 place-items-center rounded-full bg-gold text-gold-foreground")}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
