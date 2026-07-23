"use client";

import * as React from "react";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/app/status-badge";
import { eventStateMeta, type Tone } from "@/lib/status";
import { cn } from "@/lib/utils";

export interface CalEvent {
  id: string;
  title: string;
  start: number;
  end: number;
  location: string | null;
  state: string;
  conditions: string[];
  complianceStatus: string;
}

const STATE_CLASSES: Record<Tone, string> = {
  good: "bg-approve/12 text-approve border-l-approve",
  veto: "bg-veto/12 text-veto border-l-veto",
  warn: "bg-conditional/12 text-conditional border-l-conditional",
  bad: "bg-oppose/12 text-oppose border-l-oppose",
  gold: "bg-gold/12 text-foreground border-l-gold",
  neutral: "bg-muted text-muted-foreground border-l-muted-foreground/40",
};

const LEGEND: { state: string }[] = [
  { state: "approved" },
  { state: "pending" },
  { state: "rejected" },
  { state: "unauthorized" },
  { state: "recovery" },
  { state: "focus_block" },
  { state: "review" },
];

export function CalendarView({ events }: { events: CalEvent[] }) {
  const [weekOffset, setWeekOffset] = React.useState(0);
  const [selected, setSelected] = React.useState<CalEvent | null>(null);

  const weekStart = React.useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 });
    return addDays(base, weekOffset * 7);
  }, [weekOffset]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => setWeekOffset((w) => w - 1)} aria-label="Previous week">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[10rem] text-center text-sm font-medium">
            {format(weekStart, "d MMM")} – {format(addDays(weekStart, 6), "d MMM yyyy")}
          </span>
          <Button variant="outline" size="icon-sm" onClick={() => setWeekOffset((w) => w + 1)} aria-label="Next week">
            <ChevronRight className="h-4 w-4" />
          </Button>
          {weekOffset !== 0 && (
            <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>Today</Button>
          )}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1.5">
          {LEGEND.map((l) => {
            const meta = eventStateMeta(l.state);
            return (
              <span key={l.state} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={cn("h-2.5 w-2.5 rounded-sm border-l-4", STATE_CLASSES[meta.tone])} />
                {meta.label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-7 sm:gap-0 sm:overflow-hidden sm:rounded-xl sm:border">
        {days.map((day, i) => {
          const dayEvents = events.filter((e) => isSameDay(new Date(e.start), day)).sort((a, b) => a.start - b.start);
          const isToday = isSameDay(day, today);
          return (
            <div key={i} className={cn("min-h-[8rem] border-b sm:border-b-0 sm:border-r sm:last:border-r-0", isToday && "bg-gold/[0.03]")}>
              <div className={cn("sticky top-0 border-b bg-card/60 px-2 py-2 text-center backdrop-blur", isToday && "bg-gold/10")}>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{format(day, "EEE")}</p>
                <p className={cn("font-display text-lg font-semibold", isToday && "text-gold")}>{format(day, "d")}</p>
              </div>
              <div className="space-y-1.5 p-1.5">
                {dayEvents.map((e) => {
                  const meta = eventStateMeta(e.state);
                  return (
                    <button
                      key={e.id}
                      onClick={() => setSelected(e)}
                      className={cn(
                        "w-full rounded-md border-l-4 px-2 py-1.5 text-left text-xs transition-transform hover:scale-[1.02]",
                        STATE_CLASSES[meta.tone],
                      )}
                    >
                      <p className="font-medium leading-tight text-foreground/90 line-clamp-2">{e.title}</p>
                      <p className="mt-0.5 opacity-80">{format(new Date(e.start), "HH:mm")}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-3 pr-6">
                  <DialogTitle>{selected.title}</DialogTitle>
                  <StatusBadge label={eventStateMeta(selected.state).label} tone={eventStateMeta(selected.state).tone} />
                </div>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-muted-foreground">
                  <span>{format(new Date(selected.start), "EEEE, d MMM · HH:mm")} – {format(new Date(selected.end), "HH:mm")}</span>
                  {selected.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {selected.location}</span>}
                </div>
                <div>
                  <p className="record-label mb-2">Council conditions</p>
                  <ul className="space-y-1.5">
                    {selected.conditions.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-foreground/80">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center justify-between border-t pt-3">
                  <span className="record-label">Compliance status</span>
                  <span className="font-mono text-xs capitalize text-muted-foreground">{selected.complianceStatus.replace(/_/g, " ")}</span>
                </div>
                <p className="text-xs text-muted-foreground">Modifying this event reopens its negotiation from the beginning.</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
