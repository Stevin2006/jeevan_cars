import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { env } from "@/lib/env";

/**
 * The client IP as seen by our own proxy. Each proxy *appends* to
 * X-Forwarded-For, so everything left of the entries our proxies added is
 * client-controlled and spoofable. With TRUSTED_PROXY_HOPS proxies in front of
 * the app (1 for Vercel or a single nginx/Caddy), the real client address is
 * that many entries from the right.
 */
export function clientIpFromHeaders(
  forwardedFor: string | null,
  realIp: string | null,
  hops: number,
) {
  const chain = (forwardedFor ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return chain[chain.length - hops] ?? chain[0] ?? realIp ?? "unknown";
}

/** Client IP hashed with AUTH_SECRET, so abuse can be tracked without storing raw addresses. */
export async function getRequestMeta() {
  const headerList = await headers();
  const ip = clientIpFromHeaders(
    headerList.get("x-forwarded-for"),
    headerList.get("x-real-ip"),
    env.TRUSTED_PROXY_HOPS,
  );
  const ipHash = createHmac("sha256", env.AUTH_SECRET).update(ip).digest("hex");
  const userAgent = headerList.get("user-agent")?.slice(0, 300) ?? null;
  return { ipHash, userAgent };
}
