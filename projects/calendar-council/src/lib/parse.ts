import type { MeetingRequest } from "./types";

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const CATEGORY_KEYWORDS: { key: string; words: string[]; food?: boolean; duration: number }[] = [
  { key: "dinner", words: ["dinner", "supper"], food: true, duration: 120 },
  { key: "lunch", words: ["lunch"], food: true, duration: 60 },
  { key: "breakfast", words: ["breakfast", "brunch"], food: true, duration: 60 },
  { key: "coffee", words: ["coffee", "café", "cafe"], food: false, duration: 45 },
  { key: "drinks", words: ["drinks", "beer", "wine", "bar"], food: false, duration: 90 },
  { key: "call", words: ["call", "phone", "zoom", "sync"], food: false, duration: 30 },
  { key: "gym", words: ["gym", "workout", "training", "run"], food: false, duration: 75 },
  { key: "networking", words: ["networking", "recruiter", "interview"], food: false, duration: 45 },
  { key: "party", words: ["party", "birthday", "celebration"], food: true, duration: 180 },
  { key: "meeting", words: ["meeting", "catch up", "catchup"], food: false, duration: 45 },
];

function parseTime(text: string): string | undefined {
  // "at 19:00", "at 7pm", "at 7", "7:30pm"
  const m = text.match(/(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!m) return undefined;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const ap = m[3]?.toLowerCase();
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  if (h > 23 || min > 59) return undefined;
  // avoid matching bare small numbers that are clearly not times unless "at" present
  if (!m[0].toLowerCase().includes("at") && !ap && !m[2] && h < 6) return undefined;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export function parseRequest(text: string): Partial<MeetingRequest> {
  const out: Partial<MeetingRequest> = {};
  const lower = text.toLowerCase();

  // Category
  const cat = CATEGORY_KEYWORDS.find((c) => c.words.some((w) => lower.includes(w)));
  if (cat) {
    out.category = cat.key;
    out.durationMin = cat.duration;
    out.involvesFood = cat.food;
  }

  // Attendee(s): "with X" up to a stop word
  const withMatch = text.match(/with\s+([A-Za-zÀ-ÿ][\w'.-]*(?:\s+[A-Z][\w'.-]*)?)/);
  if (withMatch) {
    out.attendees = withMatch[1].trim().replace(/[.,]$/, "");
  }

  // Day
  const dayIdx = WEEKDAYS.findIndex((d) => lower.includes(d));
  if (lower.includes("tomorrow")) out.dayLabel = "Tomorrow";
  else if (lower.includes("today") || lower.includes("tonight")) out.dayLabel = "Today";
  else if (dayIdx >= 0) out.dayLabel = WEEKDAYS[dayIdx][0].toUpperCase() + WEEKDAYS[dayIdx].slice(1);

  // Time
  const time = parseTime(text);
  if (time) out.startTime = time;

  // Location / city: "in <Place>" or "at <venue> in <City>"
  const inMatch = text.match(/\bin\s+([A-ZÀ-Ý][\wÀ-ÿ'-]+)/);
  if (inMatch) out.city = inMatch[1];
  const atVenue = text.match(/at\s+(a\s+)?([a-zà-ÿ][\wà-ÿ ']*?)(?:\s+in\s+|$|,)/i);
  if (atVenue && !/^\d/.test(atVenue[2].trim())) {
    const v = atVenue[2].trim();
    if (v && !["a", "the"].includes(v.toLowerCase())) out.location = v;
  }

  // Cost
  const cost = text.match(/€\s?(\d+(?:[.,]\d{1,2})?)/);
  if (cost) out.estimatedCost = parseFloat(cost[1].replace(",", "."));

  // Title
  const titleCat = cat ? cat.key[0].toUpperCase() + cat.key.slice(1) : "Event";
  out.title = out.attendees ? `${titleCat} with ${out.attendees}` : text.trim().slice(0, 60) || "Untitled request";

  return out;
}
