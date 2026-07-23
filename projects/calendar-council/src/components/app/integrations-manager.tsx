"use client";

import * as React from "react";
import { Loader2, Check, ShieldAlert } from "lucide-react";
import { IntegrationIcon } from "@/components/app/integration-icon";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/lib/store/toast";

export interface IntegrationItem {
  provider: string;
  name: string;
  icon: string;
  description: string;
  dataUse: string;
  permissions: string[];
  status: string;
  lastSyncedAt: number | null;
}

const STATUS_BADGE: Record<string, { label: string; variant: "approve" | "gold" | "conditional" | "veto" | "muted" }> = {
  connected: { label: "Connected", variant: "approve" },
  simulated: { label: "Simulated", variant: "gold" },
  requires_review: { label: "Requires review", variant: "conditional" },
  excessive: { label: "Excessive permissions requested", variant: "veto" },
  disconnected: { label: "Not connected", variant: "muted" },
};

export function IntegrationsManager({ items }: { items: IntegrationItem[] }) {
  const [statuses, setStatuses] = React.useState<Record<string, string>>(
    () => Object.fromEntries(items.map((i) => [i.provider, i.status])),
  );
  const [active, setActive] = React.useState<IntegrationItem | null>(null);
  const [connecting, setConnecting] = React.useState(false);

  function authorize(item: IntegrationItem) {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setStatuses((s) => ({ ...s, [item.provider]: "simulated" }));
      setActive(null);
      toast({ title: `${item.name} connected`, description: item.dataUse, kind: "council" });
    }, 1200);
  }
  function disconnect(item: IntegrationItem) {
    setStatuses((s) => ({ ...s, [item.provider]: "disconnected" }));
    setActive(null);
    toast({ title: `${item.name} disconnected`, kind: "warning" });
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((i) => {
          const status = statuses[i.provider];
          const b = STATUS_BADGE[status] ?? STATUS_BADGE.disconnected;
          const connected = status === "connected" || status === "simulated";
          return (
            <Card key={i.provider} className="flex flex-col p-4">
              <div className="flex items-start gap-3">
                <IntegrationIcon name={i.icon} className="h-10 w-10 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{i.name}</p>
                    <Badge variant={b.variant} className="shrink-0 text-[10px]">{b.label}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{i.description}</p>
                </div>
              </div>
              <p className="mt-3 text-xs italic text-muted-foreground">{i.dataUse}</p>
              <div className="mt-auto flex items-center justify-between pt-3">
                <span className="text-[11px] text-muted-foreground">{i.permissions.length} permissions</span>
                <Button size="sm" variant={connected ? "outline" : "seal"} onClick={() => setActive(i)}>
                  {connected ? "Manage" : "Connect"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-md">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <IntegrationIcon name={active.icon} className="h-8 w-8" /> {active.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Calendar Council</span> is requesting access to:
                </p>
                <ul className="space-y-1.5 rounded-lg border bg-muted/30 p-3">
                  {active.permissions.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-approve" /> {p}
                    </li>
                  ))}
                </ul>
                {statuses[active.provider] === "excessive" && (
                  <p className="flex items-center gap-1.5 text-xs text-veto"><ShieldAlert className="h-3.5 w-3.5" /> This integration requests more access than strictly necessary.</p>
                )}
                <div className="flex gap-2">
                  {statuses[active.provider] === "connected" || statuses[active.provider] === "simulated" ? (
                    <Button variant="outline" className="flex-1 text-oppose hover:text-oppose" onClick={() => disconnect(active)}>Disconnect</Button>
                  ) : (
                    <Button variant="gold" className="flex-1" disabled={connecting} onClick={() => authorize(active)}>
                      {connecting ? <><Loader2 className="h-4 w-4 animate-spin" /> Connecting…</> : "Authorize access"}
                    </Button>
                  )}
                </div>
                <p className="text-center text-[11px] text-muted-foreground">Simulated OAuth. No real data is accessed.</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
