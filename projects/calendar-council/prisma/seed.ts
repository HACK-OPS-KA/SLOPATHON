import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { AGENT_LIST } from "../src/lib/agents";
import { INTEGRATIONS_CATALOG, DEMO_USER, ALEX_DEMO_REQUEST } from "../src/lib/demo";

const prisma = new PrismaClient();

const DAY = 86_400_000;
const HOUR = 3_600_000;
const now = Date.now();
function at(offsetMs: number) {
  return new Date(now + offsetMs);
}

async function main() {
  // Fresh demo account every seed.
  await prisma.user.deleteMany({ where: { email: DEMO_USER.email } });

  const user = await prisma.user.create({
    data: {
      email: DEMO_USER.email,
      name: DEMO_USER.name,
      displayName: DEMO_USER.displayName,
      passwordHash: await bcrypt.hash(DEMO_USER.password, 10),
      timezone: DEMO_USER.timezone,
      onboardingCompleted: true,
      subscriptionPlan: "governed",
      isDemo: true,
      trustScore: 41,
      autonomyScore: 28,
      preferences: {
        create: {
          wakeTime: "07:10",
          sleepTime: "23:30",
          workStart: "09:00",
          workEnd: "18:30",
          maximumDailyMeetings: 3,
          travelTolerance: "requires_review",
          spendingLimit: 8,
          socialBatteryLimit: 2,
          riskToleranceJson: JSON.stringify({
            early_mornings: "strongly_discouraged",
            late_nights: "requires_review",
            long_travel: "tolerable",
            expensive_venues: "strongly_discouraged",
            consecutive_meetings: "requires_review",
            missing_workouts: "constitutionally_unacceptable",
            social_overload: "requires_review",
            spontaneous_plans: "requires_review",
            weather_uncertainty: "tolerable",
          }),
          comedyIntensity: "balanced",
          demoSpeed: "presentation",
          theme: "system",
          consensusThreshold: 60,
          chaosCanVote: true,
        },
      },
      priorities: {
        create: {
          sleepWeight: 18,
          careerWeight: 16,
          fitnessWeight: 12,
          relationshipsWeight: 12,
          socialWeight: 8,
          financeWeight: 9,
          healthWeight: 9,
          productivityWeight: 8,
          convenienceWeight: 4,
          spontaneityWeight: 4,
        },
      },
    },
  });

  // Agent configurations (all 12)
  for (const a of AGENT_LIST) {
    await prisma.agentConfiguration.create({
      data: {
        userId: user.id,
        agentType: a.type,
        influence: a.defaultInfluence,
        vetoEnabled: a.defaultVeto,
        aggression: a.defaultAggression,
        messageFrequency: 55,
        interrogationEnabled: true,
        canTriggerAppeals: a.type === "career" || a.type === "productivity",
        canViewFinancials: a.type !== "chaos",
        notificationsEnabled: true,
        tone: "default",
        enabled: true,
      },
    });
  }

  // Integrations (mocked)
  for (const i of INTEGRATIONS_CATALOG) {
    await prisma.integration.create({
      data: {
        userId: user.id,
        provider: i.provider,
        status: i.seedStatus,
        isMock: true,
        permissions: JSON.stringify(i.permissions),
        lastSyncedAt:
          i.seedStatus === "connected" || i.seedStatus === "excessive"
            ? at(-2 * HOUR)
            : i.seedStatus === "simulated"
              ? at(-1 * DAY)
              : null,
      },
    });
  }

  // ---- Historical negotiations ----
  interface Hist {
    title: string;
    request: Record<string, unknown>;
    daysAgo: number;
    status: string;
    finalDecision: string;
    consensus: number;
    messageCount: number;
    objectionCount: number;
    topObjector: string;
    userComplied: boolean;
    hadIncident?: boolean;
    deliberationMin: number;
    decision?: { result: string; recommendation: string; conditions: string[] };
    incident?: boolean;
  }

  const history: Hist[] = [
    {
      title: "Coffee with Tobias",
      request: { title: "Coffee with Tobias", attendees: "Tobias", dayLabel: "Tuesday", startTime: "10:00", durationMin: 45, city: "Karlsruhe", category: "coffee", estimatedCost: 6.4, lastSawAttendeeWeeks: 2 },
      daysAgo: 9,
      status: "decided",
      finalDecision: "provisional",
      consensus: 61,
      messageCount: 142,
      objectionCount: 7,
      topObjector: "Finance Agent",
      userComplied: true,
      deliberationMin: 38,
      decision: { result: "provisional", recommendation: "Maybe Tuesday.", conditions: ["Max spend €4.50", "Within 800 metres", "One documented outcome", "No pastry without Finance approval"] },
    },
    {
      title: "Gym",
      request: { title: "Gym", attendees: "Nobody", dayLabel: "Wednesday", startTime: "18:00", durationMin: 75, category: "gym", trainingDay: "leg day", estimatedCost: 0 },
      daysAgo: 7,
      status: "decided",
      finalDecision: "approved",
      consensus: 74,
      messageCount: 61,
      objectionCount: 2,
      topObjector: "Social Battery Agent",
      userComplied: true,
      deliberationMin: 14,
      decision: { result: "approved", recommendation: "Approved. Rare unanimity.", conditions: ["Protein within 2h", "Home by 20:30"] },
    },
    {
      title: "Call with Philipp",
      request: { title: "Call with Philipp", attendees: "Philipp", dayLabel: "Monday", startTime: "16:00", durationMin: 30, category: "call", estimatedCost: 0 },
      daysAgo: 6,
      status: "decided",
      finalDecision: "approved_conditions",
      consensus: 58,
      messageCount: 88,
      objectionCount: 4,
      topObjector: "Productivity Agent",
      userComplied: true,
      deliberationMin: 22,
      decision: { result: "approved_conditions", recommendation: "Approved as async-first.", conditions: ["Agenda circulated 24h prior", "Timeboxed to 25 minutes", "Notes documented"] },
    },
    {
      title: "Birthday party",
      request: { title: "Birthday party", attendees: "Marta + 20 others", dayLabel: "Saturday", startTime: "20:00", durationMin: 240, category: "social", estimatedCost: 45, otherEventsThatDay: 1 },
      daysAgo: 12,
      status: "constitutionally_blocked",
      finalDecision: "rejected",
      consensus: 22,
      messageCount: 213,
      objectionCount: 14,
      topObjector: "Career Agent",
      userComplied: false,
      deliberationMin: 71,
      decision: { result: "rejected", recommendation: "Rejected. Expected networking value unclear.", conditions: [] },
    },
    {
      title: "Grocery shopping",
      request: { title: "Grocery shopping", attendees: "Nobody", dayLabel: "Sunday", startTime: "11:00", durationMin: 40, category: "errand", estimatedCost: 32 },
      daysAgo: 5,
      status: "decided",
      finalDecision: "approved",
      consensus: 66,
      messageCount: 47,
      objectionCount: 3,
      topObjector: "Finance Agent",
      userComplied: true,
      deliberationMin: 12,
      decision: { result: "approved", recommendation: "Approved. Protein acquisition encouraged.", conditions: ["Buy protein", "No impulse purchases over €4"] },
    },
    {
      title: "Nap",
      request: { title: "Nap", attendees: "Nobody", dayLabel: "Saturday", startTime: "15:00", durationMin: 20, category: "recovery", estimatedCost: 0 },
      daysAgo: 4,
      status: "deadlock",
      finalDecision: "deadlocked",
      consensus: 50,
      messageCount: 96,
      objectionCount: 6,
      topObjector: "Productivity Agent",
      userComplied: false,
      deliberationMin: 44,
      decision: { result: "deadlocked", recommendation: "Deadlocked. Circadian Agent and Productivity Agent could not agree on the optimal nap window.", conditions: [] },
    },
    {
      title: "Dentist appointment",
      request: { title: "Dentist appointment", attendees: "Dr. Vogel", dayLabel: "Thursday", startTime: "08:30", durationMin: 45, category: "health", estimatedCost: 0 },
      daysAgo: 3,
      status: "decided",
      finalDecision: "approved",
      consensus: 91,
      messageCount: 34,
      objectionCount: 1,
      topObjector: "Sleep Agent",
      userComplied: true,
      deliberationMin: 9,
      decision: { result: "approved", recommendation: "Suspiciously unanimous. Health is non-negotiable.", conditions: ["Sleep 7h30m prior"] },
    },
    {
      title: "Unapproved kebab",
      request: { title: "Unapproved kebab", attendees: "Nobody", dayLabel: "Friday", startTime: "23:40", durationMin: 25, category: "food", estimatedCost: 7.5 },
      daysAgo: 2,
      status: "already_happened",
      finalDecision: "already_happened",
      consensus: 4,
      messageCount: 268,
      objectionCount: 22,
      topObjector: "Finance Agent",
      userComplied: false,
      hadIncident: true,
      deliberationMin: 0,
      incident: true,
    },
    {
      title: "\"Quick five-minute call\" that lasted 48 minutes",
      request: { title: "Quick five-minute call", attendees: "Jonas", dayLabel: "Tuesday", startTime: "17:00", durationMin: 5, category: "call", estimatedCost: 0 },
      daysAgo: 1,
      status: "monitoring",
      finalDecision: "approved_conditions",
      consensus: 55,
      messageCount: 51,
      objectionCount: 5,
      topObjector: "Productivity Agent",
      userComplied: false,
      deliberationMin: 5,
      decision: { result: "approved_conditions", recommendation: "Approved for 5 minutes. Ran 48. Non-compliance logged.", conditions: ["Hard stop at 5 minutes"] },
    },
  ];

  for (const h of history) {
    const neg = await prisma.negotiation.create({
      data: {
        userId: user.id,
        title: h.title,
        requestJson: JSON.stringify(h.request),
        requestedStart: at(-h.daysAgo * DAY),
        requestedEnd: at(-h.daysAgo * DAY + HOUR),
        category: String(h.request.category ?? ""),
        estimatedCost: Number(h.request.estimatedCost ?? 0),
        status: h.status,
        phase: 9,
        consensus: h.consensus,
        messageCount: h.messageCount,
        objectionCount: h.objectionCount,
        topObjector: h.topObjector,
        userComplied: h.userComplied,
        hadIncident: !!h.hadIncident,
        deliberationMs: h.deliberationMin * 60_000,
        finalDecision: h.finalDecision,
        dataJson: JSON.stringify({ replayable: true }),
        isSeed: true,
        createdAt: at(-h.daysAgo * DAY - HOUR),
      },
    });

    if (h.decision) {
      await prisma.decision.create({
        data: {
          negotiationId: neg.id,
          result: h.decision.result,
          rationale: h.decision.recommendation,
          conditions: JSON.stringify(h.decision.conditions),
          recommendation: h.decision.recommendation,
          issuedAt: at(-h.daysAgo * DAY),
        },
      });
    }

    if (h.incident) {
      await prisma.incident.create({
        data: {
          negotiationId: neg.id,
          userId: user.id,
          type: "Unauthorized Social Interaction",
          severity: "critical",
          triggerMessage: "Guys, I already went and got a kebab.",
          status: "already_happened",
          correctiveActions: JSON.stringify([
            "€5 discretionary spending threshold",
            "Enhanced location monitoring",
            "Probation period of 30 days",
          ]),
          trustScoreChange: -38,
          createdAt: at(-h.daysAgo * DAY),
        },
      });
    }
  }

  // ---- Active negotiations ----
  await prisma.negotiation.create({
    data: {
      userId: user.id,
      title: "Dinner with Alex",
      requestJson: JSON.stringify(ALEX_DEMO_REQUEST),
      requestedStart: at(1 * DAY + 19 * HOUR),
      requestedEnd: at(1 * DAY + 21 * HOUR),
      location: "A restaurant in Karlsruhe",
      attendees: "Alex",
      purpose: "See a friend",
      category: "dinner",
      estimatedCost: 28,
      status: "testimony_required",
      phase: 5,
      consensus: 19,
      messageCount: 74,
      objectionCount: 9,
      topObjector: "Gym Agent",
      hadIncident: false,
      deliberationMs: 41 * 60_000,
      dataJson: JSON.stringify({ demo: true }),
      isSeed: true,
      createdAt: at(-2 * HOUR),
    },
  });

  await prisma.negotiation.create({
    data: {
      userId: user.id,
      title: "Coffee with a recruiter",
      requestJson: JSON.stringify({ title: "Coffee with a recruiter", attendees: "A recruiter", dayLabel: "Thursday", startTime: "08:00", durationMin: 30, category: "networking", estimatedCost: 5.2, lastSawAttendeeWeeks: 99 }),
      requestedStart: at(2 * DAY + 8 * HOUR),
      requestedEnd: at(2 * DAY + 8.5 * HOUR),
      location: "Café near the station",
      attendees: "A recruiter",
      purpose: "Explore an opportunity",
      category: "networking",
      estimatedCost: 5.2,
      status: "formal_vote",
      phase: 8,
      consensus: 44,
      messageCount: 39,
      objectionCount: 4,
      topObjector: "Sleep Agent",
      deliberationMs: 19 * 60_000,
      dataJson: JSON.stringify({ replayable: true }),
      isSeed: true,
      createdAt: at(-30 * 60_000),
    },
  });

  // ---- Calendar events ----
  const events: Array<{
    title: string;
    startOffset: number;
    durationMin: number;
    location?: string;
    state: string;
    conditions: string[];
    compliance: string;
  }> = [
    { title: "Coffee with Tobias", startOffset: 1 * DAY + 14 * HOUR + 17 * 60_000, durationMin: 26, location: "Kaffee, Karlsruhe", state: "approved", conditions: ["Maximum spend €4.50", "Venue within 800 metres", "One documented outcome required", "No pastry without Finance Agent approval"], compliance: "pending" },
    { title: "Gym — Leg Day", startOffset: 2 * DAY + 18 * HOUR, durationMin: 75, location: "FitBox", state: "approved", conditions: ["Protein within 2h", "Home by 20:30"], compliance: "on_track" },
    { title: "Call with Philipp (async-first)", startOffset: 3 * DAY + 16 * HOUR, durationMin: 25, location: "Remote", state: "approved", conditions: ["Agenda circulated 24h prior", "Timeboxed to 25 minutes"], compliance: "pending" },
    { title: "Dentist appointment", startOffset: 4 * DAY + 8 * HOUR + 30 * 60_000, durationMin: 45, location: "Dr. Vogel", state: "approved", conditions: ["Sleep 7h30m prior"], compliance: "pending" },
    { title: "Dinner with Alex", startOffset: 1 * DAY + 19 * HOUR, durationMin: 120, location: "Restaurant, Karlsruhe", state: "pending", conditions: ["Under Council review"], compliance: "pending" },
    { title: "Birthday party", startOffset: 6 * DAY + 20 * HOUR, durationMin: 240, location: "Marta's", state: "rejected", conditions: ["Rejected: networking value unclear"], compliance: "blocked" },
    { title: "Unapproved kebab", startOffset: -2 * DAY + 23 * HOUR + 40 * 60_000, durationMin: 25, location: "Mangal Döner", state: "unauthorized", conditions: ["No pre-approval", "€7.50 unbudgeted"], compliance: "violation" },
    { title: "Mandated Recovery Period", startOffset: -1 * DAY + 21 * HOUR, durationMin: 120, location: "The ceiling", state: "recovery", conditions: ["Council-imposed", "Silence recommended"], compliance: "enforced" },
    { title: "Focus Block (do not schedule)", startOffset: 1 * DAY + 9 * HOUR, durationMin: 180, location: "Desk", state: "focus_block", conditions: ["Productivity Agent reserved this"], compliance: "enforced" },
    { title: "Corrective Action Review", startOffset: 5 * DAY + 10 * HOUR, durationMin: 30, location: "Chamber", state: "review", conditions: ["Weekly compliance review", "Attendance mandatory"], compliance: "scheduled" },
  ];

  for (const e of events) {
    await prisma.calendarEvent.create({
      data: {
        userId: user.id,
        title: e.title,
        start: at(e.startOffset),
        end: at(e.startOffset + e.durationMin * 60_000),
        location: e.location,
        state: e.state,
        conditions: JSON.stringify(e.conditions),
        complianceStatus: e.compliance,
      },
    });
  }

  // ---- Notifications ----
  const notifs: Array<{ title: string; kind: string; agent?: string; hoursAgo: number }> = [
    { title: "Sleep Agent objected to tomorrow morning.", kind: "objection", agent: "sleep", hoursAgo: 1 },
    { title: "The Council requires your testimony.", kind: "escalation", hoursAgo: 2 },
    { title: "Consensus decreased by 17%.", kind: "info", hoursAgo: 2 },
    { title: "Finance Agent discovered a €3.20 pastry.", kind: "objection", agent: "finance", hoursAgo: 3 },
    { title: "Your request has been referred to committee.", kind: "escalation", hoursAgo: 5 },
    { title: "Relationship Agent has escalated a neglected friendship.", kind: "escalation", agent: "relationship", hoursAgo: 26 },
    { title: "An unauthorized calendar event may have occurred.", kind: "incident", hoursAgo: 47 },
    { title: "Tuesday is now available.", kind: "info", hoursAgo: 49 },
  ];
  for (const n of notifs) {
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: n.title,
        kind: n.kind,
        agentType: n.agent,
        read: n.hoursAgo > 24,
        createdAt: at(-n.hoursAgo * HOUR),
      },
    });
  }

  console.log(`✔ Seeded demo account: ${DEMO_USER.email}`);
  console.log(`  ${history.length} historical negotiations · 2 active · ${events.length} calendar events`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
