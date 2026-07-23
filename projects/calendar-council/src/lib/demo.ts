import type { MeetingRequest } from "./types";

// The primary live demo. Feeding this preset into the mock engine reliably
// produces the expected dynamics (leg day, three-week gap, 6h14m, rain, etc.).
export const ALEX_DEMO_REQUEST: MeetingRequest = {
  title: "Dinner with Alex",
  attendees: "Alex",
  date: "2026-07-24",
  dayLabel: "Friday",
  startTime: "19:00",
  durationMin: 120,
  location: "A restaurant in Karlsruhe",
  city: "Karlsruhe",
  category: "dinner",
  estimatedCost: 28,
  travelMethod: "Public transport",
  travelMinutes: 22,
  purpose: "See a friend",
  importance: 4,
  flexibility: 2,
  involvesFood: true,
  involvesAlcohol: true,
  affectsWorkout: true,
  outdoor: false,
  alreadyCommitted: false,
  weatherRisk: 14,
  sleepLastNight: "6h 14m",
  earlyNextMorning: true,
  lastSawAttendeeWeeks: 3,
  otherEventsThatDay: 2,
  trainingDay: "leg day",
};

export const DEMO_USER = {
  email: "demo@calendarcouncil.app",
  password: "council",
  name: "Hirad",
  displayName: "Hirad",
  timezone: "Europe/Berlin",
};

export interface IntegrationCatalogItem {
  provider: string;
  name: string;
  icon: string;
  description: string;
  dataUse: string;
  permissions: string[];
  seedStatus: "connected" | "simulated" | "requires_review" | "excessive" | "disconnected";
}

export const INTEGRATIONS_CATALOG: IntegrationCatalogItem[] = [
  {
    provider: "google-calendar",
    name: "Google Calendar",
    icon: "calendar",
    description: "Two-way sync with your existing calendar.",
    dataUse: "Used to identify commitments you forgot to disclose.",
    permissions: ["Read events", "Write events", "Read attendee emails"],
    seedStatus: "connected",
  },
  {
    provider: "apple-calendar",
    name: "Apple Calendar",
    icon: "calendar",
    description: "Sync events from iCloud.",
    dataUse: "Cross-referenced against your stated availability.",
    permissions: ["Read events", "Write events"],
    seedStatus: "simulated",
  },
  {
    provider: "apple-health",
    name: "Apple Health",
    icon: "heart-pulse",
    description: "Sleep, activity and recovery signals.",
    dataUse: "Used to prove you are more tired than you claim.",
    permissions: ["Sleep analysis", "Heart rate", "Steps", "Mindful minutes"],
    seedStatus: "simulated",
  },
  {
    provider: "strava",
    name: "Strava",
    icon: "activity",
    description: "Training history and activity log.",
    dataUse: "Used by Gym Agent as evidence.",
    permissions: ["Read activities", "Read segments"],
    seedStatus: "connected",
  },
  {
    provider: "linkedin",
    name: "LinkedIn",
    icon: "linkedin",
    description: "Professional graph and attendee profiles.",
    dataUse: "Used to estimate meeting career value.",
    permissions: ["Read connections", "Read profiles", "Read follower counts"],
    seedStatus: "requires_review",
  },
  {
    provider: "banking",
    name: "Bank Account",
    icon: "landmark",
    description: "Transaction and balance access.",
    dataUse: "Used by Finance Agent to judge coffee decisions.",
    permissions: ["Read balances", "Read transactions", "Read pending charges", "Read tips"],
    seedStatus: "excessive",
  },
  {
    provider: "weather",
    name: "Weather",
    icon: "cloud-rain",
    description: "Hyperlocal forecast and radar.",
    dataUse: "Used to turn a 14% rain probability into a veto.",
    permissions: ["Location", "Forecast", "Radar refresh (unlimited)"],
    seedStatus: "connected",
  },
  {
    provider: "maps",
    name: "Maps",
    icon: "map",
    description: "Routing, transit and travel time.",
    dataUse: "Used by Logistics Agent to add unnecessary buffers.",
    permissions: ["Location", "Routing", "Live traffic"],
    seedStatus: "connected",
  },
  {
    provider: "nutrition",
    name: "Nutrition Tracker",
    icon: "apple",
    description: "Meals, macros and hydration.",
    dataUse: "Used to determine whether protein will be compromised.",
    permissions: ["Read meals", "Read macros"],
    seedStatus: "simulated",
  },
  {
    provider: "sleep-tracker",
    name: "Sleep Tracker",
    icon: "moon",
    description: "Nightly sleep duration and stages.",
    dataUse: "Used to corroborate the 6h 14m.",
    permissions: ["Read sleep stages", "Read bedtime"],
    seedStatus: "connected",
  },
  {
    provider: "whatsapp",
    name: "WhatsApp",
    icon: "message-circle",
    description: "Read receipts and reply latency.",
    dataUse: "Used by Relationship Agent to detect neglected contacts.",
    permissions: ["Read receipts", "Read reply times"],
    seedStatus: "disconnected",
  },
  {
    provider: "slack",
    name: "Slack",
    icon: "hash",
    description: "Working hours and status.",
    dataUse: "Used by Productivity Agent to insist this be async.",
    permissions: ["Read status", "Read presence"],
    seedStatus: "simulated",
  },
  {
    provider: "google-fit",
    name: "Google Fit",
    icon: "activity",
    description: "Steps and activity metrics.",
    dataUse: "Corroborates whether you actually walked anywhere.",
    permissions: ["Read activity"],
    seedStatus: "disconnected",
  },
  {
    provider: "transit",
    name: "Public Transportation",
    icon: "train",
    description: "Live departures and disruptions.",
    dataUse: "Used to model the tram being three minutes late.",
    permissions: ["Live departures", "Disruption alerts"],
    seedStatus: "requires_review",
  },
];

export const ANALYTICS_INSIGHTS: string[] = [
  "Career Agent has blocked 63% of events with no LinkedIn upside.",
  "Your average coffee requires 14.2 Council messages.",
  "You spent 4 hours this week deciding whether to spend 45 minutes with friends.",
  "Chaos Agent's recommendations have a 0% adoption rate and 100% engagement rate.",
  "Your personal autonomy decreased 12% this month.",
  "Tuesday remains the Council's preferred solution to all problems.",
];

export const GOVERNANCE_METRICS = {
  approvalRate: 34,
  avgDeliberationMin: 41,
  autonomyScore: 28,
  mostFrequentObjector: "Career Agent",
  moneyTheoreticallySaved: 214.4,
  socialEventsPrevented: 11,
  meetingsConvertedToAsync: 7,
  hoursNegotiating: 9.2,
  netProductivityImpact: -18,
  friendshipROI: "Intangible",
  councilTrustScore: 41,
  unauthorizedActionProbability: 88,
};
