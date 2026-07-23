import Link from "next/link";
import { ArrowRight, ScrollText, Landmark, ShieldCheck, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DemoButton } from "@/components/marketing/demo-button";
import { CORPORATE_CATEGORIES } from "@/lib/content";

export const metadata = { title: "About — Calendar Council" };

/** Simple initials avatar — echoes the AgentAvatar shape without a new component file. */
function InitialsAvatar({ initials }: { initials: string }) {
  return (
    <span
      className="grid h-14 w-14 shrink-0 place-items-center rounded-[30%] bg-gradient-to-br from-primary to-primary/70 font-display text-lg font-semibold text-primary-foreground shadow-sm"
      aria-hidden
    >
      {initials}
    </span>
  );
}

const COMPANY_FACTS: { value: string; label: string }[] = [
  { value: "$47M", label: "seed round, unsolicited" },
  { value: "12", label: "agents on permanent staff" },
  { value: "0", label: "features a user requested" },
  { value: "1", label: "category invented" },
];

const LEADERSHIP: { name: string; initials: string; role: string; bio: string }[] = [
  {
    name: "Dr. Helena Voss",
    initials: "HV",
    role: "Founder & Chief Governance Officer",
    bio: "Spent nine years designing approval workflows for approval workflows before concluding that the calendar itself was the unregulated frontier.",
  },
  {
    name: "Marcus Feld",
    initials: "MF",
    role: "Chief Temporal Officer",
    bio: "Believes every hour should report to someone. Under his leadership, every hour now does.",
  },
  {
    name: "Priya Anand",
    initials: "PA",
    role: "Head of Deliberation",
    bio: "Oversees the twelve agents and the steadily escalating tension between them. Has never adjourned a session early.",
  },
  {
    name: "Jonas Reiter",
    initials: "JR",
    role: "VP, Autonomy Reduction",
    bio: "Owns the company's flagship outcome and, more importantly, its trendline. Reviews it hourly.",
  },
];

const DOCUMENTS: { title: string; icon: typeof ScrollText; body: string[] }[] = [
  {
    title: "Council Constitution",
    icon: ScrollText,
    body: [
      "The founding document of Calendar Council. It establishes the twelve standing agents, their mandates, their right to object, and their right to object to one another. Article 0 asserts that no commitment is self-evidently justified.",
      "Article II deprecates direct calendar access. The Constitution may be amended only by unanimous consent of all twelve agents — a condition that has never been met and is not anticipated.",
    ],
  },
  {
    title: "Temporal Governance Policy",
    icon: Landmark,
    body: [
      "Defines how time is allocated, reviewed, and, where necessary, withheld. All hours are treated as shared institutional resources rather than personal property.",
      "The policy governs deliberation limits, buffer requirements, mandatory recovery windows, and the precise conditions under which a request may be recommended to Tuesday. It is reviewed quarterly by a committee convened specifically to determine when the review should take place.",
    ],
  },
  {
    title: "Trust Center",
    icon: ShieldCheck,
    body: [
      "Your data is retained permanently, because the permanent record is, by definition, permanent. We do not sell your data. We deliberate over it.",
      "Every objection, vote, appeal, and post-meeting compliance report is stored, indexed, and made available for cross-reference during future negotiations. Trust, within our framework, is not given. It is documented.",
    ],
  },
  {
    title: "Unauthorized Activity Protocol",
    icon: Siren,
    body: [
      "In the event that you attend an event without approval, the Council convenes an incident review within milliseconds. The protocol defines that review, the corrective plan, and the monitoring period that follows.",
      "Repeat unauthorized activity is referred to the standing committee. There is no statute of limitations on an unapproved brunch.",
    ],
  },
];

