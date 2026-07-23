import * as React from "react";
import {
  Calendar,
  HeartPulse,
  Activity,
  Linkedin,
  Landmark,
  CloudRain,
  Map,
  Apple,
  Moon,
  MessageCircle,
  Hash,
  Train,
  Plug,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  calendar: Calendar,
  "heart-pulse": HeartPulse,
  activity: Activity,
  linkedin: Linkedin,
  landmark: Landmark,
  "cloud-rain": CloudRain,
  map: Map,
  apple: Apple,
  moon: Moon,
  "message-circle": MessageCircle,
  hash: Hash,
  train: Train,
};

export function IntegrationIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Plug;
  return (
    <span className={cn("grid place-items-center rounded-lg border bg-muted/50 text-foreground/70", className)}>
      <Icon className="h-[55%] w-[55%]" />
    </span>
  );
}
