"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { ArrowUpRight, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { NAV_LINKS, isActivePath } from "@/components/layout/nav-links";
import { Button } from "@/components/ui/button";
import { getTelHref } from "@/lib/contact";
import { cn } from "@/lib/utils";

export type NavbarContact = { phone: string | null; whatsappNumber: string | null };

/** Reads the route; must sit inside <Suspense> so dynamic routes can still prerender. */
export function RouteAwareNavbar({ contact }: { contact: NavbarContact }) {
  return <Navbar contact={contact} pathname={usePathname()} />;
}

/**
 * Transparent over the homepage hero; once the page scrolls it condenses into
 * a floating, frosted bar inset from the viewport edges. `pathname` is null in
 * the prerendered fallback, where no link is marked active.
 */
export function Navbar({ contact, pathname }: { contact: NavbarContact; pathname: string | null }) {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  const overHero = pathname === "/" && !scrolled;
  const activeHref = pathname
    ? NAV_LINKS.find((link) => isActivePath(pathname, link.href))?.href
    : undefined;
  const indicatorHref = hovered ?? activeHref;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[padding] duration-500 ease-out-quart",
        scrolled ? "px-2 pt-2 sm:px-4 sm:pt-3" : "px-0 pt-0",
      )}
    >
      <div
        className={cn(
          "mx-auto flex h-[var(--nav-height)] items-center gap-6 border transition-[max-width,background-color,border-color,border-radius,box-shadow,padding] duration-500 ease-out-quart",
          scrolled
            ? "max-w-6xl rounded-xl border-ink/[0.08] bg-surface/85 px-4 shadow-[0_12px_32px_-20px_rgba(15,18,22,0.35)] backdrop-blur-xl backdrop-saturate-150 sm:px-5"
            : cn(
                "max-w-[100rem] rounded-none border-transparent px-4 sm:px-6 lg:px-8",
                !overHero && "border-b-line bg-paper",
              ),
        )}
      >
        <Logo tone={overHero ? "light" : "dark"} className="shrink-0" eager />

        <nav aria-label="Main" className="mx-auto hidden md:block">
          <ul className="flex items-center gap-1" onMouseLeave={() => setHovered(null)}>
            {NAV_LINKS.map((link) => {
              const active = link.href === activeHref;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    onMouseEnter={() => setHovered(link.href)}
                    onFocus={() => setHovered(link.href)}
                    onBlur={() => setHovered(null)}
                    className={cn(
                      "relative block rounded-sm px-3.5 py-2 text-sm font-medium transition-colors",
                      overHero
                        ? active
                          ? "text-paper"
                          : "text-paper/70 hover:text-paper"
                        : active
                          ? "text-ink"
                          : "text-ink/60 hover:text-ink",
                    )}
                  >
                    {link.label}
                    {indicatorHref === link.href && (
                      <motion.span
                        layoutId="nav-indicator"
                        aria-hidden
                        className={cn(
                          "absolute inset-x-3.5 -bottom-px h-0.5 rounded-full",
                          active ? "bg-brand" : overHero ? "bg-paper/40" : "bg-ink/20",
                        )}
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {contact.phone && (
            <a
              href={getTelHref(contact.phone)}
              className={cn(
                "tabular hidden items-center gap-2 rounded-sm px-2 py-2 text-sm font-medium transition-colors lg:inline-flex",
                overHero ? "text-paper/80 hover:text-paper" : "text-ink/70 hover:text-ink",
              )}
            >
              <Phone className="size-4" aria-hidden />
              {contact.phone}
            </a>
          )}
          <Button asChild variant="accent" size="lg" className="hidden px-4 sm:inline-flex">
            <Link href="/vehicles">
              Explore vehicles
              <ArrowUpRight data-icon="inline-end" aria-hidden />
            </Link>
          </Button>
          <MobileMenu
            contact={contact}
            pathname={pathname ?? ""}
            tone={overHero ? "light" : "dark"}
          />
        </div>
      </div>
    </header>
  );
}
