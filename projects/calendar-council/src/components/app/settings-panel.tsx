"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Loader2, AlertTriangle, Landmark, Sparkles, Trash2, ShieldAlert } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { updateProfile, updatePreferences, resetDemoData, deleteAccount } from "@/lib/actions/settings";
import { toast } from "@/lib/store/toast";
import { cn } from "@/lib/utils";

export interface SettingsInitial {
  name: string;
  displayName: string;
  email: string;
  timezone: string;
  isDemo: boolean;
  prefs: {
    wakeTime: string;
    sleepTime: string;
    workStart: string;
    workEnd: string;
    maximumDailyMeetings: number;
    travelTolerance: string;
    spendingLimit: number;
    socialBatteryLimit: number;
    comedyIntensity: string;
    demoSpeed: string;
    consensusThreshold: number;
    chaosCanVote: boolean;
    reducedMotion: boolean;
  };
}

const TZ = ["Europe/Berlin", "Europe/London", "Europe/Paris", "Europe/Zurich", "America/New_York", "America/Los_Angeles", "Asia/Tokyo"];

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Label>{label}</Label>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="sm:w-64">{children}</div>
    </div>
  );
}

export function SettingsPanel({ initial }: { initial: SettingsInitial }) {
  const { theme, setTheme } = useTheme();
  const [pending, startTransition] = React.useTransition();

  const [profile, setProfile] = React.useState({ name: initial.name, displayName: initial.displayName, timezone: initial.timezone });
  const [prefs, setPrefs] = React.useState(initial.prefs);
  const [engineMode, setEngineMode] = React.useState("mock");
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  function saveProfile() {
    startTransition(async () => {
      await updateProfile(profile);
      toast({ title: "Profile updated", kind: "success" });
    });
  }
  function savePrefs(patch: Record<string, unknown>, note = "Preferences updated") {
    setPrefs((p) => ({ ...p, ...patch }));
    startTransition(async () => {
      await updatePreferences(patch);
      toast({ title: note, kind: "success" });
    });
  }

  return (
    <Tabs defaultValue="account">
      <TabsList className="mb-6 flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
        {[
          ["account", "Account"],
          ["preferences", "Preferences"],
          ["governance", "Governance"],
          ["appearance", "Appearance"],
          ["demo", "Demo"],
          ["danger", "Danger"],
        ].map(([v, l]) => (
          <TabsTrigger key={v} value={v} className="rounded-full border data-[state=active]:border-gold/50 data-[state=active]:bg-gold/10">
            {l}
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Account */}
      <TabsContent value="account">
        <Card className="divide-y p-5">
          <Row label="Full name"><Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></Row>
          <Row label="Display name"><Input value={profile.displayName} onChange={(e) => setProfile({ ...profile, displayName: e.target.value })} /></Row>
          <Row label="Email" hint="Contact Governance to change."><Input value={initial.email} disabled /></Row>
          <Row label="Time zone">
            <Select value={profile.timezone} onValueChange={(v) => setProfile({ ...profile, timezone: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TZ.map((t) => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}</SelectContent>
            </Select>
          </Row>
          <div className="flex justify-end pt-4">
            <Button onClick={saveProfile} disabled={pending}>{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save account</Button>
          </div>
        </Card>
      </TabsContent>

      {/* Preferences */}
      <TabsContent value="preferences">
        <Card className="divide-y p-5">
          <div className="grid gap-3 py-3 sm:grid-cols-2">
            <div><Label>Work starts</Label><Input type="time" value={prefs.workStart} onChange={(e) => setPrefs({ ...prefs, workStart: e.target.value })} /></div>
            <div><Label>Work ends</Label><Input type="time" value={prefs.workEnd} onChange={(e) => setPrefs({ ...prefs, workEnd: e.target.value })} /></div>
            <div><Label>Wake time</Label><Input type="time" value={prefs.wakeTime} onChange={(e) => setPrefs({ ...prefs, wakeTime: e.target.value })} /></div>
            <div><Label>Bedtime</Label><Input type="time" value={prefs.sleepTime} onChange={(e) => setPrefs({ ...prefs, sleepTime: e.target.value })} /></div>
          </div>
          <Row label="Maximum daily meetings"><Input type="number" min={0} value={prefs.maximumDailyMeetings} onChange={(e) => setPrefs({ ...prefs, maximumDailyMeetings: Number(e.target.value) })} /></Row>
          <Row label="Discretionary spending limit (€)"><Input type="number" min={0} value={prefs.spendingLimit} onChange={(e) => setPrefs({ ...prefs, spendingLimit: Number(e.target.value) })} /></Row>
          <Row label="Social battery limit (events/day)"><Input type="number" min={0} value={prefs.socialBatteryLimit} onChange={(e) => setPrefs({ ...prefs, socialBatteryLimit: Number(e.target.value) })} /></Row>
          <Row label="Travel tolerance">
            <Select value={prefs.travelTolerance} onValueChange={(v) => setPrefs({ ...prefs, travelTolerance: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["tolerable", "requires_review", "strongly_discouraged"].map((t) => <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </Row>
          <div className="flex justify-end pt-4">
            <Button onClick={() => savePrefs({
              workStart: prefs.workStart, workEnd: prefs.workEnd, wakeTime: prefs.wakeTime, sleepTime: prefs.sleepTime,
              maximumDailyMeetings: prefs.maximumDailyMeetings, spendingLimit: prefs.spendingLimit,
              socialBatteryLimit: prefs.socialBatteryLimit, travelTolerance: prefs.travelTolerance,
            })} disabled={pending}>Save preferences</Button>
          </div>
        </Card>
      </TabsContent>

      {/* Governance */}
      <TabsContent value="governance">
        <Card className="divide-y p-5">
          <div className="py-3">
            <div className="mb-2 flex items-center justify-between"><Label>Consensus threshold for approval</Label><span className="tabular text-sm text-muted-foreground">{prefs.consensusThreshold}%</span></div>
            <Slider value={[prefs.consensusThreshold]} min={0} max={100} step={5} onValueChange={(v) => setPrefs({ ...prefs, consensusThreshold: v[0] })} />
          </div>
          <Row label="Chaos Agent may vote" hint="Adoption rate of its votes: 0%."><Switch checked={prefs.chaosCanVote} onCheckedChange={(v) => savePrefs({ chaosCanVote: v }, "Governance updated")} /></Row>
          <Row label="Agents may access integration data" hint="Recommended: unavoidable."><Switch checked disabled /></Row>
          <Row label="Appeals permitted" hint="Heard by the same agents who decided."><Switch checked disabled /></Row>
          <div className="flex items-center justify-between pt-4">
            <p className="text-xs text-muted-foreground">Configure individual agent powers in My Council.</p>
            <Button onClick={() => savePrefs({ consensusThreshold: prefs.consensusThreshold }, "Governance updated")} disabled={pending}>Save governance</Button>
          </div>
        </Card>
      </TabsContent>

      {/* Appearance */}
      <TabsContent value="appearance">
        <Card className="divide-y p-5">
          <Row label="Theme">
            <div className="flex gap-1.5">
              {[["light", Sun], ["dark", Moon], ["system", Monitor]].map(([val, Icon]) => {
                const I = Icon as React.ElementType;
                return (
                  <Button key={val as string} variant={theme === val ? "seal" : "outline"} size="sm" onClick={() => setTheme(val as string)} className="flex-1 capitalize">
                    <I className="h-4 w-4" /> {val as string}
                  </Button>
                );
              })}
            </div>
          </Row>
          <Row label="Reduced motion" hint="Calms the constitutional crisis animations."><Switch checked={prefs.reducedMotion} onCheckedChange={(v) => savePrefs({ reducedMotion: v }, "Appearance updated")} /></Row>
          <Row label="Compact chat"><Switch onCheckedChange={() => toast({ title: "Preference recorded. The Council will disregard it.", kind: "council" })} /></Row>
        </Card>
      </TabsContent>

      {/* Demo */}
      <TabsContent value="demo">
        <Card className="divide-y p-5">
          <Row label="Negotiation engine" hint="Real LLM mode requires an API key; mock mode needs none.">
            <Select value={engineMode} onValueChange={(v) => { setEngineMode(v); toast({ title: v === "llm" ? "Real LLM mode selected (falls back to mock without a key)." : "Reliable mock mode selected.", kind: "council" }); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="mock">Mock (reliable)</SelectItem><SelectItem value="llm">Real LLM</SelectItem></SelectContent>
            </Select>
          </Row>
          <Row label="Conversation speed">
            <Select value={prefs.demoSpeed} onValueChange={(v) => savePrefs({ demoSpeed: v }, "Demo speed updated")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="realistic">Realistic</SelectItem><SelectItem value="presentation">Presentation</SelectItem><SelectItem value="unhinged">Unhinged</SelectItem></SelectContent>
            </Select>
          </Row>
          <Row label="Comedy intensity">
            <Select value={prefs.comedyIntensity} onValueChange={(v) => savePrefs({ comedyIntensity: v }, "Comedy intensity updated")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="dry">Dry</SelectItem><SelectItem value="balanced">Balanced</SelectItem><SelectItem value="unhinged">Unhinged</SelectItem></SelectContent>
            </Select>
          </Row>
          <Row label="Force catastrophic scenario" hint="Jump straight to an unauthorized-activity incident.">
            <a href="/app/negotiations/demo?incident=1"><Button variant="outline" className="w-full text-oppose hover:text-oppose"><ShieldAlert className="h-4 w-4" /> Trigger incident</Button></a>
          </Row>
          <Row label="Reset demo data" hint="Removes negotiations you created; keeps the seeded set.">
            <Button variant="outline" onClick={() => startTransition(async () => { await resetDemoData(); toast({ title: "Demo data reset to baseline.", kind: "success" }); })} disabled={pending}>Reset</Button>
          </Row>
        </Card>
      </TabsContent>

      {/* Danger */}
      <TabsContent value="danger">
        <Card className="border-veto/30 p-5">
          <div className="divide-y">
            <Row label="Dissolve Council" hint="Disband all twelve agents.">
              <Button variant="outline" onClick={() => toast({ title: "Council dissolution requires Council approval.", kind: "warning" })}>
                <Landmark className="h-4 w-4" /> Dissolve
              </Button>
            </Row>
            <Row label="Restore personal autonomy" hint="Reclaim the right to schedule your own life.">
              <Button variant="outline" onClick={() => toast({ title: "Request submitted to the Council.", kind: "council" })}>
                <Sparkles className="h-4 w-4" /> Request restoration
              </Button>
            </Row>
            <Row label="Delete account" hint={initial.isDemo ? "Demo accounts are shared and cannot be deleted." : "Permanent. The Council keeps the records."}>
              <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </Row>
          </div>
        </Card>
      </TabsContent>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-veto" /> Delete account?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {initial.isDemo
              ? "This is the shared demo account, so it won't actually be deleted — you'll simply be signed out."
              : "This permanently deletes your account and all negotiation history. The Council will remember this."}
          </p>
          <DialogFooter>
            <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
            <form action={deleteAccount}><Button type="submit" variant="destructive">Delete account</Button></form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
