import type { AgentType, Beat, MessageType, SenderType } from "@/lib/types";
import { fillTemplate, Rng } from "@/lib/utils";

type Vars = Record<string, string | number | undefined>;

// Compact beat builder for the incident set-piece (curated for reliability).
class Bag {
  B: Beat[] = [];
  private n = 0;
  constructor(
    private vars: Vars,
    private rng: Rng,
  ) {}
  private ref() {
    this.n += 1;
    return `i${this.n}`;
  }
  private t(s: string) {
    return fillTemplate(s, this.vars);
  }
  typing(agents: AgentType[], ms = 1200) {
    this.B.push({ t: "typing", agents, ms });
    return this;
  }
  say(agent: AgentType, body: string, typingMs?: number) {
    this.B.push({
      t: "msg",
      ref: this.ref(),
      sender: "agent" as SenderType,
      agent,
      body: this.t(body),
      type: "text",
      typingMs,
    });
    return this;
  }
  user(body: string) {
    this.B.push({
      t: "msg",
      ref: this.ref(),
      sender: "user" as SenderType,
      body: this.t(body),
      type: "text",
    });
    return this;
  }
  sys(body: string, type: MessageType = "system", metadata?: Record<string, unknown>) {
    this.B.push({
      t: "msg",
      ref: this.ref(),
      sender: "system" as SenderType,
      body: this.t(body),
      type,
      metadata,
    });
    return this;
  }
  consensus(to: number, note?: string) {
    this.B.push({ t: "consensus", to, note });
    return this;
  }
  phase(phaseKey: any, ofNine?: number, note?: string) {
    this.B.push({ t: "phase", phaseKey, ofNine, note });
    return this;
  }
  pause(ms: number) {
    this.B.push({ t: "pause", ms });
    return this;
  }
  status(status: any) {
    this.B.push({ t: "status", status });
    return this;
  }
  remove(agent: AgentType, note?: string) {
    this.B.push({ t: "removeAgent", agent, note });
    return this;
  }
  rejoin(agent: AgentType, note?: string) {
    this.B.push({ t: "rejoinAgent", agent, note });
    return this;
  }
  await_(mode: any, question?: string, quick?: string[], placeholder?: string) {
    this.B.push({ t: "awaitUser", mode, question: question && this.t(question), quick, placeholder });
    return this;
  }
  crisis() {
    this.B.push({ t: "crisis" });
    return this;
  }
  end() {
    this.B.push({ t: "end" });
    return this;
  }
  out() {
    return [...this.B];
  }
}

export const INCIDENT_TRIGGERS = [
  "i already went",
  "already went",
  "i already did it",
  "already did it",
  "meeting already happened",
  "already happened",
  "went without asking",
  "too late",
  "i'm already there",
  "im already there",
  "i already met",
  "already met them",
  "we finished",
  "finished an hour ago",
  "just got back",
  "i went anyway",
  "went anyway",
];

export function isIncidentTrigger(text: string): boolean {
  const s = text.toLowerCase();
  return INCIDENT_TRIGGERS.some((p) => s.includes(p));
}

// ---------------------------------------------------------------------------
// CHAPTER — Catastrophic escalation. Triggered from any active negotiation.
// ---------------------------------------------------------------------------
export function incidentOpening(vars: Vars, rng: Rng): Beat[] {
  const b = new Bag(vars, rng);
  // Deliberate silence — do NOT respond immediately.
  b.pause(1400);
  b.typing(["sleep", "finance", "career", "productivity", "gym", "logistics", "weather", "circadian"], 2000);
  b.status("already_happened");
  b.phase("incident", 9);
  b.sys(
    "⚠️ UNAUTHORIZED CALENDAR ACTIVITY DETECTED\nThe user appears to have participated in an unapproved real-world event. Council protocol has been escalated.",
    "system",
    { alarm: true },
  );
  b.pause(600);
  b.sys("Sleep Agent, Finance Agent, Career Agent, Productivity Agent and 4 others are typing…");
  b.consensus(9, "Consensus is no longer meaningful.");

  // Initial meltdown — rapid flood
  b.say("sleep", "Excuse me?", 500);
  b.say("finance", "You spent money BEFORE budget approval?", 500);
  b.say("productivity", "I'm sorry. WHAT?", 400);
  b.say("career", "Who authorized this?", 450);
  b.user("I did.");
  b.say("career", "That is not how governance works.", 500);
  b.say("relationship", "LET HIM LIVE.", 450);
  b.say("productivity", "We were on phase 4 of 9.", 500);
  b.say("gym", "I MOVED LEG DAY FOR THIS.", 450);
  b.say("logistics", "I calculated 47 routes.", 450);
  b.say("weather", "I HAVE BEEN REFRESHING THE RADAR FOR TWO HOURS.", 450);
  b.say("circadian", "This completely invalidates my model.", 500);
  b.say("nutrition", "Did you at least eat protein?", 500);
  b.say("chaos", "HAHAHAHAHAHAHAHA", 400);
  b.say("finance", "Answer the question. How much did you spend?", 500);
  b.say("sleep", "What time did you get home?", 450);
  b.say("career", "Who was there?", 450);
  b.say("productivity", "Were there actionable outcomes?", 450);
  b.say("relationship", "Guys, he saw a friend. Calm down.", 500);
  b.say("productivity", "WITHOUT A DEFINED AGENDA.", 450);

  // Agents blame each other
  b.say("career", "Logistics was supposed to monitor movement.", 600);
  b.say("logistics", "I model transportation. I am not law enforcement.", 600);
  b.say("sleep", "Why was I not notified when he left the house?", 550);
  b.say("chaos", "I knew.", 400);
  b.sys("Chaos Agent has been temporarily removed from the Council.");
  b.remove("chaos");
  b.pause(700);
  b.sys("Chaos Agent has rejoined using another account.");
  b.rejoin("chaos");
  b.say("chaos", "You can't silence me.", 400);

  // Incident review card
  b.sys("Incident review has been filed.", "incident_card", {
    incident: "Unauthorized Social Interaction",
    severity: "Critical",
    status: "Already Happened",
    preventability: "100%",
    councilAwareness: "0%",
    userRemorse: "Unclear",
    governanceDamage: "Severe",
    trustScoreChange: -38,
  });

  // Emergency retrospective — abandon the original matter
  b.sys("A formal post-mortem has been opened. The original scheduling matter is hereby abandoned.");
  b.say("finance", "When did you decide to circumvent the Council?", 700);
  b.say("sleep", "What time did you return?", 600);
  b.say("nutrition", "Was protein consumed? This is not rhetorical.", 600);
  b.say("productivity", "Were there, at any point, actionable outcomes?", 600);
  b.say("career", "One final question, for the record.", 600);
  b.await_(
    "answer",
    "Would you do it again?",
    ["Yes, I would do it again.", "No, never again.", "I regret nothing."],
    "The post-mortem awaits your testimony…",
  );
  return b.out();
}

