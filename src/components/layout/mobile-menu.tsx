"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Dialog } from "radix-ui";
import { ArrowUpRight, Menu, MessageCircle, Phone, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { NAV_LINKS, isActivePath } from "@/components/layout/nav-links";
import type { NavbarContact } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { getTelHref, getWhatsAppHref } from "@/lib/contact";
import { cn } from "@/lib/utils";

const EASE = [0.25, 1, 0.5, 1] as const;

/** Full-screen menu built on Radix Dialog for focus trapping, Esc and scroll lock. */
export function MobileMenu({
  contact,
  pathname,
  tone,
}: {
  contact: NavbarContact;
  pathname: string;
  tone: "light" | "dark";
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className={cn(
            "inline-flex size-10 items-center justify-center rounded-md transition-colors md:hidden",
            tone === "light" ? "text-paper hover:bg-white/10" : "text-ink hover:bg-ink/5",
          )}
        >
          <Menu className="size-5" aria-hidden />
        </button>
      </Dialog.Trigger>

      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                className="fixed inset-0 z-[60] flex flex-col bg-paper md:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={{ duration: 0.25 }}
              >
                <Dialog.Title className="sr-only">Menu</Dialog.Title>
                <div className="flex h-[var(--nav-height)] items-center justify-between px-4">
                  <Logo />
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      aria-label="Close menu"
                      className="inline-flex size-10 items-center justify-center rounded-md border border-line bg-surface text-ink"
                    >
                      <X className="size-5" aria-hidden />
                    </button>
                  </Dialog.Close>
                </div>

                <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-4 pt-6">
                  <ul>
                    {NAV_LINKS.map((link, index) => {
                      const active = isActivePath(pathname, link.href);
                      return (
                        <motion.li
                          key={link.href}
                          className="border-b border-line"
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.45, delay: 0.06 + index * 0.05, ease: EASE }}
                        >
                          <Link
                            href={link.href}
                            onClick={() => setOpen(false)}
                            aria-current={active ? "page" : undefined}
                            className="flex items-center justify-between py-4 font-display text-[1.75rem] leading-none font-bold"
                          >
                            <span className={active ? "text-ink" : "text-ink/70"}>
                              {link.label}
                            </span>
                            {active && (
                              <span aria-hidden className="size-2 rounded-full bg-amber" />
                            )}
                          </Link>
                        </motion.li>
                      );
                    })}
                  </ul>
                </nav>

                <motion.div
                  className="grid gap-2 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.3, ease: EASE }}
                >
                  <Button asChild variant="accent" size="xl">
                    <Link href="/vehicles" onClick={() => setOpen(false)}>
                      Explore vehicles
                      <ArrowUpRight data-icon="inline-end" aria-hidden />
                    </Link>
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    {contact.phone && (
                      <Button asChild variant="outline" size="xl">
                        <a href={getTelHref(contact.phone)}>
                          <Phone data-icon="inline-start" aria-hidden />
                          Call
                        </a>
                      </Button>
                    )}
                    {contact.whatsappNumber && (
                      <Button asChild variant="outline" size="xl">
                        <a
                          href={getWhatsAppHref(contact.whatsappNumber)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle data-icon="inline-start" aria-hidden />
                          WhatsApp
                        </a>
                      </Button>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
