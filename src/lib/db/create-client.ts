import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Shared factory for the app (via `@/lib/prisma`) and CLI scripts (seed,
 * admin creation), which run outside Next.js and can't import `server-only`.
 */
export function createPrismaClient(connectionString: string) {
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export type DbClient = ReturnType<typeof createPrismaClient>;
