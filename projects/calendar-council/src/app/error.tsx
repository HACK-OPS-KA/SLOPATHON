"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="max-w-md text-center">
        <p className="record-label">System notice</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Internal governance has collapsed.</h1>
        <p className="mt-3 text-muted-foreground">
          An unexpected fault occurred within the Council. Personal decision-making remains temporarily available.
        </p>
        <div className="mt-8 flex justify-center gap-2">
          <Button variant="gold" onClick={reset}>Reconvene the Council</Button>
          <a href="/app"><Button variant="outline">Return to dashboard</Button></a>
        </div>
      </div>
    </div>
  );
}
