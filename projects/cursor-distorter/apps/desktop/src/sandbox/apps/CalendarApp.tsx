import { useState } from "react";
import { cn } from "@cursor-distorter/ui";
import { SbDraggable } from "../controls";
import { useDropZone } from "../../cursor/registry";

const SLOTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00"];

function Slot({ time, booked }: { time: string; booked: boolean }) {
  const ref = useDropZone(`slot-${time}`);
  return (
    <div className="flex items-center gap-2">
      <div className="w-11 text-right text-[10px] text-ink-500">{time}</div>
      <div
        ref={ref}
        className={cn(
          "h-8 flex-1 rounded-md border border-dashed transition-colors",
          booked ? "border-brand-400/50 bg-brand-500/20" : "border-white/10 bg-white/[0.02]",
        )}
      >
        {booked && (
          <div className="flex h-full items-center px-2 text-[11px] font-medium text-brand-200">
            Sync: Pointer Roadmap
          </div>
        )}
      </div>
    </div>
  );
}

/** Drag a meeting onto a time slot. It occasionally detaches just before landing. */
export function CalendarApp() {
  const [booked, setBooked] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const onDrop = (zoneId: string | null) => {
    if (zoneId?.startsWith("slot-")) {
      setBooked(zoneId.replace("slot-", ""));
      setNote(null);
    } else {
      setNote("The meeting slipped. It happens.");
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[11px] text-ink-500">Tuesday · Drag the meeting to a slot</div>
        <SbDraggable
          id="cal-meeting"
          importance={0.6}
          priorityTag="calendar"
          onDrop={onDrop}
          onDragStart={() => setNote(null)}
          className="rounded-md border border-brand-400/40 bg-brand-500/25 px-2.5 py-1 text-[11px] font-medium text-brand-100"
        >
          ◱ Sync: Pointer Roadmap
        </SbDraggable>
      </div>
      <div className="space-y-1.5">
        {SLOTS.map((t) => (
          <Slot key={t} time={t} booked={booked === t} />
        ))}
      </div>
      {note && <div className="mt-2 text-[11px] text-signal-warn">{note}</div>}
    </div>
  );
}
