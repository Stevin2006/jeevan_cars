import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { getSiteSettings } from "@/lib/data/settings";

export async function DealershipIntro() {
  const settings = await getSiteSettings();

  return (
    <section
      aria-labelledby="intro-heading"
      className="grain overflow-hidden bg-ink py-24 text-paper sm:py-32"
    >
      <div className="container-page grid gap-12 lg:grid-cols-12">
        <p className="flex items-center gap-3 label-caps text-amber lg:col-span-3">
          <span aria-hidden className="h-px w-6 bg-amber" />
          The dealership
        </p>

        <div className="lg:col-span-9">
          <Reveal>
            <h2
              id="intro-heading"
              className="font-display text-[clamp(1.75rem,4vw,3.25rem)] leading-[1.08] font-bold text-balance"
            >
              {settings.businessName} is a family-run dealership built on one idea:{" "}
              <span className="text-paper/45">
                every vehicle we sell should be one we&rsquo;d happily drive home ourselves.
              </span>
            </h2>
          </Reveal>

          <Reveal
            delay={0.1}
            className="mt-12 grid gap-10 border-t border-white/10 pt-10 sm:grid-cols-2"
          >
            <p className="leading-relaxed text-paper/70">
              From compact city cars to seven-seaters and commercial vehicles that keep businesses
              moving, we source, inspect and prepare every vehicle on our forecourt — and we tell
              you exactly what we know about it.
            </p>
            <div className="flex flex-col items-start justify-between gap-6">
              <p className="leading-relaxed text-paper/70">
                Come in for a test drive, bring your paperwork questions, or just browse. No
                pressure, ever.
              </p>
              <Link
                href="/about"
                className="group inline-flex items-center gap-2 text-sm font-medium text-amber"
              >
                More about us
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
