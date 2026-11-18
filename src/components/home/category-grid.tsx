import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/public/section-heading";
import { getCategoriesWithCounts } from "@/lib/data/taxonomy";

export async function CategoryGrid() {
  const categories = (await getCategoriesWithCounts()).filter((c) => c.vehicleCount > 0);
  if (categories.length === 0) return null;

  return (
    <section aria-labelledby="categories-heading" className="bg-surface py-20 sm:py-28">
      <div className="container-page">
        <SectionHeading
          eyebrow="Browse by type"
          title={<span id="categories-heading">From city hatchbacks to working trucks</span>}
          description="Whether it's the family's first car or the next addition to your fleet, start with the kind of vehicle you need."
        />

        <Reveal className="mt-12">
          <ul className="grid overflow-hidden rounded-lg border-t border-l sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <li key={category.id} className="border-r border-b">
                <Link
                  href={`/vehicles?category=${category.slug}`}
                  className="group relative flex h-full min-h-40 flex-col justify-between gap-6 p-6 transition-colors duration-300 hover:bg-ink focus-visible:bg-ink focus-visible:outline-none sm:p-7"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-display text-xl font-bold text-ink transition-colors group-hover:text-paper group-focus-visible:text-paper">
                      {category.name}
                    </h3>
                    <ArrowUpRight
                      className="size-5 shrink-0 text-steel transition-[color,translate] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-bright"
                      aria-hidden
                    />
                  </div>
                  <div className="flex items-end justify-between gap-4">
                    {category.description && (
                      <p className="line-clamp-2 max-w-[22ch] text-sm text-muted-foreground transition-colors group-hover:text-paper/60">
                        {category.description}
                      </p>
                    )}
                    <p className="tabular ml-auto text-right font-mono text-sm text-ink transition-colors group-hover:text-brand-bright">
                      {String(category.vehicleCount).padStart(2, "0")}
                      <span className="ml-1.5 label-caps text-muted-foreground group-hover:text-paper/50">
                        {category.vehicleCount === 1 ? "vehicle" : "vehicles"}
                      </span>
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