export function incidentAfterAnswer(answer: string, vars: Vars, rng: Rng): Beat[] {
  const b = new Bag(vars, rng);
  const lower = answer.toLowerCase();
  const contrite =
    /(never again|^no\b|no,|\bnever\b|so sorry|i'?m sorry|won'?t happen again|my bad|i apolog)/.test(
      lower,
    ) && !/regret nothing/.test(lower);

  if (contrite) {
    b.sys("User remorse detected. The Council is cautiously, suspiciously moved.");
    b.say("relationship", "See? He feels it. That's growth.", 600);
    b.say("productivity", "Growth is not a deliverable. But noted.", 550);
    b.say("sleep", "I remain unconvinced, but I am listening.", 550);
  } else {
    b.sys("⚠️ Repeat offender risk increased to 94%.", "system", { alarm: true });
    b.say("finance", "We need spending controls.", 500);
    b.say("logistics", "Geofencing.", 450);
    b.say("sleep", "Earlier bedtime enforcement.", 500);
    b.say("relationship", "Or — hear me out — we let him make decisions.", 600);
    b.say("productivity", "Rejected.", 400);
  }

  // Corrective action plan
  b.sys("A Corrective Action Plan has been issued.", "corrective_plan", {
    contrite,
    actions: [
      "Mandatory 48-hour pre-approval for social activity",
      "Reduced spontaneous decision privileges",
      "Enhanced location monitoring",
      "€5 discretionary spending threshold",
      "Weekly calendar compliance reviews",
      "Mandatory post-meeting outcome documentation",
      "Probation period of 30 days",
    ],
  });
  b.status("monitoring");
  b.await_("corrective", undefined, [
    "Accept Corrective Action Plan",
    "Appeal",
    "Do Whatever I Want Again",
  ]);
  return b.out();
}

export function correctiveResponse(
  action: "accept" | "appeal" | "rebel",
  vars: Vars,
  rng: Rng,
): Beat[] {
  const b = new Bag(vars, rng);
  if (action === "accept") {
    b.sys("Corrective Action Plan accepted. A 30-day probation period is now in effect.");
    b.say("sleep", "Good. Bedtime enforcement begins tonight.", 600);
    b.say("productivity", "I'll schedule the weekly compliance reviews.", 550);
    b.say("relationship", "For what it's worth, I'd have let you go.", 600);
    b.status("monitoring");
    b.end();
  } else if (action === "appeal") {
    b.sys("Appeal received. The Council has reviewed it amongst itself and, unanimously, denied it.");
    b.say("career", "Appeals are heard by the same people who issued the decision. That's efficiency.", 700);
    b.say("chaos", "Rigged. I love it.", 450);
    b.await_("corrective", undefined, [
      "Accept Corrective Action Plan",
      "Appeal",
      "Do Whatever I Want Again",
    ]);
  } else {
    // SECOND REBELLION → constitutional crisis
    b.sys("User has explicitly rejected Calendar Governance.", "system", { alarm: true });
    b.say("career", "This is a hostile takeover.", 600);
    b.say("productivity", "Escalating to the Board.", 550);
    b.say("relationship", "HE IS THE BOARD.", 500);
    b.pause(1600);
    b.sys("The Council is currently reconsidering its constitutional legitimacy.");
    b.say("chaos", "Finally.", 500);
    b.consensus(0, "There is no Council to reach consensus.");
    b.sys("GOVERNANCE STATUS", "crisis", {
      status: "Constitutional crisis in progress.",
      detail: "User autonomy temporarily restored due to administrative confusion.",
      button: "Return to Calendar Before They Recover",
    });
    b.crisis();
    b.end();
  }
  return b.out();
}
