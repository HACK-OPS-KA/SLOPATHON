import { AGENTS, CHAOS_PLACES } from "@/lib/agents";
import type {
  AgentType,
  Beat,
  DecisionDoc,
  LiveMetric,
  MeetingRequest,
  MessageType,
  ProposedSlot,
  SenderType,
  VoteRecord,
} from "@/lib/types";
import { Rng, fillTemplate } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Time helpers
// ---------------------------------------------------------------------------
function toMin(t?: string | null): number | null {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h)) return null;
  return h * 60 + (m || 0);
}
function fromMin(x: number): string {
  const v = ((Math.round(x) % 1440) + 1440) % 1440;
  const h = Math.floor(v / 60);
  const m = v % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export interface DirectorOptions {
  userName?: string;
  committeeName?: string;
  seed?: number | string;
  comedy?: "dry" | "balanced" | "unhinged";
}

type Vars = Record<string, string | number | undefined>;

interface SayOpts {
  type?: MessageType;
  replyTo?: string;
  typingMs?: number;
  metadata?: Record<string, unknown>;
  voiceSeconds?: number;
}

// ---------------------------------------------------------------------------
// The Director builds ordered "beats" the runtime player animates.
// Deterministic given the same request + seed (reliable comedy across replays).
// ---------------------------------------------------------------------------
export class MockDirector {
  request: MeetingRequest;
  vars: Vars;
  rng: Rng;
  userName: string;
  committeeName: string;
  initialConsensus = 41;
  private refCounter = 0;
  private B: Beat[] = [];

  constructor(request: MeetingRequest, opts: DirectorOptions = {}) {
    this.request = request;
    this.userName = opts.userName ?? "Hirad";
    this.committeeName =
      opts.committeeName ?? `${this.userName}'s Personal Scheduling Committee`;
    this.rng = new Rng(
      opts.seed ?? (request.title || "council") + (request.date || ""),
    );
    this.vars = this.deriveVars();
  }

  private deriveVars(): Vars {
    const r = this.request;
    const startTime = r.startTime || "10:00";
    const duration = r.durationMin ?? 60;
    const startM = toMin(startTime) ?? 600;
    const endTime = fromMin(startM + duration);
    const attendee = (r.attendees || "Alex").split(/[,&]/)[0].trim() || "Alex";
    const cost = r.estimatedCost ?? 6.4;
    const travel = r.travelMinutes ?? 22;
    const altTime = fromMin(startM - 18);
    const departTime = fromMin(startM - travel - 42);
    const chaosPlace = this.rng.pick(CHAOS_PLACES);
    return {
      title: r.title || "this event",
      user: this.userName,
      attendee,
      weeks: r.lastSawAttendeeWeeks ?? 3,
      sleep: r.sleepLastNight ?? "6h 14m",
      startTime,
      endTime,
      bedtime: "23:30",
      cost: cost.toFixed(2),
      costPlus: (cost + 2.1).toFixed(2),
      ceiling: "4.50",
      city: r.city || "Karlsruhe",
      weather: r.weatherRisk ?? 14,
      travel,
      duration,
      dayLabel: r.dayLabel || "Friday",
      trainingDay: r.trainingDay || "leg day",
      altTime,
      departTime,
      otherEvents: r.otherEventsThatDay ?? 2,
      chaosPlace,
      ticket: this.rng.int(1000, 9999),
    };
  }

  // ---- fluent beat builder ----
  private ref() {
    this.refCounter += 1;
    return `r${this.refCounter}`;
  }
  private t(tpl: string): string {
    return fillTemplate(tpl, this.vars);
  }
  private reset() {
    this.B = [];
  }
  private typing(agents: AgentType[], ms = 900) {
    this.B.push({ t: "typing", agents, ms });
  }
  private say(agent: AgentType, body: string, opts: SayOpts = {}): string {
    const ref = this.ref();
    this.B.push({
      t: "msg",
      ref,
      sender: "agent" as SenderType,
      agent,
      body: this.t(body),
      type: opts.type ?? "text",
      replyTo: opts.replyTo,
      typingMs: opts.typingMs,
      metadata: opts.metadata,
      voiceSeconds: opts.voiceSeconds,
    });
    return ref;
  }
  private sys(
    body: string,
    type: MessageType = "system",
    metadata?: Record<string, unknown>,
  ): string {
    const ref = this.ref();
    this.B.push({
      t: "msg",
      ref,
      sender: "system" as SenderType,
      body: this.t(body),
      type,
      metadata,
    });
    return ref;
  }
  private react(ref: string, emoji: string, agents: AgentType[]) {
    this.B.push({ t: "react", ref, emoji, agents });
  }
  private edit(ref: string, body: string) {
    this.B.push({ t: "edit", ref, body: this.t(body) });
  }
  private consensus(to: number, note?: string) {
    this.B.push({ t: "consensus", to, note });
  }
  private phase(phaseKey: any, ofNine?: number, note?: string) {
    this.B.push({ t: "phase", phaseKey, ofNine, note });
  }
  private pause(ms: number) {
    this.B.push({ t: "pause", ms });
  }
  private opener(agent: AgentType): string {
    return this.t(this.rng.pick(AGENTS[agent].openers));
  }

  // -------------------------------------------------------------------------
  // CHAPTER 1 — Opening: analysis → objections → debate → first testimony
  // -------------------------------------------------------------------------
  opening(): Beat[] {
    this.reset();
    this.B.push({ t: "status", status: "initial_review" });
    this.phase("submitted", 1);
    this.consensus(this.initialConsensus);
    this.sys(`Convening ${this.committeeName}. 12 members present.`);
    this.pause(500);

    this.phase("initial_analysis", 1);
    this.typing(["career", "sleep"], 900);
    this.say("career", "{attendee}? Who is attending, precisely?");
    this.say("sleep", this.opener("sleep"), { typingMs: 1100 });
    this.typing(["finance"], 700);
    this.say("finance", "Which venue? Prices vary by up to €2.10.");

    // Initial objections
    this.phase("initial_objections", 2);
    this.consensus(34, "New objections filed.");
    this.typing(["gym", "weather"], 1000);
    const gymRef = this.say("gym", "Hold on. {dayLabel} is {trainingDay}.");
    this.say("weather", "There is a {weather}% chance of rain. I cannot be silent about this.");
    this.typing(["logistics"], 800);
    this.say("logistics", "The route requires a transfer. Transfers are where plans die.");
    this.typing(["social"], 700);
    this.say("social", "He already has {otherEvents} human interactions that day.");
    const relRef = this.say(
      "relationship",
      "Interesting. Another meeting. Except — this one is a friend he hasn't seen in {weeks} weeks.",
    );
    this.react(relRef, "❤️", ["chaos"]);

    // Cross-agent debate — the signature fight
    this.phase("cross_debate", 4);
    this.consensus(27);
    const careerApprove = this.say("career", "Fine. Tuesday at 10 works. Approved from my side.");
    this.typing(["sleep"], 900);
    this.say("sleep", "You approve everything before noon because you do not have a body.", {
      replyTo: careerApprove,
    });
    this.react(careerApprove, "💀", ["gym", "chaos"]);
    this.say("gym", "Also — Tuesday is pull day.");
    this.typing(["career"], 700);
    const jab = this.say("career", "Your pull day generated €0 in revenue last quarter.", {
      replyTo: gymRef,
    });
    this.say("gym", "Say that again.", { replyTo: jab });
    this.react(jab, "🔥", ["chaos", "productivity"]);
    this.say("relationship", "Can we acknowledge that he has not seen {attendee} in {weeks} weeks?");
    this.typing(["productivity"], 800);
    this.say("productivity", "Do we have data proving {attendee} is a high-value relationship?");
    const chaosRef = this.say("chaos", "I vote we meet {attendee} in {chaosPlace}.");
    this.react(chaosRef, "🎲", ["chaos"]);
    this.consensus(21, "Council consensus has decreased.");
    this.typing(["circadian"], 900);
    this.say(
      "circadian",
      "Setting aside the noise: {startTime} sits within a documented alertness nadir. I suggest {altTime}.",
    );
    this.say("nutrition", "Genuine question — will protein be available at the venue?");

    // First user interrogation
    this.phase("interrogation", 5);
    this.B.push({ t: "status", status: "testimony_required" });
    this.sys("The Council requires clarification.", "question", {
      question: this.t("Why do you need to see {attendee}?"),
    });
    this.B.push({
      t: "awaitUser",
      mode: "answer",
      question: this.t("Why do you need to see {attendee}?"),
      placeholder: "Submit your testimony to the Council…",
      quick: [
        "Because I want to see my friend.",
        "It's important to me.",
        "Guys, I already went to the meeting.",
      ],
    });
    return [...this.B];
  }

  // -------------------------------------------------------------------------
  // CHAPTER 2 — After testimony: dissection → alternatives → risk → votes → decision
  // -------------------------------------------------------------------------
  afterAnswer(_answer: string): Beat[] {
    this.reset();
    // Dissect the answer
    this.typing(["productivity", "finance"], 900);
    this.say("productivity", "Define 'want.'");
    this.say("finance", "Could friendship be maintained through a free phone call?");
    const rel = this.say("relationship", "Finally. Someone here has emotional intelligence.");
    this.react(rel, "❤️", ["chaos"]);
    this.say("career", "What does {attendee} do professionally? This is material.");
    const chaosQ = this.say("chaos", "Is {attendee} single?");
    this.react(chaosQ, "😈", ["chaos"]);

    // Alternatives
    this.phase("alternatives", 6);
    this.consensus(33);
    this.sys("The Council has drafted alternative slots for review.");
    this.B.push({ t: "slots", slots: this.buildSlots() });
    this.say("relationship", "You want to postpone the one social event. To Tuesday. Predictable.");
    const sleepTue = this.say("sleep", "Tuesday is, however, biologically responsible. I support Tuesday.");
    this.react(sleepTue, "👍", ["social", "circadian"]);

    // Risk assessment
    this.phase("risk_assessment", 7);
    this.B.push({ t: "metrics", metrics: this.buildMetrics() });
    this.sys("Risk model updated. Governance exposure recalculated.");
    this.say(
      "logistics",
      "I've uploaded a route document. Please review it. Nobody will review it.",
      { type: "route_doc" },
    );

    // Preliminary vote
    this.phase("preliminary_vote", 8);
    this.consensus(38);
    this.sys("Preliminary indicative vote opened.", "poll", {
      poll: {
        question: this.t('Provisionally allow: "{title}"?'),
        options: [
          { label: "Allow (Tuesday only)", votes: 5 },
          { label: "Oppose", votes: 4 },
          { label: "Abstain / Luxembourg", votes: 3 },
        ],
      },
    });

    // Escalation — the progress bar moves BACKWARDS
    this.phase("escalation", 4, "Council progress has been revised due to newly discovered concerns.");
    this.consensus(19, "A new objection has destabilised consensus.");
    this.typing(["weather"], 700);
    this.say("weather", "The forecast just updated. It is now {weather}% — marginally worse. I told you.");
    // Easter egg: Career edits an approval into opposition
    const flip = this.say("career", "On reflection, I approve.");
    this.pause(600);
    this.edit(flip, "On reflection, I strongly oppose. The ROI collapsed.");
    this.react(flip, "👀", ["relationship", "gym"]);
    this.say(
      "productivity",
      "Noting for the record: the Council has now deliberated longer than the event itself would take.",
      { type: "ticket", metadata: { ticket: `CC-${this.vars.ticket}` } },
    );

    // Final vote
    this.phase("final_vote", 8);
    this.B.push({ t: "status", status: "formal_vote" });
    this.sys("Formal vote is now open. Members will submit rationale with their ballot.", "vote_card", {
      votes: this.buildVotes(),
    });
    this.consensus(26);

    // Decision
    this.phase("decision", 9);
    this.B.push({ t: "status", status: "provisionally_approved" });
    this.B.push({ t: "decision", doc: this.buildDecision() });
    this.B.push({
      t: "awaitUser",
      mode: "decision",
      placeholder: "You may respond to the Council's decision below…",
    });
    return [...this.B];
  }

  // -------------------------------------------------------------------------
  // Decision responses
  // -------------------------------------------------------------------------
  onDecision(action: "accept" | "appeal" | "ignore" | "modify"): Beat[] {
    this.reset();
    if (action === "accept") {
      this.sys(
        "Decision accepted. Event provisionally added to your calendar under conditional supervision.",
      );
      this.say("productivity", "Excellent. I'll circulate a pre-read and a post-meeting outcome template.");
      const relJoy = this.say("relationship", "He's going to see a friend. I'm quietly thrilled.");
      this.react(relJoy, "❤️", ["chaos"]);
      this.B.push({ t: "status", status: "decided" });
      this.B.push({ t: "end" });
    } else if (action === "ignore") {
      this.B.push({ t: "status", status: "monitoring" });
      this.typing(["sleep", "productivity", "finance", "relationship"], 1100);
      this.say("sleep", "Unbelievable.");
      this.say("productivity", "Logging this.", { type: "ticket" });
      this.say("relationship", "Honestly? Proud of you.");
      this.say("finance", "€{cost}. Gone.");
      this.sys("The Council will remember this.");
      this.B.push({ t: "end" });
    } else if (action === "appeal") {
      this.phase("appeal", 9);
      this.B.push({ t: "status", status: "under_appeal" });
      this.sys("Appeal registered. Convening the Appeals Subcommittee.");
      this.consensus(24);
      this.say("career", "The Appeals Subcommittee is, regrettably, also me.");
      this.say("chaos", "I'm the Appeals Subcommittee too. I overrule myself.");
      this.say("productivity", "Having reviewed the appeal, we've made the recommendation marginally worse.");
      this.B.push({ t: "decision", doc: this.buildDecision(true) });
      this.B.push({ t: "awaitUser", mode: "decision" });
    } else {
      this.sys("Modification request received. This reopens the negotiation from the beginning.");
      this.say("logistics", "Wonderful. I'll re-model all six routes. From scratch.");
      this.B.push({ t: "status", status: "initial_review" });
      this.B.push({ t: "end" });
    }
    return [...this.B];
  }

  // -------------------------------------------------------------------------
  // Builders
  // -------------------------------------------------------------------------
  private buildSlots(): ProposedSlot[] {
    const v = this.vars;
    return [
      {
        id: "slot-tue",
        label: "Tuesday, 14:17 – 14:43",
        date: "Tuesday",
        start: "14:17",
        end: "14:43",
        durationMin: 26,
        consensus: 61,
        supporting: ["sleep", "social", "circadian", "finance", "logistics"],
        opposing: ["relationship", "chaos"],
        proposedBy: "circadian",
        reason: "Minimises conflict while technically allowing human contact.",
        metrics: { cost: 4.5, sleepImpact: "Negligible", travelBurden: "Low", proteinConfidence: "Medium", friendshipValue: "Clinical" },
      },
      {
        id: "slot-thu",
        label: "Thursday, 07:15 – 07:28",
        date: "Thursday",
        start: "07:15",
        end: "07:28",
        durationMin: 13,
        consensus: 38,
        supporting: ["career", "productivity"],
        opposing: ["sleep", "social", "relationship"],
        proposedBy: "career",
        reason: "Career Agent believes discomfort builds character.",
        metrics: { cost: 3.2, sleepImpact: "Severe", travelBurden: "Medium", proteinConfidence: "Low", friendshipValue: "Rushed" },
      },
      {
        id: "slot-alt",
        label: `${v.altTime} (${v.dayLabel})`,
        date: String(v.dayLabel),
        start: String(v.altTime),
        end: fromMin((toMin(String(v.altTime)) ?? 0) + 47),
        durationMin: 47,
        consensus: 44,
        supporting: ["circadian", "nutrition"],
        opposing: ["career", "weather"],
        proposedBy: "circadian",
        reason: "Physiologically coherent. Aligns with the endogenous energy curve.",
        metrics: { cost: Number(v.cost), sleepImpact: "Moderate", travelBurden: "Medium", proteinConfidence: "Medium", friendshipValue: "Adequate" },
      },
      {
        id: "slot-lux",
        label: `Sunday, 03:00 – 04:30 in ${v.chaosPlace}`,
        date: "Sunday",
        start: "03:00",
        end: "04:30",
        durationMin: 90,
        consensus: 8,
        supporting: ["chaos"],
        opposing: ["sleep", "finance", "logistics", "career", "social", "productivity"],
        proposedBy: "chaos",
        reason: `Proposed by Chaos Agent. Includes fireworks and a detour through ${v.chaosPlace}.`,
        metrics: { cost: 812, sleepImpact: "Catastrophic", travelBurden: "Transnational", proteinConfidence: "Unknown", friendshipValue: "Legendary" },
      },
    ];
  }

  private buildMetrics(): LiveMetric[] {
    const v = this.vars;
    return [
      { key: "sleep", label: "Sleep Damage Index", value: "7.4 / 10", tone: "bad", hint: `Based on ${v.sleep} last night` },
      { key: "career", label: "Career Opportunity Rating", value: "2.1 / 10", tone: "bad", hint: "No attributable revenue" },
      { key: "friendship", label: "Estimated Friendship ROI", value: "Intangible", tone: "warn" },
      { key: "burnout", label: "Emotional Burnout Probability", value: "31%", tone: "warn" },
      { key: "weather", label: "Weather Exposure Risk", value: `${v.weather}%`, tone: "warn" },
      { key: "protein", label: "Protein Availability", value: "Unconfirmed", tone: "warn" },
      { key: "necessity", label: "Meeting Necessity Score", value: "4.0 / 10", tone: "bad" },
      { key: "logistics", label: "Logistics Fragility", value: "High", tone: "bad", hint: "Transfer dependency detected" },
      { key: "circadian", label: "Circadian Alignment", value: "Poor", tone: "bad" },
      { key: "spontaneity", label: "Spontaneity Threat Level", value: "Elevated", tone: "warn" },
      { key: "honesty", label: "User Honesty Probability", value: "72%", tone: "neutral" },
      { key: "ignore", label: "Likelihood User Ignores Decision", value: "88%", tone: "bad" },
    ];
  }

  private buildVotes(): VoteRecord[] {
    const v = this.vars;
    return [
      { agent: "sleep", vote: "conditional", rationale: this.t("Conditional on 7h30m of sleep beforehand."), confidence: 71, condition: "≥ 7h30m sleep" },
      { agent: "career", vote: "oppose", rationale: this.t("The professional ROI remains unquantified."), confidence: 64 },
      { agent: "gym", vote: "oppose", rationale: this.t("It is {trainingDay}. It will always be {trainingDay}."), confidence: 80 },
      { agent: "relationship", vote: "strongly_approve", rationale: this.t("He has not seen {attendee} in {weeks} weeks. Let him go."), confidence: 92 },
      { agent: "social", vote: "conditional", rationale: "One-on-one only. Mandatory recovery day after.", confidence: 55, condition: "1:1 + recovery day" },
      { agent: "finance", vote: "conditional", rationale: this.t("Ceiling €{ceiling}. No pastry without approval."), confidence: 61, condition: `≤ €${v.ceiling}` },
      { agent: "weather", vote: "oppose", rationale: this.t("A {weather}% chance of rain is not nothing."), confidence: 48 },
      { agent: "circadian", vote: "conditional", rationale: this.t("Approve only at {altTime}, per the energy curve."), confidence: 58, condition: this.t("start {altTime}") },
      { agent: "logistics", vote: "conditional", rationale: "Approve with a mandatory 42-minute buffer.", confidence: 50, condition: "42-min buffer" },
      { agent: "nutrition", vote: "conditional", rationale: "Approve with a documented meal within two hours.", confidence: 52, condition: "meal ≤ 2h" },
      { agent: "productivity", vote: "oppose", rationale: "No agenda, no pre-read, no defined success metric.", confidence: 66 },
      { agent: "chaos", vote: "luxembourg", rationale: this.t("I vote {chaosPlace}. I also voted twice."), confidence: 100 },
    ];
  }

  buildDecision(worse = false): DecisionDoc {
    const v = this.vars;
    const conditions = [
      "User must sleep at least 7 hours and 30 minutes beforehand.",
      "Venue must be within 800 metres.",
      `Maximum spend is €${v.ceiling}.`,
      "Meeting must produce at least one actionable next step.",
      "Protein intake must not be compromised.",
      "User must submit a post-meeting outcome report.",
      "The Council reserves the right to revoke this approval.",
    ];
    if (worse) {
      conditions.push("A Council observer may attend.");
      conditions.push("Duration reduced to 31 minutes.");
    }
    return {
      id: "dec-" + this.rng.int(1000, 9999),
      result: "provisional",
      headline: "PROVISIONALLY APPROVED",
      recommendation: "Maybe Tuesday.",
      recommendedTime: worse ? "Tuesday, 18:40 – 19:11 (31 min)" : "Tuesday, 18:40 – 19:27 (47 min)",
      recommendedStart: "18:40",
      recommendedEnd: worse ? "19:11" : "19:27",
      conditions,
      rationale: this.t(
        `After ${worse ? "re-" : ""}reviewing the request "{title}", and weighing ${
          worse ? "the appeal alongside " : ""
        }the interests of sleep, career, fitness, finance, logistics, nutrition and emotional availability, the Council was unable to endorse the requested time. A physiologically defensible alternative has been identified.`,
      ),
      expiresNote: "This recommendation expires 4 minutes before it was issued.",
    };
  }
}

export function createDirector(request: MeetingRequest, opts?: DirectorOptions) {
  return new MockDirector(request, opts);
}
