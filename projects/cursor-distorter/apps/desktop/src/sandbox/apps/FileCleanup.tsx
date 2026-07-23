import { useState } from "react";
import { cn } from "@cursor-distorter/ui";
import { SbDraggable } from "../controls";
import { useDropZone } from "../../cursor/registry";

const FILES = [
  { id: "file-1", name: "final_v3.psd", icon: "🖼" },
  { id: "file-2", name: "notes.txt", icon: "📄" },
  { id: "file-3", name: "invoice.pdf", icon: "📕" },
  { id: "file-4", name: "IMG_0420.png", icon: "🖼" },
];

/** Drag files into the folder. The cursor tends to overshoot the destination. */
export function FileCleanup() {
  const [archived, setArchived] = useState<Set<string>>(new Set());
  const [note, setNote] = useState<string | null>(null);
  const folderRef = useDropZone("folder-archive");

  const onDrop = (id: string) => (zoneId: string | null) => {
    if (zoneId === "folder-archive") {
      setArchived((s) => new Set(s).add(id));
      setNote(null);
    } else {
      setNote("Missed the folder. The desktop stays messy.");
    }
  };

  const remaining = FILES.filter((f) => !archived.has(f.id));

  return (
    <div className="flex gap-4">
      <div className="grid flex-1 grid-cols-2 content-start gap-2">
        {remaining.length === 0 ? (
          <div className="col-span-2 py-6 text-center text-[11px] text-ink-500">Desktop clean. Suspicious.</div>
        ) : (
          remaining.map((f) => (
            <SbDraggable
              key={f.id}
              id={f.id}
              importance={0.5}
              priorityTag="files"
              onDrop={onDrop(f.id)}
              onDragStart={() => setNote(null)}
              className="flex flex-col items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-2 hover:bg-white/[0.05]"
            >
              <span className="text-xl leading-none">{f.icon}</span>
              <span className="max-w-[74px] truncate text-[10px] text-white/70">{f.name}</span>
            </SbDraggable>
          ))
        )}
      </div>
      <div
        ref={folderRef}
        className={cn(
          "flex w-28 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-white/12 bg-white/[0.02] py-4",
        )}
      >
        <span className="text-2xl leading-none">📁</span>
        <span className="text-[10px] text-ink-500">Archive</span>
        <span className="stat-num text-[11px] text-brand-300">{archived.size} filed</span>
      </div>
      {note && <div className="absolute bottom-2 left-4 text-[11px] text-signal-warn">{note}</div>}
    </div>
  );
}
