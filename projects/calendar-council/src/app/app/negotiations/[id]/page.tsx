import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ALEX_DEMO_REQUEST } from "@/lib/demo";
import type { DemoSpeed, MeetingRequest } from "@/lib/types";
import { NegotiationRoom } from "@/components/negotiation/negotiation-room";

export const dynamic = "force-dynamic";

export default async function NegotiationPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { incident?: string };
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const neg = await prisma.negotiation.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!neg) notFound();

  const stored = JSON.parse(neg.requestJson || "{}") as Partial<MeetingRequest>;
  const data = JSON.parse(neg.dataJson || "{}") as { demo?: boolean };

  const request: MeetingRequest = data.demo
    ? ALEX_DEMO_REQUEST
    : { ...stored, title: stored.title || neg.title, attendees: stored.attendees || neg.attendees || "" };

  const committeeName = `${user.displayName || user.name}'s Personal Scheduling Committee`;
  const speed = (user.preferences?.demoSpeed as DemoSpeed) || "presentation";

  return (
    <NegotiationRoom
      request={request}
      committeeName={committeeName}
      userName={user.displayName || user.name}
      seed={neg.id}
      autoIncident={searchParams.incident === "1"}
      initialSpeed={speed}
    />
  );
}
