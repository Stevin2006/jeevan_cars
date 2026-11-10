import { Suspense } from "react";
import {
  AdminAccount,
  AdminAccountSkeleton,
  NewEnquiriesBadge,
} from "@/components/admin/admin-shell-data";
import { AdminShell } from "@/components/admin/admin-shell";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * The sidebar is a prerendered shell; the signed-in admin's details and the
 * new-enquiry count stream in. Access control lives in proxy.ts (no cookie)
 * and in requireAdmin() on every page and Server Action, not here.
 */
export default function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <TooltipProvider delayDuration={300}>
      <AdminShell
        account={
          <Suspense fallback={<AdminAccountSkeleton />}>
            <AdminAccount />
          </Suspense>
        }
        enquiryBadge={
          <Suspense fallback={null}>
            <NewEnquiriesBadge variant="pill" />
          </Suspense>
        }
        enquiryDot={
          <Suspense fallback={null}>
            <NewEnquiriesBadge variant="dot" />
          </Suspense>
        }
      >
        {children}
      </AdminShell>
    </TooltipProvider>
  );
}
