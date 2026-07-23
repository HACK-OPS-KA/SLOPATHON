"use client";

import * as React from "react";
import { useFormState, useFormStatus } from "react-dom";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, type AuthState } from "@/lib/actions/auth";
import { DEMO_USER } from "@/lib/demo";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Verifying credentials…
        </>
      ) : (
        "Log in"
      )}
    </Button>
  );
}

export function LoginForm() {
  const [state, action] = useFormState<AuthState, FormData>(loginAction, {});
  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <div className="flex items-start gap-2 rounded-md border border-oppose/30 bg-oppose/10 px-3 py-2 text-sm text-oppose">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="you@example.com" defaultValue={DEMO_USER.email} autoComplete="email" required />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <span className="text-xs text-muted-foreground">Forgot? File an appeal.</span>
        </div>
        <Input id="password" name="password" type="password" placeholder="••••••••" defaultValue={DEMO_USER.password} autoComplete="current-password" required />
      </div>
      <SubmitButton />
      <p className="text-center text-xs text-muted-foreground">
        Demo credentials are pre-filled. The Council permits this once.
      </p>
    </form>
  );
}
