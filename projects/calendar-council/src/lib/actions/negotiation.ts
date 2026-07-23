"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import type { MeetingRequest } from "@/lib/types";

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function resolveStart(req: MeetingRequest): Date {
  const base = new Date();
  base.setSeconds(0, 0);
  const [h, m] = (req.startTime || "12:00").split(":").map(Number);
  const target = new Date(base);
  target.setHours(h || 12, m || 0, 0, 0);

  const label = (req.dayLabel || "").toLowerCase();
  if (label === "tomorrow") {
    target.setDate(target.getDate() + 1);
  } else if (label === "today" || label === "tonight") {
    // keep today
  } else {
    const idx = WEEKDAYS.indexOf(label);
    if (idx >= 0) {
      let delta = (idx - target.getDay() + 7) % 7;
      if (delta === 0) delta = 7;
      target.setDate(target.getDate() + delta);
    } else if (target.getTime() < Date.now()) {
      target.setDate(target.getDate() + 1);
    }
  }
  return target;
}

export async function createNegotiation(request: MeetingRequest): Promise<void> {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const start = resolveStart(request);
  const end = new Date(start.getTime() + (request.durationMin ?? 60) * 60_000);

  const neg = await prisma.negotiation.create({
    data: {
      userId,
      title: request.title || "Untitled request",
      requestJson: JSON.stringify(request),
      requestedStart: start,
      requestedEnd: end,
      location: request.location || request.city || null,
      attendees: request.attendees || null,
      purpose: request.purpose || null,
      category: request.category || null,
      estimatedCost: request.estimatedCost ?? null,
      status: "initial_review",
      phase: 1,
      consensus: 41,
      dataJson: JSON.stringify({ live: true }),
      isSeed: false,
    },
  });

  redirect(`/app/negotiations/${neg.id}`);
}
