import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

/*
 * Database-backed admin sessions. The browser holds only a random 256-bit
 * token; the database stores its SHA-256 hash, so a leaked database can't be
 * replayed as a cookie. Sessions expire after 7 idle days or 30 days total.
 */

const IS_PRODUCTION = env.NODE_ENV === "production";
// __Host- binds the cookie to this exact host over HTTPS (production only).
export const SESSION_COOKIE = IS_PRODUCTION ? "__Host-jc_session" : "jc_session";

const IDLE_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000;
const ABSOLUTE_TIMEOUT_MS = 30 * 24 * 60 * 60 * 1000;
const TOUCH_INTERVAL_MS = 60 * 60 * 1000;

export type SessionAdmin = { id: string; email: string; name: string; sessionId: string };

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Creates a session and sets the cookie. Call only from Server Actions. */
export async function createSession(
  adminId: string,
  meta: { ipHash: string; userAgent: string | null },
) {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();

  // Housekeeping: drop sessions that can no longer be used.
  await prisma.adminSession.deleteMany({ where: { expiresAt: { lte: new Date(now) } } });

  await prisma.adminSession.create({
    data: {
      adminId,
      tokenHash: hashToken(token),
      expiresAt: new Date(now + IDLE_TIMEOUT_MS),
      ipAddress: meta.ipHash,
      userAgent: meta.userAgent,
    },
  });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
    maxAge: ABSOLUTE_TIMEOUT_MS / 1000,
  });
}

/**
 * Resolves the signed-in admin from the cookie, or null. Memoised per request.
 * Extends the idle timeout at most once an hour to keep writes rare.
 */
export const getSession = cache(async (): Promise<SessionAdmin | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      id: true,
      expiresAt: true,
      createdAt: true,
      lastSeenAt: true,
      admin: { select: { id: true, email: true, name: true } },
    },
  });
  if (!session) return null;

  const now = Date.now();
  const expired =
    session.expiresAt.getTime() <= now || session.createdAt.getTime() + ABSOLUTE_TIMEOUT_MS <= now;
  if (expired) {
    await prisma.adminSession.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  if (now - session.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
    await prisma.adminSession.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date(now), expiresAt: new Date(now + IDLE_TIMEOUT_MS) },
    });
  }

  return { ...session.admin, sessionId: session.id };
});

/** Deletes the current session row and cookie. Call only from Server Actions. */
export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.adminSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  cookieStore.delete(SESSION_COOKIE);
}
