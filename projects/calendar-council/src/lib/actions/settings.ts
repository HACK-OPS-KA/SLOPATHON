"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { destroySession } from "@/lib/auth";

export async function updateAgentConfig(
  agentType: string,
  patch: {
    influence?: number;
    vetoEnabled?: boolean;
    aggression?: number;
    messageFrequency?: number;
    interrogationEnabled?: boolean;
    enabled?: boolean;
    tone?: string;
  },
): Promise<{ ok: boolean }> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false };
  await prisma.agentConfiguration.upsert({
    where: { userId_agentType: { userId, agentType } },
    create: { userId, agentType, ...patch },
    update: patch,
  });
  return { ok: true };
}

export async function updatePreferences(patch: Record<string, unknown>): Promise<{ ok: boolean }> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false };
  await prisma.userPreferences.upsert({
    where: { userId },
    create: { userId, ...patch } as never,
    update: patch as never,
  });
  return { ok: true };
}

export async function updateProfile(patch: {
  name?: string;
  displayName?: string;
  timezone?: string;
}): Promise<{ ok: boolean }> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false };
  await prisma.user.update({ where: { id: userId }, data: patch });
  return { ok: true };
}

/** Reset user-created data back to the seeded baseline (keeps seed rows). */
export async function resetDemoData(): Promise<{ ok: boolean }> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false };
  await prisma.negotiation.deleteMany({ where: { userId, isSeed: false } });
  return { ok: true };
}

export async function deleteAccount(): Promise<void> {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  // Demo accounts are shared — never actually delete them; just sign out.
  if (user && !user.isDemo) {
    await prisma.user.delete({ where: { id: userId } });
  }
  destroySession();
  redirect("/");
}
