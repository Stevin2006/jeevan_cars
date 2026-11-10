import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

/*
 * The request-time parts of the admin shell. Each is rendered inside
 * <Suspense> by the panel layout, so the sidebar itself prerenders and
 * navigation stays instant. Every page also calls requireAdmin() itself.
 */

export async function AdminAccount() {
  const admin = await requireAdmin();
  return (
    <div className="px-2.5 pt-2">
      <p className="truncate text-sm font-medium">{admin.name}</p>
      <p className="truncate text-xs text-muted-foreground">{admin.email}</p>
    </div>
  );
}

export function AdminAccountSkeleton() {
  return (
    <div className="space-y-1.5 px-2.5 pt-2" aria-hidden>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-3 w-36" />
    </div>
  );
}

export async function NewEnquiriesBadge({ variant }: { variant: "pill" | "dot" }) {
  await requireAdmin();
  const count = await prisma.enquiry.count({ where: { status: "NEW" } });
  if (count === 0) return null;

  return variant === "dot" ? (
    <span
      className="absolute top-1.5 right-1.5 size-2 rounded-full bg-amber"
      aria-label={`${count} new`}
    />
  ) : (
    <span className="tabular ml-auto rounded-full bg-amber px-1.5 font-mono text-[0.6875rem] leading-5 text-ink">
      {count}
    </span>
  );
}
