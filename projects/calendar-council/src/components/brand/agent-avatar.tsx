import * as React from "react";
import {
  Moon,
  Briefcase,
  Dumbbell,
  Heart,
  BatteryLow,
  Calculator,
  CloudRain,
  Activity,
  Route,
  Apple,
  CheckSquare,
  Dices,
  type LucideIcon,
} from "lucide-react";
import { AGENTS } from "@/lib/agents";
import type { AgentType } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  moon: Moon,
  briefcase: Briefcase,
  dumbbell: Dumbbell,
  heart: Heart,
  "battery-low": BatteryLow,
  calculator: Calculator,
  "cloud-rain": CloudRain,
  activity: Activity,
  route: Route,
  apple: Apple,
  "check-square": CheckSquare,
  dices: Dices,
};

export function AgentIcon({ type, className }: { type: AgentType; className?: string }) {
  const Icon = ICONS[AGENTS[type].icon] ?? Dices;
  return <Icon className={className} />;
}

const SIZES = {
  xs: "h-6 w-6 [&_svg]:h-3 [&_svg]:w-3",
  sm: "h-8 w-8 [&_svg]:h-4 [&_svg]:w-4",
  md: "h-10 w-10 [&_svg]:h-5 [&_svg]:w-5",
  lg: "h-12 w-12 [&_svg]:h-6 [&_svg]:w-6",
  xl: "h-16 w-16 [&_svg]:h-7 [&_svg]:w-7",
};

export function AgentAvatar({
  type,
  size = "md",
  ring = false,
  dim = false,
  className,
}: {
  type: AgentType;
  size?: keyof typeof SIZES;
  ring?: boolean;
  dim?: boolean;
  className?: string;
}) {
  const a = AGENTS[type];
  return (
    <span
      className={cn(
        "relative inline-grid shrink-0 place-items-center rounded-[30%] text-white shadow-sm transition-all",
        SIZES[size],
        ring && "ring-2 ring-offset-2 ring-offset-background",
        dim && "opacity-40 grayscale",
        className,
      )}
      style={{
        background: `linear-gradient(145deg, ${a.color}, ${a.color2})`,
        color: a.onColor,
        // @ts-expect-error CSS var for ring color
        "--tw-ring-color": a.color,
      }}
      aria-hidden
    >
      <AgentIcon type={type} />
    </span>
  );
}

/** Overlapping stack of agent avatars — used for the council group avatar. */
export function AgentAvatarStack({
  types,
  size = "sm",
  max = 5,
  className,
}: {
  types: AgentType[];
  size?: keyof typeof SIZES;
  max?: number;
  className?: string;
}) {
  const shown = types.slice(0, max);
  return (
    <div className={cn("flex -space-x-2", className)}>
      {shown.map((t) => (
        <AgentAvatar key={t} type={t} size={size} className="ring-2 ring-background" />
      ))}
    </div>
  );
}
