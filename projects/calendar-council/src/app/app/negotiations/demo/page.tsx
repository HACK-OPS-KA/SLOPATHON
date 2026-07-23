import { getCurrentUser } from "@/lib/auth";
import { ALEX_DEMO_REQUEST } from "@/lib/demo";
import type { DemoSpeed } from "@/lib/types";
import { NegotiationRoom } from "@/components/negotiation/negotiation-room";

export const dynamic = "force-dynamic";
export const metadata = { title: "Live Demo · Dinner with Alex" };

export default async function DemoNegotiationPage({
  searchParams,
}: {
  searchParams: { incident?: string };
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const committeeName = `${user.displayName || user.name}'s Personal Scheduling Committee`;
  const speed = (user.preferences?.demoSpeed as DemoSpeed) || "presentation";

  return (
    <NegotiationRoom
      request={ALEX_DEMO_REQUEST}
      committeeName={committeeName}
      userName={user.displayName || user.name}
      seed="alex-demo"
      autoIncident={searchParams.incident === "1"}
      initialSpeed={speed}
    />
  );
}
