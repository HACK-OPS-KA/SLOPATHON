import Link from "next/link";
import { Logo, CouncilMark } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export function AuthShell({
  children,
  quote,
  attribution,
}: {
  children: React.ReactNode;
  quote?: string;
  attribution?: string;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden chamber-field p-12 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute inset-0 paper-grain opacity-[0.12]" />
        <Link href="/" className="relative text-white">
          <Logo textClassName="text-white" />
        </Link>
        <div className="relative my-auto max-w-md">
          <CouncilMark className="h-14 w-14 text-white/80" />
          <p className="mt-8 font-display text-2xl font-medium leading-snug tracking-tight text-balance">
            “{quote ?? "Democracy was a mistake. We brought it to your calendar."}”
          </p>
          <p className="mt-4 text-sm text-white/50">{attribution ?? "The Council Constitution, Article I"}</p>
        </div>
        <p className="relative font-mono text-xs uppercase tracking-[0.18em] text-white/40">
          Personal Time Governance
        </p>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-col p-6 sm:p-10">
        <div className="flex items-center justify-between lg:hidden">
          <Link href="/">
            <Logo size="sm" />
          </Link>
          <ThemeToggle />
        </div>
        <div className="absolute right-6 top-6 hidden lg:block">
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">{children}</div>
      </div>
    </div>
  );
}
