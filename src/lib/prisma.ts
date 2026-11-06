import "server-only";
import { env } from "@/lib/env";
import { createPrismaClient, type DbClient } from "@/lib/db/create-client";

// Reuse one client across hot reloads in development.
const globalForPrisma = globalThis as unknown as { prisma?: DbClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient(env.DATABASE_URL);

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
