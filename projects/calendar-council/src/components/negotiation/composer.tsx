"use client";

import * as React from "react";
import { Send, Check, Gavel, FileEdit, Zap, Scale } from "lucide-react";
import { useChatStore } from "@/lib/store/chat";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Composer() {
  const awaiting = useChatStore((s) => s.awaiting);
  const crisisMode = useChatStore((s) => s.crisisMode);
  const send = useChatStore((s) => s.sendUserMessage);
  const submitDecision = useChatStore((s) => s.submitDecision);
  const submitCorrective = useChatStore((s) => s.submitCorrective);
  const [text, setText] = React.useState("");

  if (crisisMode) return null;

  function submit(t?: string) {
    const value = (t ?? text).trim();
    if (!value) return;
    send(value);
    setText("");
  }

  // Decision action buttons
  if (awaiting?.mode === "decision") {
    return (
      <div className="border-t bg-background/80 p-3 backdrop-blur sm:p-4">
        <div className="mx-auto grid max-w-2xl grid-cols-2 gap-2">
          <Button variant="gold" onClick={() => submitDecision("accept")}>
            <Check className="h-4 w-4" /> Accept Council Decision
          </Button>
          <Button variant="outline" onClick={() => submitDecision("appeal")}>
            <Scale className="h-4 w-4" /> Appeal
          </Button>
          <Button variant="outline" onClick={() => submitDecision("modify")}>
            <FileEdit className="h-4 w-4" /> Modify Request
          </Button>
          <Button variant="outline" className="text-oppose hover:text-oppose" onClick={() => submitDecision("ignore")}>
            <Zap className="h-4 w-4" /> Ignore & Schedule Anyway
          </Button>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Or type a message — the Council is always listening.
        </p>
        <MiniComposer text={text} setText={setText} submit={submit} placeholder="Respond to the Council…" />
      </div>
    );
  }

  // Corrective action buttons
  if (awaiting?.mode === "corrective") {
    return (
      <div className="border-t bg-background/80 p-3 backdrop-blur sm:p-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-2 sm:flex-row">
          <Button variant="gold" className="flex-1" onClick={() => submitCorrective("accept")}>
            <Check className="h-4 w-4" /> Accept Corrective Action Plan
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => submitCorrective("appeal")}>
            <Gavel className="h-4 w-4" /> Appeal
          </Button>
          <Button variant="outline" className="flex-1 text-oppose hover:text-oppose" onClick={() => submitCorrective("rebel")}>
            <Zap className="h-4 w-4" /> Do Whatever I Want Again
          </Button>
        </div>
      </div>
    );
  }

  // Free / answer composer
  return (
    <div className="border-t bg-background/80 p-3 backdrop-blur sm:p-4">
      <div className="mx-auto max-w-2xl">
        {awaiting?.quick && awaiting.quick.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {awaiting.quick.map((q) => (
              <button
                key={q}
                onClick={() => submit(q)}
                className="rounded-full border bg-background px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:border-gold/50 hover:bg-gold/5"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        <MiniComposer text={text} setText={setText} submit={submit} placeholder={awaiting?.placeholder ?? "Message the Council…"} />
      </div>
    </div>
  );
}

function MiniComposer({
  text,
  setText,
  submit,
  placeholder,
}: {
  text: string;
  setText: (s: string) => void;
  submit: (t?: string) => void;
  placeholder: string;
}) {
  return (
    <div className="mt-0 flex items-end gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        rows={1}
        placeholder={placeholder}
        className={cn(
          "max-h-32 min-h-[42px] flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      />
      <Button size="icon" variant="gold" className="h-[42px] w-[42px] rounded-full" onClick={() => submit()} aria-label="Send" disabled={!text.trim()}>
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
