import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type {
  ConsensusLabel,
  PhaseDef,
  PhaseKey,
  AgentPositionValue,
} from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Deterministic seeded PRNG (mulberry32) — reliable comedy across replays. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export class Rng {
  private next: () => number;
  constructor(seed: number | string) {
    const s = typeof seed === "string" ? hashString(seed) : seed;
    this.next = mulberry32(s);
  }
  float() {
    return this.next();
  }
  int(min: number, max: number) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
  pickN<T>(arr: readonly T[], n: number): T[] {
    const copy = [...arr];
    const out: T[] = [];
    while (out.length < n && copy.length) {
      out.push(copy.splice(Math.floor(this.next() * copy.length), 1)[0]);
    }
    return out;
  }
  chance(p: number) {
    return this.next() < p;
  }
  shuffle<T>(arr: readonly T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}

export function fillTemplate(
  tpl: string,
  vars: Record<string, string | number | undefined>,
): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => {
    const v = vars[k];
    return v === undefined || v === null ? "" : String(v);
  });
}

export function consensusLabel(value: number): ConsensusLabel {
  if (value < 12) return "Institutional collapse";
  if (value < 24) return "Severe disagreement";
  if (value < 38) return "Fragmented";
  if (value < 52) return "Weak alignment";
  if (value < 68) return "Conditional support";
  if (value < 90) return "Near consensus";
  return "Suspiciously unanimous";
}

export function consensusTone(value: number): "bad" | "warn" | "good" {
  if (value < 38) return "bad";
  if (value < 68) return "warn";
  return "good";
}

export const PHASES: Record<PhaseKey, PhaseDef> = {
  submitted: { key: "submitted", index: 1, title: "Request Submitted", short: "Submitted" },
  initial_analysis: { key: "initial_analysis", index: 1, title: "Initial Analysis", short: "Analysis" },
  initial_objections: { key: "initial_objections", index: 2, title: "Initial Objections", short: "Objections" },
  cross_debate: { key: "cross_debate", index: 4, title: "Foundational Disagreement", short: "Debate" },
  interrogation: { key: "interrogation", index: 5, title: "User Testimony", short: "Testimony" },
  alternatives: { key: "alternatives", index: 6, title: "Alternative Proposals", short: "Alternatives" },
  risk_assessment: { key: "risk_assessment", index: 7, title: "Risk Assessment", short: "Risk" },
  preliminary_vote: { key: "preliminary_vote", index: 8, title: "Preliminary Vote", short: "Prelim. Vote" },
  escalation: { key: "escalation", index: 4, title: "Objection Escalation", short: "Escalation" },
  final_vote: { key: "final_vote", index: 8, title: "Final Vote", short: "Final Vote" },
  decision: { key: "decision", index: 9, title: "Council Decision", short: "Decision" },
  appeal: { key: "appeal", index: 9, title: "Appeals Subcommittee", short: "Appeal" },
  monitoring: { key: "monitoring", index: 9, title: "Post-Decision Monitoring", short: "Monitoring" },
  incident: { key: "incident", index: 9, title: "Unauthorized Activity Incident", short: "Incident" },
};

export const PHASE_LABELS: Record<AgentPositionValue, string> = {
  strongly_approve: "Strongly approve",
  approve: "Approve",
  conditional: "Conditional",
  undecided: "Undecided",
  oppose: "Oppose",
  strongly_oppose: "Strongly oppose",
  veto: "Veto",
  luxembourg: "Voting for Luxembourg",
};

export function positionTone(p: AgentPositionValue): "good" | "warn" | "bad" | "neutral" {
  if (p === "strongly_approve" || p === "approve") return "good";
  if (p === "conditional") return "warn";
  if (p === "undecided" || p === "luxembourg") return "neutral";
  return "bad";
}

export function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

export function euro(n: number | undefined | null): string {
  if (n === undefined || n === null) return "€0.00";
  return "€" + n.toFixed(2);
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

const RELATIVE = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
export function relativeTime(from: number | Date, now = Date.now()): string {
  const t = from instanceof Date ? from.getTime() : from;
  const diff = t - now;
  const abs = Math.abs(diff);
  const min = 60_000,
    hour = 3_600_000,
    day = 86_400_000;
  if (abs < hour) return RELATIVE.format(Math.round(diff / min), "minute");
  if (abs < day) return RELATIVE.format(Math.round(diff / hour), "hour");
  return RELATIVE.format(Math.round(diff / day), "day");
}

export function formatClock(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
