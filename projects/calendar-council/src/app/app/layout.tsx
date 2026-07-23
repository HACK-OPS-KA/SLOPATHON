import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app/app-shell";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.onboardingCompleted) redirect("/onboarding");

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 14,
  });

  return (
    <TooltipProvider delayDuration={200}>
      <AppShell
        user={{
          id: user.id,
          name: user.name,
          displayName: user.displayName,
          email: user.email,
          plan: user.subscriptionPlan,
          isDemo: user.isDemo,
          autonomyScore: user.autonomyScore,
        }}
        notifications={notifications.map((n) => ({
          id: n.id,
          title: n.title,
          kind: n.kind,
          agentType: n.agentType,
          read: n.read,
          createdAt: n.createdAt.getTime(),
        }))}
      >
        {children}
      </AppShell>
      <Toaster />
    </TooltipProvider>
  );
}
