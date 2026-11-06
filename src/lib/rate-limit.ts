import "server-only";
import { prisma } from "@/lib/prisma";

export type RateLimitResult = { allowed: boolean; remaining: number; resetAt: Date };

/**
 * Fixed-window counter stored in Postgres so limits hold across serverless
 * instances. One atomic upsert per call; the window restarts once expired.
 */
export async function rateLimit(
  key: string,
  { limit, windowSeconds }: { limit: number; windowSeconds: number },
): Promise<RateLimitResult> {
  const [row] = await prisma.$queryRaw<{ count: number; expiresAt: Date }[]>`
    INSERT INTO "RateLimit" ("key", "count", "expiresAt")
    VALUES (${key}, 1, now() + make_interval(secs => ${windowSeconds}))
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."expiresAt" <= now() THEN 1 ELSE "RateLimit"."count" + 1 END,
      "expiresAt" = CASE
        WHEN "RateLimit"."expiresAt" <= now() THEN now() + make_interval(secs => ${windowSeconds})
        ELSE "RateLimit"."expiresAt"
      END
    RETURNING "count", "expiresAt"`;

  // Opportunistic cleanup of stale windows (~1% of calls).
  if (Math.random() < 0.01) {
    await prisma.rateLimit.deleteMany({
      where: { expiresAt: { lt: new Date(Date.now() - 86_400_000) } },
    });
  }

  const count = Number(row?.count ?? limit + 1);
  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt: row?.expiresAt ?? new Date(Date.now() + windowSeconds * 1000),
  };
}
