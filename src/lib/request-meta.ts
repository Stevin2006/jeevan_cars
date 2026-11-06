import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { env } from "@/lib/env";

/**
 * Client IP (first X-Forwarded-For hop as set by the hosting proxy) hashed with
 * AUTH_SECRET, so abuse can be tracked without storing raw addresses.
 */
export async function getRequestMeta() {
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown";
  const ipHash = createHmac("sha256", env.AUTH_SECRET).update(ip).digest("hex");
  const userAgent = headerList.get("user-agent")?.slice(0, 300) ?? null;
  return { ipHash, userAgent };
}
