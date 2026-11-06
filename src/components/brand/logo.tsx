import Link from "next/link";
import { cn } from "@/lib/utils";

/** Wordmark: expanded "JEEVAN" with an amber indicator and a mono "CARS". */
export function Logo({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <Link
      href="/"
      aria-label="Jeevan Cars — home"
      className={cn(
        "group inline-flex items-baseline gap-2 rounded-sm outline-offset-4 transition-colors duration-500",
        tone === "light" ? "text-paper" : "text-ink",
        className,
      )}
    >
      <span className="font-display text-[1.35rem] leading-none font-extrabold tracking-[-0.04em] uppercase">
        Jeevan
      </span>
      <span
        aria-hidden
        className="size-1.5 -translate-y-0.5 rounded-full bg-amber transition-transform duration-500 group-hover:scale-150"
      />
      <span className="label-caps leading-none font-medium opacity-80">Cars</span>
    </Link>
  );
}
