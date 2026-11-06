import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

/** Liveness + database connectivity probe for uptime monitors and deploys. */
export async function GET() {
  await connection();
  const startedAt = performance.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json(
      { status: "ok", database: "up", latencyMs: Math.round(performance.now() - startedAt) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[health] database check failed", error);
    return Response.json(
      { status: "error", database: "down" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
