import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getSessionUserId } from "@/lib/auth";
import { AuthShell } from "@/components/marketing/auth-shell";
import { RegisterForm } from "@/components/marketing/register-form";
import { DemoButton } from "@/components/marketing/demo-button";

export const dynamic = "force-dynamic";

export const metadata = { title: "Request Permission" };

export default async function RegisterPage() {
  if (await getSessionUserId()) redirect("/app");
  return (
    <AuthShell
      quote="Every meeting deserves due process."
      attribution="Calendar Council, mission statement"
    >
      <div className="space-y-2 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Request permission to begin</h1>
        <p className="text-sm text-muted-foreground">
          Create an account and the Council will convene to govern your time.
        </p>
      </div>

      <div className="mt-8">
        <RegisterForm />
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-widest text-muted-foreground">in a hurry?</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="rounded-xl border border-gold/40 bg-gold/5 p-4">
        <p className="flex items-center gap-1.5 text-xs font-medium text-gold">
          <Sparkles className="h-3.5 w-3.5" /> Instant access
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Explore a fully seeded demo account — no signup.</p>
        <DemoButton variant="outline" size="lg" className="mt-3 w-full">
          Enter Demo Account
        </DemoButton>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already governed?{" "}
        <Link href="/login" className="font-medium text-gold hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
