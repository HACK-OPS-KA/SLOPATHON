"use client";

import * as React from "react";
import type { DemoSpeed, MeetingRequest } from "@/lib/types";
import { useChatStore } from "@/lib/store/chat";
import { ChatHeader } from "./chat-header";
import { MessageList } from "./message-list";
import { Composer } from "./composer";
import { CouncilRail } from "./council-rail";
import { CrisisOverlay } from "./crisis-overlay";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function NegotiationRoom({
  request,
  committeeName,
  userName,
  seed,
  autoIncident = false,
  initialSpeed = "presentation",
}: {
  request: MeetingRequest;
  committeeName: string;
  userName: string;
  seed: string;
  autoIncident?: boolean;
  initialSpeed?: DemoSpeed;
}) {
  const init = useChatStore((s) => s.init);
  const messages = useChatStore((s) => s.messages);
  const typing = useChatStore((s) => s.typing);
  const [railOpen, setRailOpen] = React.useState(false);
  const initedRef = React.useRef<string>();

  React.useEffect(() => {
    const key = `${seed}:${autoIncident}`;
    if (initedRef.current === key) return;
    initedRef.current = key;
    init(request, { userName, committeeName, seed, speed: initialSpeed, autoIncident });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, autoIncident]);

  return (
    <div className="relative flex h-[calc(100dvh-4rem)] flex-col bg-muted/10">
      <ChatHeader committeeName={committeeName} onOpenRail={() => setRailOpen(true)} />
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <MessageList messages={messages} typing={typing} />
          <Composer />
        </div>
        <aside className="hidden w-80 shrink-0 border-l bg-background lg:block">
          <CouncilRail />
        </aside>
      </div>

      <CrisisOverlay />

      {/* Mobile council status */}
      <Dialog open={railOpen} onOpenChange={setRailOpen}>
        <DialogContent className="max-h-[85dvh] max-w-md overflow-hidden p-0">
          <DialogHeader className="border-b px-4 py-3">
            <DialogTitle>Council status</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70dvh] overflow-hidden">
            <CouncilRail />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
