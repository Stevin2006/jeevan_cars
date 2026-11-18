import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InventoryStats } from "@/lib/data/vehicles";

/** Staggered CSS entrance; `delay` in seconds. */
const enter = (delay: number) => ({ animationDelay: `${delay}s` });

function Readout({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="label-caps text-paper/45">{label}</span>
      <span className="tabular font-mono text-2xl text-paper sm:text-3xl">
        {String(value).padStart(3, "0")}
      </span>
    </div>
  );
}

export function HeroContent({ city, stats }: { city: string | null; stats: InventoryStats }) {
  return (
    <div className="relative container-page flex flex-1 flex-col justify-end pt-[calc(var(--nav-height)+3rem)] pb-10 sm:pb-14">
      <p
        className="mb-6 flex animate-hero-rise items-center gap-3 label-caps text-brand-bright"
        style={enter(0.1)}
      >
        <span aria-hidden className="h-px w-8 bg-brand-bright" />
        Pre-owned cars &amp; commercial vehicles{city ? ` · ${city}` : ""}
      </p>

      <h1
        id="hero-heading"
        className="font-display text-[clamp(2.75rem,8vw,6.5rem)] leading-[0.92] font-extrabold tracking-[-0.035em]"
      >
        <span className="block overflow-hidden pb-[0.06em]">
          <span className="block animate-hero-line" style={enter(0.15)}>
            Driven before.
          </span>
        </span>
        <span className="block overflow-hidden pb-[0.06em]">
          <span className="block animate-hero-line text-paper/55" style={enter(0.27)}>
            Ready for more<span className="text-brand-bright">.</span>
          </span>
        </span>
      </h1>

      <p
        className="mt-6 max-w-xl animate-hero-rise text-base leading-relaxed text-pretty text-paper/75 sm:text-lg"
        style={enter(0.35)}
      >
        Inspected hatchbacks, sedans, SUVs and working vehicles — honestly described, fairly priced,
        and ready for their next road.
      </p>

      <div className="mt-9 flex animate-hero-rise flex-wrap gap-3" style={enter(0.45)}>
        <Button asChild variant="accent" size="xl">
          <Link href="/vehicles">
            Explore vehicles
            <ArrowUpRight data-icon="inline-end" aria-hidden />
          </Link>
        </Button>
        <Button asChild variant="inverse" size="xl">
          <Link href="/contact">Contact us</Link>
        </Button>
      </div>

      <div
        className="mt-14 flex animate-hero-rise items-end justify-between gap-6 border-t border-white/15 pt-6"
        style={enter(0.55)}
      >
        <div className="flex gap-8 sm:gap-14">
          <Readout label="In stock" value={stats.inStock} />
          <Readout label="Categories" value={stats.categories} />
          <Readout label="Brands" value={stats.brands} />
        </div>
        <a
          href="#featured"
          className="hidden items-center gap-2 text-sm text-paper/60 transition-colors hover:text-paper sm:inline-flex"
        >
          Scroll to explore
          <ArrowDown className="size-4" aria-hidden />
        </a>
      </div>
    </div>
  );
}
