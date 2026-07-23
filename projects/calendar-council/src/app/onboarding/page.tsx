import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { OnboardingWizard } from "@/components/onboarding/wizard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Council Formation Protocol" };

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.onboardingCompleted) redirect("/app");

  return (
    <div className="min-h-screen bg-background">
      <OnboardingWizard initialName={user.name} />
    </div>
  );
}
