"use client";

import * as React from "react";
import { Wand2, Send, Loader2, Info } from "lucide-react";
import { parseRequest } from "@/lib/parse";
import { createNegotiation } from "@/lib/actions/negotiation";
import type { MeetingRequest } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DAYS = ["Today", "Tomorrow", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const CATEGORIES = ["coffee", "lunch", "dinner", "drinks", "call", "gym", "networking", "party", "meeting", "errand", "other"];
const TRAVEL = ["Walk", "Public transport", "Bike", "Car", "Taxi"];
const DURATIONS = [15, 30, 45, 60, 90, 120, 180, 240];

const DEFAULT: MeetingRequest = {
  title: "",
  attendees: "",
  dayLabel: "Tomorrow",
  startTime: "10:00",
  durationMin: 60,
  location: "",
  city: "Karlsruhe",
  category: "coffee",
  estimatedCost: 6,
  travelMethod: "Public transport",
  purpose: "",
  importance: 3,
  flexibility: 3,
  involvesFood: false,
  involvesAlcohol: false,
  affectsWorkout: false,
  alreadyCommitted: false,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function NewRequestForm() {
  const [nl, setNl] = React.useState("");
  const [interpreted, setInterpreted] = React.useState(false);
  const [req, setReq] = React.useState<MeetingRequest>(DEFAULT);
  const [pending, startTransition] = React.useTransition();

  function up<K extends keyof MeetingRequest>(k: K, v: MeetingRequest[K]) {
    setReq((r) => ({ ...r, [k]: v }));
  }

  function interpret() {
    if (!nl.trim()) return;
    const parsed = parseRequest(nl);
    setReq((r) => ({ ...r, ...Object.fromEntries(Object.entries(parsed).filter(([, v]) => v !== undefined && v !== "")) }));
    setInterpreted(true);
  }

  function submit() {
    const finalReq: MeetingRequest = {
      ...req,
      title: req.title?.trim() || (req.attendees ? `${req.category} with ${req.attendees}` : "Untitled request"),
    };
    startTransition(() => createNegotiation(finalReq));
  }

  return (
    <div className="space-y-6">
      {/* Natural language */}
      <Card className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-gold" />
          <p className="font-display text-sm font-semibold">Describe your request</p>
          <Badge variant="muted" className="ml-auto">Natural language</Badge>
        </div>
        <Textarea
          value={nl}
          onChange={(e) => setNl(e.target.value)}
          placeholder="e.g. Dinner with Alex on Friday at 19:00 at a restaurant in Karlsruhe"
          className="min-h-[72px]"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={interpret} disabled={!nl.trim()}>
            <Wand2 className="h-4 w-4" /> Interpret request
          </Button>
          <button
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            onClick={() => setNl("Dinner with Alex on Friday at 19:00 at a restaurant in Karlsruhe")}
          >
            Use the example
          </button>
        </div>
      </Card>

      {interpreted && (
        <div className="flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/[0.05] px-4 py-2.5 text-sm">
          <Info className="h-4 w-4 text-gold" />
          The Council has interpreted your request as follows. Verify before submission.
        </div>
      )}

      {/* Structured form */}
      <Card className="p-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Event title">
              <Input value={req.title} onChange={(e) => up("title", e.target.value)} placeholder="Coffee with Alex" />
            </Field>
          </div>
          <Field label="Attendees">
            <Input value={req.attendees} onChange={(e) => up("attendees", e.target.value)} placeholder="Alex" />
          </Field>
          <Field label="Event category">
            <Select value={req.category} onValueChange={(v) => up("category", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Day">
            <Select value={req.dayLabel} onValueChange={(v) => up("dayLabel", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start time"><Input type="time" value={req.startTime} onChange={(e) => up("startTime", e.target.value)} /></Field>
            <Field label="Duration">
              <Select value={String(req.durationMin)} onValueChange={(v) => up("durationMin", Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DURATIONS.map((d) => <SelectItem key={d} value={String(d)}>{d} min</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Location / venue"><Input value={req.location} onChange={(e) => up("location", e.target.value)} placeholder="A restaurant" /></Field>
          <Field label="City"><Input value={req.city} onChange={(e) => up("city", e.target.value)} placeholder="Karlsruhe" /></Field>
          <Field label="Estimated cost (€)"><Input type="number" min={0} value={req.estimatedCost} onChange={(e) => up("estimatedCost", Number(e.target.value))} /></Field>
          <Field label="Travel method">
            <Select value={req.travelMethod} onValueChange={(v) => up("travelMethod", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TRAVEL.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Purpose / justification">
              <Textarea value={req.purpose} onChange={(e) => up("purpose", e.target.value)} placeholder="Why do you believe you need to do this?" />
            </Field>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Importance</span><span className="tabular">{req.importance}/5</span></div>
            <Slider value={[req.importance ?? 3]} min={1} max={5} step={1} onValueChange={(v) => up("importance", v[0])} />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Flexibility</span><span className="tabular">{req.flexibility}/5</span></div>
            <Slider value={[req.flexibility ?? 3]} min={1} max={5} step={1} onValueChange={(v) => up("flexibility", v[0])} />
          </div>
        </div>

        <div className="mt-5 grid gap-3 border-t pt-5 sm:grid-cols-2">
          {[
            { k: "involvesFood", label: "Food is involved" },
            { k: "involvesAlcohol", label: "Alcohol is involved" },
            { k: "affectsWorkout", label: "This affects a workout" },
            { k: "alreadyCommitted", label: "I have already informally committed" },
          ].map((t) => (
            <label key={t.k} className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <span className="text-sm">{t.label}</span>
              <Switch
                checked={Boolean(req[t.k as keyof MeetingRequest])}
                onCheckedChange={(v) => up(t.k as keyof MeetingRequest, v as never)}
              />
            </label>
          ))}
        </div>
      </Card>

      <div className="flex flex-col items-center gap-2">
        <Button variant="gold" size="lg" onClick={submit} disabled={pending} className="w-full sm:w-auto">
          {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Convening the Council…</> : <><Send className="h-4 w-4" /> Submit for Review</>}
        </Button>
        <p className="text-xs text-muted-foreground">Submission does not imply approval.</p>
      </div>
    </div>
  );
}
