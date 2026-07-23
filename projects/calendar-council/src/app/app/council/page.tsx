import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AGENT_LIST } from "@/lib/agents";
import { CouncilManager, type AgentCfg } from "@/components/app/council-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Council" };

export default async function CouncilPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const rows = await prisma.agentConfiguration.findMany({ where: { userId: user.id } });
  const byType = new Map(rows.map((r) => [r.agentType, r]));

  const initial: AgentCfg[] = AGENT_LIST.map((a) => {
    const r = byType.get(a.type);
    return {
      agentType: a.type,
      influence: r?.influence ?? a.defaultInfluence,
      vetoEnabled: r?.vetoEnabled ?? a.defaultVeto,
      aggression: r?.aggression ?? a.defaultAggression,
      messageFrequency: r?.messageFrequency ?? 55,
      interrogationEnabled: r?.interrogationEnabled ?? true,
      enabled: r?.enabled ?? true,
    };
  });

  const vetoCount = initial.filter((c) => c.vetoEnabled).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6">
        <p className="record-label">My Council</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">Your seated agents</h1>
        <p className="mt-1.5 text-muted-foreground">
          Inspect and reconfigure the twelve stakeholders who govern your time. {vetoCount} currently hold veto power.
        </p>
      </div>
      <CouncilManager initial={initial} />
    </div>
  );
}
