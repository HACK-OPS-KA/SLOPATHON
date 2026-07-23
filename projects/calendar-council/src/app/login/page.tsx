import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getSessionUserId } from "@/lib/auth";
import { AuthShell } from "@/components/marketing/auth-shell";
import { LoginForm } from "@/components/marketing/login-form";
import { DemoButton } from "@/components/marketing/demo-button";

export const dynamic = "force-dynamic";

export const metadata = { title: "Log in" };

export default async function LoginPage() {
  if (await getSessionUserId()) redirect("/app");
  return (
    <AuthShell
      quote="Your old calendar let you click 'Save.' That was dangerous."
      attribution="Unauthorized Activity Protocol, §4"
    >
      <div className="space-y-2 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Return to governance</h1>
        <p className="text-sm text-muted-foreground">Log in to resume institutional oversight of your time.</p>
      </div>

      <div className="mt-8 rounded-xl border border-gold/40 bg-gold/5 p-4">
        <p className="flex items-center gap-1.5 text-xs font-medium text-gold">
          <Sparkles className="h-3.5 w-3.5" /> Judges & first-timers
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Skip the paperwork. A fully governed account is ready.
        </p>
        <DemoButton variant="gold" size="lg" className="mt-3 w-full">
          Enter Demo Account
        </DemoButton>
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-widest text-muted-foreground">or log in</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <LoginForm />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        No account yet?{" "}
        <Link href="/register" className="font-medium text-gold hover:underline">
          Request permission
        </Link>
      </p>
    </AuthShell>
  );
}
