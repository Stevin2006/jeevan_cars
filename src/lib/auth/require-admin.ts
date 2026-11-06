import "server-only";
import { redirect } from "next/navigation";
import { getSession, type SessionAdmin } from "@/lib/auth/session";

/**
 * The real authorization check. Every admin page, layout and Server Action
 * calls this; proxy.ts only does an optimistic cookie-presence redirect.
 */
export async function requireAdmin(): Promise<SessionAdmin> {
  const admin = await getSession();
  if (!admin) redirect("/admin/login");
  return admin;
}
