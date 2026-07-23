import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { toneToBadge, type Tone } from "@/lib/status";

export function StatusBadge({
  label,
  tone,
  className,
}: {
  label: string;
  tone: Tone;
  className?: string;
}) {
  return (
    <Badge variant={toneToBadge(tone)} className={className}>
      {label}
    </Badge>
  );
}
