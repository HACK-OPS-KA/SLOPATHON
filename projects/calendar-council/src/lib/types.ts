// Shared domain types for Calendar Council.

export type AgentType =
  | "sleep"
  | "career"
  | "gym"
  | "relationship"
  | "social"
  | "finance"
  | "weather"
  | "circadian"
  | "logistics"
  | "nutrition"
  | "productivity"
  | "chaos";

export const AGENT_TYPES: AgentType[] = [
  "sleep",
  "career",
  "gym",
  "relationship",
  "social",
  "finance",
  "weather",
  "circadian",
  "logistics",
  "nutrition",
  "productivity",
  "chaos",
];

export type SenderType = "agent" | "user" | "system";

export type MessageType =
  | "text"
  | "system"
  | "metric_card"
  | "poll"
  | "vote_card"
  | "incident_card"
  | "decision_doc"
  | "question"
  | "slot_card"
  | "voice_note"
  | "ticket"
  | "route_doc"
  | "survey"
  | "corrective_plan"
  | "crisis";

export type AgentPositionValue =
  | "strongly_approve"
  | "approve"
  | "conditional"
  | "undecided"
  | "oppose"
  | "strongly_oppose"
  | "veto"
  | "luxembourg";

export interface Reaction {
  emoji: string;
  agents: AgentType[];
}

export interface ChatMessage {
  id: string;
  sender: SenderType;
  agent?: AgentType;
  body: string;
  type: MessageType;
  replyToId?: string;
  replyToPreview?: string;
  replyToAgent?: AgentType | "user" | "system";
  reactions?: Reaction[];
  edited?: boolean;
  editedFrom?: string;
  deleted?: boolean;
  metadata?: Record<string, unknown>;
  createdAt: number;
  voiceSeconds?: number;
}

export interface MeetingRequest {
  title: string;
  attendees: string;
  date?: string; // ISO date "2026-07-24"
  dayLabel?: string; // "Friday"
  startTime?: string; // "19:00"
  durationMin?: number;
  location?: string;
  city?: string;
  category?: string; // coffee | dinner | networking | gym | call | ...
  estimatedCost?: number;
  travelMethod?: string;
  travelMinutes?: number;
  purpose?: string;
  importance?: number; // 1-5
  flexibility?: number; // 1-5
  involvesFood?: boolean;
  involvesAlcohol?: boolean;
  affectsWorkout?: boolean;
  outdoor?: boolean;
  alreadyCommitted?: boolean;
  justification?: string;
  // ambient context the Council "discovers"
  weatherRisk?: number; // 0-100 %
  sleepLastNight?: string; // "6h 14m"
  earlyNextMorning?: boolean;
  lastSawAttendeeWeeks?: number;
  otherEventsThatDay?: number;
  trainingDay?: string; // "leg day"
}

export interface AgentState {
  agent: AgentType;
  position: AgentPositionValue;
  confidence: number; // 0-100
  objections: string[];
  conditions: string[];
  vote?: AgentPositionValue;
  present: boolean;
}

export interface ProposedSlot {
  id: string;
  label: string;
  date: string;
  start: string;
  end: string;
  durationMin: number;
  consensus: number;
  supporting: AgentType[];
  opposing: AgentType[];
  proposedBy?: AgentType;
  reason: string;
  metrics: {
    cost?: number;
    sleepImpact?: string;
    travelBurden?: string;
    proteinConfidence?: string;
    friendshipValue?: string;
  };
}

export interface LiveMetric {
  key: string;
  label: string;
  value: string;
  tone?: "good" | "bad" | "neutral" | "warn";
  hint?: string;
}

export type ConsensusLabel =
  | "Institutional collapse"
  | "Severe disagreement"
  | "Fragmented"
  | "Weak alignment"
  | "Conditional support"
  | "Near consensus"
  | "Suspiciously unanimous";

export interface DecisionConditions {
  text: string;
}

export interface DecisionDoc {
  id: string;
  result:
    | "approved"
    | "provisional"
    | "approved_conditions"
    | "rejected"
    | "deadlocked"
    | "referred"
    | "requires_testimony"
    | "impossible"
    | "tuesday"
    | "already_happened";
  headline: string; // e.g. "PROVISIONALLY APPROVED"
  recommendation: string; // "Maybe Tuesday."
  recommendedTime?: string; // "Tuesday, 14:17 to 14:43"
  recommendedStart?: string;
  recommendedEnd?: string;
  conditions: string[];
  rationale: string;
  expiresNote?: string;
}

export interface VoteRecord {
  agent: AgentType;
  vote: AgentPositionValue;
  rationale: string;
  confidence: number;
  condition?: string;
}

export type PhaseKey =
  | "submitted"
  | "initial_analysis"
  | "initial_objections"
  | "cross_debate"
  | "interrogation"
  | "alternatives"
  | "risk_assessment"
  | "preliminary_vote"
  | "escalation"
  | "final_vote"
  | "decision"
  | "appeal"
  | "monitoring"
  | "incident";

export interface PhaseDef {
  key: PhaseKey;
  index: number; // 1-based canonical
  title: string;
  short: string;
}

export type DemoSpeed = "realistic" | "presentation" | "unhinged";
export type ComedyIntensity = "dry" | "balanced" | "unhinged";

export type NegotiationStatus =
  | "initial_review"
  | "escalated"
  | "testimony_required"
  | "formal_vote"
  | "under_appeal"
  | "provisionally_approved"
  | "constitutionally_blocked"
  | "already_happened"
  | "deadlock"
  | "decided"
  | "monitoring";

// ---- Engine beats: the atomic units the player animates ----

export type Beat =
  | { t: "typing"; agents: AgentType[]; ms: number }
  | {
      t: "msg";
      ref?: string;
      sender: SenderType;
      agent?: AgentType;
      body: string;
      type?: MessageType;
      replyTo?: string; // ref of a prior beat
      metadata?: Record<string, unknown>;
      voiceSeconds?: number;
      typingMs?: number; // override typing time before this message
    }
  | { t: "react"; ref: string; emoji: string; agents: AgentType[] }
  | { t: "edit"; ref: string; body: string }
  | { t: "consensus"; to: number; note?: string }
  | { t: "phase"; phaseKey: PhaseKey; ofNine?: number; note?: string }
  | { t: "metrics"; metrics: LiveMetric[] }
  | { t: "slots"; slots: ProposedSlot[] }
  | { t: "positions"; states: Partial<AgentState>[] }
  | { t: "status"; status: NegotiationStatus }
  | { t: "removeAgent"; agent: AgentType; note?: string }
  | { t: "rejoinAgent"; agent: AgentType; note?: string }
  | { t: "pause"; ms: number }
  | {
      t: "awaitUser";
      question?: string;
      placeholder?: string;
      quick?: string[];
      mode: "answer" | "free" | "decision" | "corrective" | "crisis";
    }
  | { t: "decision"; doc: DecisionDoc }
  | { t: "crisis" }
  | { t: "end" };

export interface RequestOptions {
  comedy?: ComedyIntensity;
  seed?: number;
  isDemo?: boolean;
}
