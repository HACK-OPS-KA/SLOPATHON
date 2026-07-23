"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Landmark, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/lib/store/chat";

export function CrisisOverlay() {
  const crisisMode = useChatStore((s) => s.crisisMode);
  const router = useRouter();
  if (!crisisMode) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 grid place-items-center bg-background/95 p-6 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.94, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        className="w-full max-w-lg overflow-hidden rounded-2xl border-2 border-veto/40 bg-card shadow-2xl"
      >
        <div className="animate-alarm border-b border-veto/30 bg-veto/[0.06] px-6 py-5 text-center">
          <p className="record-label text-veto">Governance Status</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-veto">Constitutional crisis in progress</h2>
        </div>
        <div className="space-y-5 p-6 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gold/10">
            <Landmark className="h-7 w-7 text-gold" />
          </div>
          <p className="text-sm text-muted-foreground">
            User autonomy temporarily restored due to administrative confusion. The Council is
            reconsidering its constitutional legitimacy.
          </p>
          <Button variant="gold" size="lg" className="w-full" onClick={() => router.push("/app/calendar")}>
            Return to Calendar Before They Recover <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-[11px] italic text-muted-foreground">Chaos Agent: “Finally.”</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
