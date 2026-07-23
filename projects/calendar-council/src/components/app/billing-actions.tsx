"use client";

import { Button, type ButtonProps } from "@/components/ui/button";
import { toast } from "@/lib/store/toast";

export function PlanButton({ label, variant = "outline" }: { label: string; variant?: ButtonProps["variant"] }) {
  return (
    <Button
      variant={variant}
      className="w-full"
      onClick={() =>
        toast({
          title: "This is a demo — no payment was taken.",
          description: "Your autonomy, however, remains billable.",
          kind: "council",
        })
      }
    >
      {label}
    </Button>
  );
}
