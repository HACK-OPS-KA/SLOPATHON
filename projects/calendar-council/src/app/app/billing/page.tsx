import { Check } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlanButton } from "@/components/app/billing-actions";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Billing" };

const PLANS = [
  {
    id: "observer",
    name: "Observer",
    price: "Free",
    cta: "Lose Some Autonomy",
    variant: "outline" as const,
    features: ["3 council negotiations per month", "7 agents", "Basic objections", "Standard guilt", "48-hour negotiation history", "Manual calendar entry"],
  },
  {
    id: "governed",
    name: "Governed",
    price: "€19",
    cta: "Surrender Control",
    variant: "gold" as const,
    highlight: true,
    features: ["Unlimited negotiations", "All 12 agents", "Advanced passive aggression", "Priority modelling", "Full negotiation history", "Emergency incident response", "Calendar integration", "Custom council weighting", "Appeals"],
  },
  {
    id: "institutional",
    name: "Institutional",
    price: "Contact us",
    cta: "Contact Governance",
    variant: "outline" as const,
    features: ["Multi-user scheduling committees", "Manager approval agents", "Organization-wide calendar policy", "Compliance reporting", "Custom veto rules", "Dedicated Temporal Governance Specialist", "SSO", "Audit logs", "Custom retention policy"],
  },
];

const INVOICES = [
  { date: "01 Jul 2026", desc: "Governed — monthly", amount: "€19.00", status: "Paid" },
  { date: "01 Jun 2026", desc: "Governed — monthly", amount: "€19.00", status: "Paid" },
  { date: "01 May 2026", desc: "Governed — monthly", amount: "€19.00", status: "Paid" },
];

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const current = user.subscriptionPlan;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6">
        <p className="record-label">Billing</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">Subscription & governance plan</h1>
        <p className="mt-1.5 text-muted-foreground">
          You are currently on the <span className="font-medium capitalize text-foreground">{current}</span> plan.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((p) => {
          const isCurrent = p.id === current;
          return (
            <Card key={p.id} className={cn("relative flex flex-col p-6", p.highlight && "border-gold/50 shadow-seal")}>
              {p.highlight && <Badge variant="gold" className="absolute -top-2.5 left-6">Most governed</Badge>}
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">{p.name}</h2>
                {isCurrent && <Badge variant="approve" className="text-[10px]">Current</Badge>}
              </div>
              <p className="mt-2 font-display text-3xl font-semibold">
                {p.price}
                {p.price.startsWith("€") && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
              </p>
              <ul className="mt-5 flex-1 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {f}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                {isCurrent ? (
                  <PlanButton label="Current plan" variant="secondary" />
                ) : (
                  <PlanButton label={p.cta} variant={p.variant} />
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 p-5">
        <p className="record-label mb-3">Billing history</p>
        <div className="divide-y">
          {INVOICES.map((inv, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 text-sm">
              <div>
                <p className="font-medium">{inv.desc}</p>
                <p className="text-xs text-muted-foreground">{inv.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="tabular">{inv.amount}</span>
                <Badge variant="approve" className="text-[10px]">{inv.status}</Badge>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">Invoiced in autonomy units. No refunds.</p>
      </Card>
    </div>
  );
}
