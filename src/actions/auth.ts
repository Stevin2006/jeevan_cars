"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSession, destroySession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getRequestMeta } from "@/lib/request-meta";
import { loginSchema, changePasswordSchema } from "@/lib/validations/auth";

// Verified when no admin matches, so response time doesn't reveal valid emails.
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= hashPassword(randomBytes(16).toString("hex")));

const GENERIC_LOGIN_ERROR = "That email and password combination isn't right.";

/** Only same-site admin paths are allowed as post-login destinations. */
function safeNext(next: unknown): string {
  return typeof next === "string" &&
    /^\/admin(\/[\w\-/?=&%.]*)?$/.test(next) &&
    !next.startsWith("//")
    ? next
    : "/admin/dashboard";
}

export async function login(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Enter your email and password.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const { email, password, next } = parsed.data;
  const meta = await getRequestMeta();

  const [byIp, byEmail] = await Promise.all([
    rateLimit(`login:ip:${meta.ipHash}`, { limit: 10, windowSeconds: 900 }),
    rateLimit(`login:email:${email}`, { limit: 5, windowSeconds: 900 }),
  ]);
  if (!byIp.allowed || !byEmail.allowed) {
    return { ok: false, error: "Too many sign-in attempts. Please wait 15 minutes and try again." };
  }

  const admin = await prisma.admin.findUnique({ where: { email } });
  const valid = await verifyPassword(admin?.passwordHash ?? (await getDummyHash()), password);
  if (!admin || !valid) return { ok: false, error: GENERIC_LOGIN_ERROR };

  await createSession(admin.id, meta);
  await prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  redirect(safeNext(next));
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}

export async function changePassword(input: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const limit = await rateLimit(`password:${admin.id}`, { limit: 5, windowSeconds: 900 });
  if (!limit.allowed) return { ok: false, error: "Too many attempts. Please try again later." };

  const record = await prisma.admin.findUniqueOrThrow({ where: { id: admin.id } });
  if (!(await verifyPassword(record.passwordHash, parsed.data.currentPassword))) {
    return {
      ok: false,
      error: "Your current password is incorrect.",
      fieldErrors: { currentPassword: ["Your current password is incorrect."] },
    };
  }

  // New hash, and sign out every other device.
  await prisma.$transaction([
    prisma.admin.update({
      where: { id: admin.id },
      data: { passwordHash: await hashPassword(parsed.data.newPassword) },
    }),
    prisma.adminSession.deleteMany({ where: { adminId: admin.id, id: { not: admin.sessionId } } }),
  ]);
  return { ok: true, data: undefined };
}
