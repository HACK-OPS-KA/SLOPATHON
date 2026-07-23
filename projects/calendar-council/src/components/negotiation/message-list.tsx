"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { AGENTS } from "@/lib/agents";
import type { AgentType, ChatMessage } from "@/lib/types";
import { AgentAvatar } from "@/components/brand/agent-avatar";
import { MessageRow } from "./chat-message";
import { cn } from "@/lib/utils";

function TypingBubble({ agent }: { agent: AgentType }) {
  return (
    <div className="flex items-end gap-2 py-0.5">
      <AgentAvatar type={agent} size="sm" />
      <div className="rounded-2xl rounded-bl-md border bg-card px-3.5 py-2.5 text-muted-foreground shadow-chat" style={{ borderLeftColor: AGENTS[agent].color, borderLeftWidth: 3 }}>
        <span className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-1.5 w-1.5 rounded-full bg-current animate-typing-dot" style={{ animationDelay: `${i * 0.18}s` }} />
          ))}
        </span>
      </div>
    </div>
  );
}

export function MessageList({
  messages,
  typing,
}: {
  messages: ChatMessage[];
  typing: AgentType[];
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = React.useState(true);

  const onScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    setStuck(nearBottom);
  }, []);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el || !stuck) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing, stuck]);

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="scroll-slim h-full overflow-y-auto px-3 py-4 sm:px-6"
      >
        <div className="mx-auto max-w-2xl space-y-1.5">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              >
                <MessageRow message={m} />
              </motion.div>
            ))}
          </AnimatePresence>
          {typing.map((a) => (
            <TypingBubble key={`typing-${a}`} agent={a} />
          ))}
          <div className="h-2" />
        </div>
      </div>

      <button
        onClick={() => {
          setStuck(true);
          scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
        }}
        className={cn(
          "absolute bottom-4 right-4 grid h-9 w-9 place-items-center rounded-full border bg-background shadow-lg transition-all",
          stuck ? "pointer-events-none translate-y-2 opacity-0" : "opacity-100",
        )}
        aria-label="Scroll to latest"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  );
}
