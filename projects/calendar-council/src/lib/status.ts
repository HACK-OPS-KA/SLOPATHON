export type Tone = "neutral" | "good" | "warn" | "bad" | "veto" | "gold";

export interface StatusMeta {
  label: string;
  tone: Tone;
}

export const STATUS_META: Record<string, StatusMeta> = {
  initial_review: { label: "Initial review", tone: "neutral" },
  escalated: { label: "Escalated", tone: "warn" },
  testimony_required: { label: "User testimony required", tone: "warn" },
  formal_vote: { label: "Formal vote", tone: "warn" },
  under_appeal: { label: "Under appeal", tone: "warn" },
  provisionally_approved: { label: "Provisionally approved", tone: "good" },
  constitutionally_blocked: { label: "Constitutionally blocked", tone: "veto" },
  already_happened: { label: "Already happened", tone: "veto" },
  deadlock: { label: "Council deadlock", tone: "bad" },
  decided: { label: "Decided", tone: "good" },
  monitoring: { label: "Post-decision monitoring", tone: "neutral" },
};

export function statusMeta(status: string): StatusMeta {
  return STATUS_META[status] ?? { label: status.replace(/_/g, " "), tone: "neutral" };
}

export const DECISION_META: Record<string, StatusMeta> = {
  approved: { label: "Approved", tone: "good" },
  provisional: { label: "Provisionally approved", tone: "good" },
  approved_conditions: { label: "Approved with conditions", tone: "good" },
  rejected: { label: "Rejected", tone: "veto" },
  deadlocked: { label: "Deadlocked", tone: "bad" },
  referred: { label: "Referred to committee", tone: "warn" },
  requires_testimony: { label: "Requires testimony", tone: "warn" },
  impossible: { label: "Constitutionally impossible", tone: "veto" },
  tuesday: { label: "Recommended for Tuesday", tone: "gold" },
  already_happened: { label: "Already happened", tone: "veto" },
};

export function decisionMeta(result: string | null | undefined): StatusMeta {
  if (!result) return { label: "Pending", tone: "neutral" };
  return DECISION_META[result] ?? { label: result.replace(/_/g, " "), tone: "neutral" };
}

export const EVENT_STATE_META: Record<string, StatusMeta> = {
  approved: { label: "Approved", tone: "good" },
  rejected: { label: "Rejected", tone: "veto" },
  pending: { label: "Pending review", tone: "warn" },
  unauthorized: { label: "Unauthorized", tone: "veto" },
  recovery: { label: "Mandated recovery", tone: "neutral" },
  focus_block: { label: "Focus block", tone: "gold" },
  review: { label: "Compliance review", tone: "warn" },
};

export function eventStateMeta(state: string): StatusMeta {
  return EVENT_STATE_META[state] ?? { label: state.replace(/_/g, " "), tone: "neutral" };
}

// Badge variant mapping helper
export function toneToBadge(tone: Tone): "approve" | "oppose" | "veto" | "conditional" | "gold" | "muted" {
  switch (tone) {
    case "good":
      return "approve";
    case "bad":
      return "oppose";
    case "veto":
      return "veto";
    case "warn":
      return "conditional";
    case "gold":
      return "gold";
    default:
      return "muted";
  }
}
