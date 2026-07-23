"use client";

import * as React from "react";
import { useFormState, useFormStatus } from "react-dom";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAction, type AuthState } from "@/lib/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="gold" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Forming your Council…
        </>
      ) : (
        "Create account & convene Council"
      )}
    </Button>
  );
}

export function RegisterForm() {
  const [state, action] = useFormState<AuthState, FormData>(registerAction, {});
  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <div className="flex items-start gap-2 rounded-md border border-oppose/30 bg-oppose/10 px-3 py-2 text-sm text-oppose">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" placeholder="Your name" autoComplete="name" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" placeholder="At least 6 characters" autoComplete="new-password" required />
      </div>
      <SubmitButton />
      <p className="text-center text-xs text-muted-foreground">
        By continuing you consent to institutional review of your free time.
      </p>
    </form>
  );
}
