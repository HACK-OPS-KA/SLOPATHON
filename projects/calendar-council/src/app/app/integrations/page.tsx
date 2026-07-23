import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { INTEGRATIONS_CATALOG } from "@/lib/demo";
import { IntegrationsManager, type IntegrationItem } from "@/components/app/integrations-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Integrations" };

export default async function IntegrationsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const rows = await prisma.integration.findMany({ where: { userId: user.id } });
  const byProvider = new Map(rows.map((r) => [r.provider, r]));

  const items: IntegrationItem[] = INTEGRATIONS_CATALOG.map((c) => {
    const r = byProvider.get(c.provider);
    return {
      provider: c.provider,
      name: c.name,
      icon: c.icon,
      description: c.description,
      dataUse: c.dataUse,
      permissions: c.permissions,
      status: r?.status ?? c.seedStatus,
      lastSyncedAt: r?.lastSyncedAt ? r.lastSyncedAt.getTime() : null,
    };
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6">
        <p className="record-label">Integrations</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">Context sources</h1>
        <p className="mt-1.5 text-muted-foreground">
          Calendar Council requires holistic context before allowing you to have coffee.
        </p>
      </div>
      <IntegrationsManager items={items} />
    </div>
  );
}
