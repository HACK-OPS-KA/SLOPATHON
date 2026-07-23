"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Gavel, X } from "lucide-react";
import { useToastStore, type ToastItem } from "@/lib/store/toast";
import { cn } from "@/lib/utils";

function ToastRow({ t }: { t: ToastItem }) {
  const dismiss = useToastStore((s) => s.dismiss);
  React.useEffect(() => {
    const id = setTimeout(() => dismiss(t.id), t.duration ?? 4200);
    return () => clearTimeout(id);
  }, [t.id, t.duration, dismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className={cn(
        "pointer-events-auto flex w-80 items-start gap-3 rounded-lg border bg-popover p-3.5 shadow-lg",
        t.kind === "warning" && "border-conditional/40",
        t.kind === "council" && "border-gold/40",
      )}
    >
      <div
        className={cn(
          "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md",
          t.kind === "council" ? "bg-gold/15 text-gold" : t.kind === "warning" ? "bg-conditional/15 text-conditional" : "bg-muted text-muted-foreground",
        )}
      >
        <Gavel className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-tight">{t.title}</p>
        {t.description && <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>}
      </div>
      <button
        onClick={() => dismiss(t.id)}
        className="text-muted-foreground/60 transition-colors hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastRow key={t.id} t={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
