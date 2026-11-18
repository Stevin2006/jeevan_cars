import Image from "next/image";
import Link from "next/link";
import badge from "@/assets/brand/jeevan-cars-badge.png";
import { cn } from "@/lib/utils";

const BADGE_SIZE = { sm: 32, md: 44, lg: 64 } as const;

/** The Jeevan Cars badge, sized for headers and footers. Decorative where a label is given. */
export function LogoBadge({
  size = "md",
  eager = false,
  className,
}: {
  size?: keyof typeof BADGE_SIZE;
  /** Load immediately (above-the-fold headers); otherwise lazy. */
  eager?: boolean;
  className?: string;
}) {
  const px = BADGE_SIZE[size];
  return (
    <Image
      src={badge}
      alt=""
      width={px}
      height={px}
      sizes={`${px}px`}
      loading={eager ? "eager" : "lazy"}
      className={cn("shrink-0 rounded-full", className)}
    />
  );
}

/**
 * Brand logo linking home: the badge plus a "JEEVAN CARS" wordmark, which
 * keeps the name legible at small sizes where the badge's own text isn't.
 */
export function Logo({
  className,
  tone = "dark",
  size = "md",
  wordmark = true,
  eager = false,
}: {
  className?: string;
  /** Wordmark colour for light ("dark" text) or dark ("light" text) backgrounds. */
  tone?: "dark" | "light";
  size?: keyof typeof BADGE_SIZE;
  wordmark?: boolean;
  eager?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label="Jeevan Cars — home"
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-full outline-offset-4",
        className,
      )}
    >
      <LogoBadge
        size={size}
        eager={eager}
        className="transition-transform duration-500 ease-out-quart group-hover:rotate-[-8deg]"
      />
      {wordmark && (
        <span
          aria-hidden
          className={cn(
            "flex flex-col leading-none transition-colors duration-500",
            tone === "light" ? "text-paper" : "text-ink",
          )}
        >
          <span
            className={cn(
              "font-display font-extrabold tracking-[-0.04em] uppercase",
              size === "lg" ? "text-2xl" : size === "md" ? "text-[1.15rem]" : "text-base",
            )}
          >
            Jeevan
          </span>
          <span
            className={cn(
              "mt-0.5 label-caps font-semibold",
              tone === "light" ? "text-brand-bright" : "text-brand-ink",
            )}
          >
            Cars
          </span>
        </span>
      )}
    </Link>
  );
}
