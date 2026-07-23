"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { DEMO_USER } from "@/lib/demo";

export interface AuthState {
  error?: string;
  ok?: boolean;
}

const loginSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

const registerSchema = z.object({
  name: z.string().min(1, "The Council requires a name."),
  email: z.string().email("Enter a valid email."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid submission." };
  }
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || !user.passwordHash) {
    return { error: "No account found. The Council has no record of you." };
  }
  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) return { error: "Incorrect password. Access to governance denied." };

  await createSession(user.id);
  redirect(user.onboardingCompleted ? "/app" : "/onboarding");
}

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid submission." };
  }
  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }
  const user = await prisma.user.create({
    data: {
      email,
      name: parsed.data.name,
      displayName: parsed.data.name.split(" ")[0],
      passwordHash: await hashPassword(parsed.data.password),
      onboardingCompleted: false,
      subscriptionPlan: "observer",
    },
  });
  await createSession(user.id);
  redirect("/onboarding");
}

export async function enterDemoAction(): Promise<void> {
  let user = await prisma.user.findUnique({ where: { email: DEMO_USER.email } });
  if (!user) {
    // Fallback if seed hasn't run — create a minimal demo account.
    user = await prisma.user.create({
      data: {
        email: DEMO_USER.email,
        name: DEMO_USER.name,
        displayName: DEMO_USER.displayName,
        passwordHash: await hashPassword(DEMO_USER.password),
        onboardingCompleted: true,
        isDemo: true,
        subscriptionPlan: "governed",
      },
    });
  }
  await createSession(user.id);
  redirect("/app");
}

export async function logoutAction(): Promise<void> {
  destroySession();
  redirect("/");
}
