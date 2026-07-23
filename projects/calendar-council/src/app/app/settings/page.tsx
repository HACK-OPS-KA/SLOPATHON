import { getCurrentUser } from "@/lib/auth";
import { SettingsPanel, type SettingsInitial } from "@/components/app/settings-panel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const p = user.preferences;

  const initial: SettingsInitial = {
    name: user.name,
    displayName: user.displayName || user.name,
    email: user.email,
    timezone: user.timezone,
    isDemo: user.isDemo,
    prefs: {
      wakeTime: p?.wakeTime ?? "07:00",
      sleepTime: p?.sleepTime ?? "23:30",
      workStart: p?.workStart ?? "09:00",
      workEnd: p?.workEnd ?? "18:00",
      maximumDailyMeetings: p?.maximumDailyMeetings ?? 3,
      travelTolerance: p?.travelTolerance ?? "requires_review",
      spendingLimit: p?.spendingLimit ?? 8,
      socialBatteryLimit: p?.socialBatteryLimit ?? 2,
      comedyIntensity: p?.comedyIntensity ?? "balanced",
      demoSpeed: p?.demoSpeed ?? "presentation",
      consensusThreshold: p?.consensusThreshold ?? 60,
      chaosCanVote: p?.chaosCanVote ?? true,
      reducedMotion: p?.reducedMotion ?? false,
    },
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6">
        <p className="record-label">Settings</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">Governance configuration</h1>
        <p className="mt-1.5 text-muted-foreground">Adjust your stated preferences. The Council will weigh them at its discretion.</p>
      </div>
      <SettingsPanel initial={initial} />
    </div>
  );
}
