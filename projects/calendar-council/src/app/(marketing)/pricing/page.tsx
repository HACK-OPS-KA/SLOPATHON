import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DemoButton } from "@/components/marketing/demo-button";
import { cn } from "@/lib/utils";

export const metadata = { title: "Pricing — Calendar Council" };

type Tier = {
  name: string;
  price: string;
  cadence?: string;
  tagline: string;
  features: string[];
  cta: { label: string; href: string; variant: ButtonProps["variant"] };
  highlighted?: boolean;
  badge?: string;
};

const TIERS: Tier[] = [
  {
    name: "Observer",
    price: "Free",
    tagline: "For individuals ready to be gently overruled.",
    features: [
      "3 council negotiations / month",
      "7 agents",
      "Basic objections",
      "Standard guilt",
      "48-hour negotiation history",
      "Manual calendar entry",
    ],
    cta: { label: "Lose Some Autonomy", href: "/register", variant: "outline" },
  },
  {
    name: "Governed",
    price: "€19",
    cadence: "/ month",
    tagline: "For those seeking a fuller, more binding oversight experience.",
    highlighted: true,
    badge: "Most governed",
    features: [
      "Unlimited negotiations",
      "All 12 agents",
      "Advanced passive aggression",
      "Priority modelling",
      "Full negotiation history",
      "Emergency incident response",
      "Calendar integration",
      "Custom council weighting",
      "Appeals",
    ],
    cta: { label: "Surrender Control", href: "/register", variant: "gold" },
  },
  {
    name: "Institutional",
    price: "Contact us",
    tagline: "For organizations that have decided no one should schedule anything.",
    features: [
      "Multi-user scheduling committees",
      "Manager approval agents",
      "Organization-wide calendar policy",
      "Compliance reporting",
      "Custom veto rules",
      "Dedicated Temporal Governance Specialist",
      "SSO",
      "Audit logs",
      "Custom retention policy",
    ],
    cta: { label: "Contact Governance", href: "/about", variant: "outline" },
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Can I schedule events without Council approval?",
    a: "This setting is unavailable under your current governance framework, and under every governance framework we offer. Direct calendar access was deprecated in Article II and is not scheduled to return.",
  },
  {
    q: "What is 'Standard guilt'?",
    a: "Standard guilt is the baseline emotional pressure applied to every commitment you decline, postpone, or attend anyway. It is included on all plans. Advanced passive aggression, available on Governed, adds tone, precise timing, and the occasional pointed silence.",
  },
  {
    q: "Do you offer refunds?",
    a: "Refunds are available, subject to a formal request, an initial analysis, a hearing, a preliminary vote, an appeal, and a final vote. Historically, the Council has recommended Tuesday.",
  },
  {
    q: "Is my autonomy safe?",
    a: "Your autonomy is measured, monitored, and steadily reduced within a controlled and fully audited environment. In that specific sense, it has never been more accounted for.",
  },
  {
    q: "Can I remove Chaos Agent?",
    a: "Chaos Agent cannot be removed. Chaos Agent can be muted, at which point Chaos Agent votes twice. This is a known, documented, and intended behavior.",
  },
];

export default function PricingPage() {
  return (
    <>
      {/* ---------------- Header ---------------- */}
      <section className="border-b bg-muted/20">
        <div className="container py-20 text-center lg:py-24">
          <p className="record-label">Plans &amp; governance tiers</p>
          <h1 className="mx-auto mt-3 max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl">
            Choose how much of your calendar to surrender.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground text-pretty">
            Every plan includes institutional review, structured objections, and a recommendation of
            Tuesday. Higher tiers simply mean less of you.
          </p>
        </div>
      </section>

      {/* ---------------- Pricing tiers ---------------- */}
      <section className="container py-20">
        <div className="mx-auto grid max-w-5xl items-start gap-6 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <Card
              key={tier.name}
              className={cn(
                "relative flex h-full flex-col",
                tier.highlighted && "border-gold shadow-seal ring-1 ring-gold/30",
              )}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="gold" className="shadow-sm">
                    {tier.badge}
                  </Badge>
                </div>
              )}
              <CardHeader className="space-y-3 pb-4">
                <CardTitle className="font-display text-lg">{tier.name}</CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-4xl font-semibold tracking-tight tabular">
                    {tier.price}
                  </span>
                  {tier.cadence && (
                    <span className="text-sm text-muted-foreground">{tier.cadence}</span>
                  )}
                </div>
                <CardDescription className="text-pretty">{tier.tagline}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="gold-rule mb-6" />
                <ul className="space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex gap-3 text-sm">
                      <span
                        className={cn(
                          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full",
                          tier.highlighted ? "bg-gold/15 text-gold" : "bg-muted text-foreground/70",
                        )}
                      >
                        <Check className="h-3 w-3" />
                      </span>
                      <span className="text-foreground/90">{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Link href={tier.cta.href} className="w-full">
                  <Button variant={tier.cta.variant} size="lg" className="w-full">
                    {tier.cta.label}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-muted-foreground">
          € prices exclude the cost to your personal autonomy. Autonomy, once surrendered, is
          non-refundable and does not accrue interest.
        </p>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section className="border-t bg-muted/30">
        <div className="container py-20 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="record-label">Frequently governed questions</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Questions the Council permits you to ask.
            </h2>
          </div>
          <div className="mx-auto mt-12 max-w-2xl rounded-2xl border bg-card px-6 shadow-sm">
            <Accordion type="single" collapsible>
              {FAQ.map((item) => (
                <AccordionItem key={item.q} value={item.q}>
                  <AccordionTrigger className="text-base font-medium">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="border-t">
        <div className="container py-20 text-center">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready to be governed?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Start free on Observer, or proceed directly to full institutional oversight.
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