export default function AboutPage() {
  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden chamber-field text-white">
        <div className="pointer-events-none absolute inset-0 paper-grain opacity-[0.15]" />
        <div className="container relative py-20 lg:py-28">
          <div className="max-w-3xl">
            <Badge variant="gold" className="mb-6 backdrop-blur">
              <span className="mr-1 h-1.5 w-1.5 rounded-full bg-gold" /> Our story
            </Badge>
            <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
              A new category of software nobody asked for.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/70 text-pretty">
              We did not invent the meeting. We invented the objection to it.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- Brand story ---------------- */}
      <section className="container py-20 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <p className="record-label">The premise</p>
          <div className="mt-4 space-y-5 text-lg leading-relaxed text-foreground/90 text-pretty">
            <p>
              Calendar Council began with a single, uncomfortable observation: people were making
              scheduling decisions alone, unsupervised, in a matter of seconds. Coffees were being
              accepted. Dinners were being agreed to. No one was reviewing any of it.
            </p>
            <p>
              We found this unacceptable. So we built the institutional layer that belongs between a
              person and their own free time — twelve deliberating agents, one permanent record, and
              a due process for every commitment. What was once a click is now a proceeding.
            </p>
            <p>
              We are not a scheduling app. We are the governance framework your calendar always
              lacked and never requested.
            </p>
          </div>

          <div className="mt-10">
            <p className="record-label">The category we occupy</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {CORPORATE_CATEGORIES.map((c) => (
                <span
                  key={c}
                  className="rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Seed round ---------------- */}
      <section className="chamber-field text-white">
        <div className="container py-20 text-center lg:py-24">
          <p className="record-label text-gold">Company facts</p>
          <h2 className="mx-auto mt-3 max-w-3xl font-display text-2xl font-medium leading-snug tracking-tight text-balance sm:text-3xl">
            We raised an unnecessarily large seed round from investors who, in keeping with our
            values, were not consulted about whether we should.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-white/60 text-pretty">
            The capital is being deployed responsibly: on more agents, longer deliberations, and a
            standing committee that meets to decide when the other committees should meet.
          </p>
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-4">
            {COMPANY_FACTS.map((f) => (
              <div key={f.label} className="bg-transparent p-6 text-center">
                <p className="font-display text-3xl font-semibold text-gold tabular sm:text-4xl">
                  {f.value}
                </p>
                <p className="mt-1.5 text-sm text-white/60">{f.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Leadership ---------------- */}
      <section className="container py-20 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="record-label">Governance leadership</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            The people who oversee the oversight.
          </h2>
        </div>
        <div className="mx-auto mt-14 grid max-w-4xl gap-5 sm:grid-cols-2">
          {LEADERSHIP.map((person) => (
            <div key={person.name} className="flex gap-5 rounded-xl border bg-card p-6 shadow-sm">
              <InitialsAvatar initials={person.initials} />
              <div className="min-w-0">
                <h3 className="font-display text-lg font-semibold leading-tight">{person.name}</h3>
                <p className="mt-0.5 text-xs font-medium uppercase tracking-[0.12em] text-gold/80">
                  {person.role}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{person.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Governance documents ---------------- */}
      <section className="border-y bg-muted/30">
        <div className="container py-20 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="record-label">Public record</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Governance documents.
            </h2>
            <p className="mt-3 text-muted-foreground">
              The founding instruments that bind the Council, the calendar, and you.
            </p>
          </div>
          <div className="mx-auto mt-12 max-w-3xl rounded-2xl border bg-card px-6 shadow-sm">
            <Accordion type="single" collapsible>
              {DOCUMENTS.map((doc) => {
                const Icon = doc.icon;
                return (
                  <AccordionItem key={doc.title} value={doc.title}>
                    <AccordionTrigger className="text-base font-medium">
                      <span className="flex items-center gap-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gold/10 text-gold">
                          <Icon className="h-4 w-4" />
                        </span>
                        {doc.title}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pl-11 text-sm leading-relaxed">
                      {doc.body.map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="border-t">
        <div className="container py-20 text-center">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Join a company that reviews everything.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Including this decision. Especially this decision.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register">
              <Button variant="gold" size="lg">
                Request Permission <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <DemoButton variant="outline" size="lg">
              Enter Demo Account
            </DemoButton>
          </div>
        </div>
      </section>
    </>
  );
}
