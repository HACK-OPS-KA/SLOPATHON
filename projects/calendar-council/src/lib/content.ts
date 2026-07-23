import type { AgentType } from "./types";

export const TAGLINE = "Your calendar shouldn't be your decision.";
export const SUBTAGLINE = "12 AI agents. One calendar. Zero personal autonomy.";

export const BRAND_LANGUAGE: string[] = [
  "Democracy was a mistake. We brought it to your calendar.",
  "Every meeting deserves due process.",
  "Stop making reckless scheduling decisions alone.",
  "Your time is too important to be managed by you.",
  "Personal scheduling, now with institutional oversight.",
  "Experience the future of consent-based time allocation.",
  "Replace impulsive calendar decisions with structured bureaucracy.",
  "Multi-agent governance for your personal life.",
];

export const CORPORATE_CATEGORIES: string[] = [
  "Personal Time Governance",
  "Multi-Agent Scheduling Infrastructure",
  "Temporal Risk Management",
  "Consensus-Based Calendar Orchestration",
  "Holistic Life Capacity Management",
  "Autonomous Availability Governance",
  "Human Calendar Compliance",
  "Social Commitment Risk Infrastructure",
];

export const FAKE_METRICS: { value: string; label: string }[] = [
  { value: "94%", label: "more scheduling deliberation" },
  { value: "8.7×", label: "longer decision cycles" },
  { value: "73%", label: "fewer spontaneous experiences" },
  { value: "12", label: "agents per calendar event" },
  { value: "47 min", label: "of negative time saved" },
  { value: "96%", label: "reduction in personal autonomy" },
  { value: "4.8", label: "average objections per coffee" },
  { value: "31%", label: "of requests escalated to committee" },
];

export const HERO_CHAT: { agent?: AgentType; system?: boolean; body: string }[] = [
  { agent: "sleep", body: "Absolutely not. He slept 6 hours and 14 minutes." },
  { agent: "career", body: "Who is attending?" },
  { agent: "gym", body: "Thursday is push day." },
  { agent: "relationship", body: "He has not seen Alex in three weeks." },
  { agent: "chaos", body: "Have we considered Luxembourg?" },
  { system: true, body: "Council consensus has decreased from 41% to 23%." },
];

export const HOW_IT_WORKS: { step: string; title: string; body: string }[] = [
  { step: "01", title: "Submit your request", body: "Tell the Council where you think you want to go." },
  { step: "02", title: "Face institutional scrutiny", body: "Your request is reviewed by 12 competing life stakeholders." },
  { step: "03", title: "Defend your intentions", body: "Answer questions about cost, purpose, emotional necessity, transportation, protein availability, and professional value." },
  { step: "04", title: "Receive a binding recommendation", body: "The Council eventually suggests Tuesday." },
];

export const FEATURES: { title: string; body: string; icon: string }[] = [
  { title: "Multi-agent deliberation", body: "Twelve specialised agents debate, quote, react to, and betray one another until a recommendation emerges — usually Tuesday.", icon: "messages" },
  { title: "Holistic calendar risk analysis", body: "Every request is scored across sleep, career, protein, weather, logistics, finance and emotional exposure.", icon: "radar" },
  { title: "Dynamic consensus tracking", body: "Watch alignment rise and — more often — collapse in real time as new objections are discovered.", icon: "trending" },
  { title: "User justification workflows", body: "Structured testimony captures why you believe you need to see a friend. Your answers are immediately dissected.", icon: "gavel" },
  { title: "Conditional approvals", body: "Nothing is ever simply approved. It is approved subject to sleep, spend ceilings, protein and post-meeting reporting.", icon: "list-checks" },
  { title: "Calendar compliance analytics", body: "Quantify your governance exposure, your autonomy trend, and how much time you spend deciding whether to have time.", icon: "chart" },
  { title: "Personal autonomy reduction", body: "Our flagship outcome. Measurable, reproducible, and trending in the right direction.", icon: "shield" },
  { title: "Emergency unauthorized activity detection", body: "If you attend an event without approval, the Council convenes an incident review within milliseconds.", icon: "siren" },
];

export const TESTIMONIALS: { quote: string; name: string; role: string }[] = [
  { quote: "I tried to schedule lunch. The Council asked whether friendship aligned with my five-year plan.", name: "Marta Lindqvist", role: "Product Lead" },
  { quote: "Calendar Council reduced my spontaneous decisions by 83%. I have never felt less alive.", name: "Devon Cole", role: "Founder, in stealth" },
  { quote: "My old calendar let me click 'Save.' That was dangerous.", name: "Priya Raman", role: "Operations" },
  { quote: "The Council rejected my birthday because the expected networking value was unclear.", name: "Tobias Herz", role: "Analyst" },
  { quote: "We adopted it org-wide. Nobody has scheduled anything since. Productivity is theoretically infinite.", name: "Susan Albrecht", role: "VP People" },
  { quote: "The Weather Agent turned a 12% chance of rain into a company holiday.", name: "Jon Okafor", role: "Engineering" },
];

export const ENTERPRISE_LOGOS: string[] = [
  "NORTHWIND",
  "Meridian",
  "HELIOSTAT",
  "Quadrant",
  "Umbra Labs",
  "Vantage",
  "COALESCE",
  "Peregrine",
];

export const FOOTER_LINKS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "How it works", href: "/how-it-works" },
      { label: "Pricing", href: "/pricing" },
      { label: "Status", href: "/about" },
    ],
  },
  {
    heading: "Governance",
    links: [
      { label: "Trust Center", href: "/about" },
      { label: "Temporal Governance Policy", href: "/about" },
      { label: "Council Constitution", href: "/about" },
      { label: "Unauthorized Activity Protocol", href: "/about" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/about" },
      { label: "Privacy", href: "/about" },
      { label: "Terms", href: "/about" },
    ],
  },
];
