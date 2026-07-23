"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Sparkles, ShieldAlert, Plus } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Notifications, type NotificationItem } from "@/components/app/notifications";
import { UserMenu, type ShellUser } from "@/components/app/user-menu";
import { APP_NAV, type NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";

function isActive(item: NavItem, pathname: string) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {APP_NAV.map((item) => {
        const active = isActive(item, pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-white/10 text-white"
                : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground",
            )}
          >
            <Icon className={cn("h-[1.15rem] w-[1.15rem] shrink-0", active ? "text-sidebar-accent" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function DemoControls({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-sidebar-foreground/50">
        <Sparkles className="h-3 w-3 text-sidebar-accent" /> Demo Controls
      </p>
      <div className="flex flex-col gap-1.5">
        <Link href="/app/negotiations/demo" onClick={onNavigate}>
          <Button variant="gold" size="sm" className="w-full justify-start">
            <Plus className="h-4 w-4" /> Launch Alex Demo
          </Button>
        </Link>
        <Link href="/app/negotiations/demo?incident=1" onClick={onNavigate}>
          <Button variant="outline" size="sm" className="w-full justify-start border-white/15 bg-transparent text-sidebar-foreground/80 hover:bg-white/5 hover:text-white">
            <ShieldAlert className="h-4 w-4" /> Report Unauthorized Activity
          </Button>
        </Link>
      </div>
    </div>
  );
}

function SidebarInner({ user, pathname, onNavigate }: { user: ShellUser; pathname: string; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-4 p-3">
      <div className="px-2 pt-2">
        <Link href="/app" onClick={onNavigate} className="text-white">
          <Logo size="sm" textClassName="text-white" />
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto scroll-slim px-1">
        <NavLinks pathname={pathname} onNavigate={onNavigate} />
      </div>
      <div className="space-y-3 px-1">
        <DemoControls onNavigate={onNavigate} />
        <div className="border-t border-white/10 pt-2">
          <UserMenu user={user} />
        </div>
      </div>
    </div>
  );
}

export function AppShell({
  user,
  notifications,
  children,
}: {
  user: ShellUser;
  notifications: NotificationItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const active = APP_NAV.find((i) => isActive(i, pathname));
  const title = active?.label ?? "Overview";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 bg-sidebar md:block">
        <div className="sticky top-0 h-screen">
          <SidebarInner user={user} pathname={pathname} />
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="absolute inset-y-0 left-0 w-72 bg-sidebar shadow-2xl"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-4 z-10 rounded-md p-1.5 text-sidebar-foreground/60 hover:bg-white/10 hover:text-white"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarInner user={user} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 md:hidden">
            <Logo size="sm" showText={false} />
          </div>
          <h1 className="hidden font-display text-lg font-semibold md:block">{title}</h1>
          <div className="ml-auto flex items-center gap-1.5">
            <Link href="/app/new" className="hidden sm:block">
              <Button variant="gold" size="sm">
                <Plus className="h-4 w-4" /> Request Permission
              </Button>
            </Link>
            <Notifications items={notifications} />
            <ThemeToggle />
          </div>
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
