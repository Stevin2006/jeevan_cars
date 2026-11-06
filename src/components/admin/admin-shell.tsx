"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Dialog } from "radix-ui";
import {
  Car,
  ExternalLink,
  FolderTree,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Tags,
  X,
} from "lucide-react";
import { logout } from "@/actions/auth";
import { Logo } from "@/components/brand/logo";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useStoredFlag } from "@/hooks/use-stored-flag";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/vehicles", label: "Vehicles", icon: Car },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/brands", label: "Brands", icon: Tags },
  { href: "/admin/enquiries", label: "Enquiries", icon: Inbox },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

const COLLAPSE_KEY = "jc-admin-sidebar-collapsed";

type ShellProps = {
  admin: { name: string; email: string };
  newEnquiries: number;
  children: React.ReactNode;
};

function NavList({
  pathname,
  collapsed,
  newEnquiries,
  onNavigate,
}: {
  pathname: string;
  collapsed: boolean;
  newEnquiries: number;
  onNavigate?: () => void;
}) {
  return (
    <ul className="space-y-1">
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const badge = item.href === "/admin/enquiries" && newEnquiries > 0 ? newEnquiries : null;
        const link = (
          <Link
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            aria-label={collapsed ? item.label : undefined}
            className={cn(
              "relative flex h-9 items-center gap-3 rounded-md px-2.5 text-sm font-medium transition-colors",
              active ? "bg-ink text-paper" : "text-ink/70 hover:bg-muted hover:text-ink",
              collapsed && "justify-center px-0",
            )}
          >
            <item.icon className="size-4 shrink-0" aria-hidden />
            {!collapsed && <span className="truncate">{item.label}</span>}
            {badge !== null &&
              (collapsed ? (
                <span
                  className="absolute top-1.5 right-1.5 size-2 rounded-full bg-amber"
                  aria-label={`${badge} new`}
                />
              ) : (
                <span className="tabular ml-auto rounded-full bg-amber px-1.5 font-mono text-[0.6875rem] leading-5 text-ink">
                  {badge}
                </span>
              ))}
          </Link>
        );
        return (
          <li key={item.href}>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ) : (
              link
            )}
          </li>
        );
      })}
    </ul>
  );
}

function AccountFooter({ admin, collapsed }: { admin: ShellProps["admin"]; collapsed: boolean }) {
  return (
    <div className={cn("space-y-1 border-t pt-3", collapsed && "flex flex-col items-center")}>
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "flex h-9 items-center gap-3 rounded-md px-2.5 text-sm text-ink/70 hover:bg-muted hover:text-ink",
          collapsed && "w-9 justify-center px-0",
        )}
        aria-label="View website (opens in a new tab)"
      >
        <ExternalLink className="size-4 shrink-0" aria-hidden />
        {!collapsed && "View website"}
      </a>
      <form action={logout}>
        <button
          type="submit"
          className={cn(
            "flex h-9 w-full items-center gap-3 rounded-md px-2.5 text-sm text-ink/70 hover:bg-muted hover:text-ink",
            collapsed && "w-9 justify-center px-0",
          )}
          aria-label="Sign out"
        >
          <LogOut className="size-4 shrink-0" aria-hidden />
          {!collapsed && "Sign out"}
        </button>
      </form>
      {!collapsed && (
        <div className="px-2.5 pt-2">
          <p className="truncate text-sm font-medium">{admin.name}</p>
          <p className="truncate text-xs text-muted-foreground">{admin.email}</p>
        </div>
      )}
    </div>
  );
}

export function AdminShell({ admin, newEnquiries, children }: ShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useStoredFlag(COLLAPSE_KEY);
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleCollapsed = () => setCollapsed(!collapsed);

  return (
    <div className="flex min-h-svh flex-1">
      <motion.aside
        className="sticky top-0 hidden h-svh shrink-0 flex-col border-r bg-surface p-3 lg:flex"
        animate={{ width: collapsed ? 64 : 240 }}
        initial={false}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
      >
        <div
          className={cn(
            "flex h-12 items-center",
            collapsed ? "justify-center" : "justify-between px-1.5",
          )}
        >
          {!collapsed && <Logo className="[&>span:first-child]:text-lg" />}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-ink"
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </button>
        </div>
        <nav aria-label="Admin" className="mt-4 flex-1 overflow-y-auto">
          <NavList pathname={pathname} collapsed={collapsed} newEnquiries={newEnquiries} />
        </nav>
        <AccountFooter admin={admin} collapsed={collapsed} />
      </motion.aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-surface/90 px-4 backdrop-blur lg:hidden">
          <Logo className="[&>span:first-child]:text-lg" />
          <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                aria-label="Open admin menu"
                className="flex size-9 items-center justify-center rounded-md hover:bg-muted"
              >
                <Menu className="size-5" />
              </button>
            </Dialog.Trigger>
            <AnimatePresence>
              {mobileOpen && (
                <Dialog.Portal forceMount>
                  <Dialog.Overlay asChild forceMount>
                    <motion.div
                      className="fixed inset-0 z-50 bg-ink/40 lg:hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />
                  </Dialog.Overlay>
                  <Dialog.Content asChild forceMount aria-describedby={undefined}>
                    <motion.div
                      className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-surface p-3 shadow-xl lg:hidden"
                      initial={{ x: "-100%" }}
                      animate={{ x: 0 }}
                      exit={{ x: "-100%" }}
                      transition={{ type: "spring", stiffness: 420, damping: 42 }}
                    >
                      <Dialog.Title className="sr-only">Admin menu</Dialog.Title>
                      <div className="flex h-12 items-center justify-between px-1.5">
                        <Logo className="[&>span:first-child]:text-lg" />
                        <Dialog.Close
                          aria-label="Close admin menu"
                          className="flex size-8 items-center justify-center rounded-md hover:bg-muted"
                        >
                          <X className="size-4" />
                        </Dialog.Close>
                      </div>
                      <nav aria-label="Admin" className="mt-4 flex-1 overflow-y-auto">
                        <NavList
                          pathname={pathname}
                          collapsed={false}
                          newEnquiries={newEnquiries}
                          onNavigate={() => setMobileOpen(false)}
                        />
                      </nav>
                      <AccountFooter admin={admin} collapsed={false} />
                    </motion.div>
                  </Dialog.Content>
                </Dialog.Portal>
              )}
            </AnimatePresence>
          </Dialog.Root>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
