import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CalendarView } from "@/components/app/calendar-view";

export const dynamic = "force-dynamic";
export const metadata = { title: "Calendar" };

export default async function CalendarPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const events = await prisma.calendarEvent.findMany({
    where: { userId: user.id },
    orderBy: { start: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6">
        <p className="record-label">Calendar</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">Governed calendar</h1>
        <p className="mt-1.5 text-muted-foreground">
          Approved, rejected, pending and unauthorized events, with Council-imposed recovery and focus blocks.
        </p>
      </div>
      <CalendarView
        events={events.map((e) => ({
          id: e.id,
          title: e.title,
          start: e.start.getTime(),
          end: e.end.getTime(),
          location: e.location,
          state: e.state,
          conditions: JSON.parse(e.conditions || "[]"),
          complianceStatus: e.complianceStatus,
        }))}
      />
    </div>
  );
}
