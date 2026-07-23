"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { AGENT_LIST } from "@/lib/agents";
import type { AgentType } from "@/lib/types";

export interface OnboardingPayload {
  name: string;
  displayName: string;
  timezone: string;
  workStart: string;
  workEnd: string;
  wakeTime: string;
  sleepTime: string;
  priorities: Record<string, number>;
  risk: Record<string, string>;
  philosophy: Record<string, string>;
  agents: Record<string, { influence: number; veto: boolean; aggression: number }>;
  integrations: Record<string, string>;
}

export async function completeOnboarding(payload: OnboardingPayload): Promise<void> {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const p = payload.priorities;

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: payload.name || "You",
      displayName: payload.displayName || payload.name?.split(" ")[0] || "You",
      timezone: payload.timezone || "Europe/Berlin",
      onboardingCompleted: true,
    },
  });

  await prisma.userPreferences.upsert({
    where: { userId },
    create: {
      userId,
      wakeTime: payload.wakeTime,
      sleepTime: payload.sleepTime,
      workStart: payload.workStart,
      workEnd: payload.workEnd,
      riskToleranceJson: JSON.stringify({ ...payload.risk, ...payload.philosophy }),
    },
    update: {
      wakeTime: payload.wakeTime,
      sleepTime: payload.sleepTime,
      workStart: payload.workStart,
      workEnd: payload.workEnd,
      riskToleranceJson: JSON.stringify({ ...payload.risk, ...payload.philosophy }),
    },
  });

  await prisma.priorityProfile.upsert({
    where: { userId },
    create: {
      userId,
      sleepWeight: p.sleep ?? 15,
      careerWeight: p.career ?? 15,
      fitnessWeight: p.fitness ?? 10,
      relationshipsWeight: p.relationships ?? 12,
      socialWeight: p.social ?? 8,
      financeWeight: p.finance ?? 10,
      healthWeight: p.health ?? 10,
      productivityWeight: p.productivity ?? 10,
      convenienceWeight: p.convenience ?? 5,
      spontaneityWeight: p.spontaneity ?? 5,
    },
    update: {
      sleepWeight: p.sleep ?? 15,
      careerWeight: p.career ?? 15,
      fitnessWeight: p.fitness ?? 10,
      relationshipsWeight: p.relationships ?? 12,
      socialWeight: p.social ?? 8,
      financeWeight: p.finance ?? 10,
      healthWeight: p.health ?? 10,
      productivityWeight: p.productivity ?? 10,
      convenienceWeight: p.convenience ?? 5,
      spontaneityWeight: p.spontaneity ?? 5,
    },
  });

  for (const a of AGENT_LIST) {
    const cfg = payload.agents[a.type] ?? {
      influence: a.defaultInfluence,
      veto: a.defaultVeto,
      aggression: a.defaultAggression,
    };
    await prisma.agentConfiguration.upsert({
      where: { userId_agentType: { userId, agentType: a.type } },
      create: {
        userId,
        agentType: a.type,
        influence: cfg.influence,
        vetoEnabled: cfg.veto,
        aggression: cfg.aggression,
        canTriggerAppeals: a.type === "career" || a.type === "productivity",
        canViewFinancials: a.type !== "chaos",
      },
      update: {
        influence: cfg.influence,
        vetoEnabled: cfg.veto,
        aggression: cfg.aggression,
      },
    });
  }

  for (const [provider, status] of Object.entries(payload.integrations)) {
    if (!status || status === "disconnected") continue;
    await prisma.integration.upsert({
      where: { userId_provider: { userId, provider } },
      create: { userId, provider, status, isMock: true },
      update: { status, lastSyncedAt: new Date() },
    });
  }

  redirect("/app");
}
