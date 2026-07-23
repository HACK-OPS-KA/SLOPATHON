"use client";

import * as React from "react";
import Link from "next/link";
import { LogOut, Settings, CreditCard, ChevronsUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { logoutAction } from "@/lib/actions/auth";
import { PLAN_LABELS } from "@/lib/nav";
import { initialsOf, cn } from "@/lib/utils";

export interface ShellUser {
  id: string;
  name: string;
  displayName: string | null;
  email: string;
  plan: string;
  isDemo: boolean;
  autonomyScore: number;
}

export function UserMenu({ user, compact = false }: { user: ShellUser; compact?: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-white/5",
            compact && "w-auto",
          )}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-gold/20 font-display text-sm font-semibold text-gold">
            {initialsOf(user.name)}
          </span>
          {!compact && (
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="truncate text-sm font-medium text-sidebar-foreground">{user.displayName || user.name}</span>
                {user.isDemo && <Badge variant="gold" className="px-1.5 py-0 text-[9px]">DEMO</Badge>}
              </span>
              <span className="block truncate text-xs text-sidebar-foreground/50">{PLAN_LABELS[user.plan] ?? user.plan} plan</span>
            </span>
          )}
          {!compact && <ChevronsUpDown className="h-4 w-4 shrink-0 text-sidebar-foreground/50" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-60">
        <DropdownMenuLabel className="flex flex-col">
          <span className="text-sm font-medium text-foreground">{user.name}</span>
          <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/app/settings">
            <Settings className="h-4 w-4" /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/app/billing">
            <CreditCard className="h-4 w-4" /> Billing
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-oppose outline-none transition-colors hover:bg-accent"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
