import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { EnquiryCta } from "@/components/home/enquiry-cta";
import { WhyChoose } from "@/components/home/why-choose";
import { Reveal } from "@/components/motion/reveal";
import { PageHeader } from "@/components/public/page-header";
import { SectionHeading } from "@/components/public/section-heading";
import { Button } from "@/components/ui/button";
import { getSiteSettings } from "@/lib/data/settings";
import { getInventoryStats } from "@/lib/data/vehicles";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Jeevan Cars is a family-run used vehicle dealership. Learn how we source, inspect and prepare every car and commercial vehicle we sell.",
  alternates: { canonical: "/about" },
};

const PROCESS = [
  {
    title: "Source",
    body: "We buy from private owners and trusted trade partners, and walk away from vehicles with unclear history or major accident damage.",
  },
  {
    title: "Inspect",
    body: "Each vehicle gets a thorough mechanical and body inspection, and we verify ownership, service records, insurance and loan clearance.",
  },
  {
    title: "Prepare",
    body: "Worn parts are replaced, fluids changed and the vehicle is professionally cleaned, so it's ready to drive from day one.",
  },
  {
    title: "Hand over",
    body: "We walk you through the vehicle and its documents, and take care of the RC transfer paperwork for you.",
  },
];

export default async function AboutPage() {
  const [settings, stats] = await Promise.all([getSiteSettings(), getInventoryStats()]);

  return (
    <>
      <PageHeader
        eyebrow="About us"
        title="A dealership built on straight answers"
        description={
          settings.tagline ??
          "Pre-owned cars and commercial vehicles, chosen carefully and sold honestly."
        }
      />

      <section className="py-20 sm:py-28">
        <div className="container-page grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="space-y-6 text-lg leading-relaxed text-ink/80 lg:col-span-7">
            <p className="font-display text-2xl leading-snug font-bold text-ink sm:text-3xl">
              Buying a used vehicle is a big decision. Our job is to make it a confident one.
            </p>
            <p>
              {settings.businessName} started with a simple belief: people deserve to know exactly
              what they&rsquo;re buying. So we describe every vehicle as it really is, show you its
              paperwork, and price it fairly for its condition.
            </p>
            <p>
              Today our forecourt carries everything from first cars and family seven-seaters to
              tempo travellers, pickups and mini trucks for working businesses. What hasn&rsquo;t
              changed is how we treat the people who buy from us — many of whom come back for their
              next vehicle, and send their friends and family too.
            </p>
            <Button asChild size="xl" className="mt-2">
              <Link href="/vehicles">
                Browse our stock
                <ArrowUpRight data-icon="inline-end" aria-hidden />
              </Link>
            </Button>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-5">
            <dl className="grain grid gap-px overflow-hidden rounded-xl bg-ink-3 text-paper">
              {[
                { label: "Vehicles in stock now", value: stats.inStock },
                { label: "Vehicle categories", value: stats.categories },
                { label: "Brands on the forecourt", value: stats.brands },
              ].map((stat) => (
                <div key={stat.label} className="flex items-end justify-between gap-6 bg-ink p-7">
                  <dt className="text-sm text-paper/60">{stat.label}</dt>
                  <dd className="tabular font-mono text-4xl text-paper">
                    {String(stat.value).padStart(2, "0")}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="process-heading" className="border-y bg-surface py-20 sm:py-28">
        <div className="container-page space-y-12">
          <SectionHeading
            eyebrow="Our process"
            title={<span id="process-heading">From forecourt to your driveway</span>}
            description="Every vehicle goes through the same four steps before it's offered for sale."
          />
          <ol className="grid gap-px overflow-hidden rounded-lg border bg-line sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map((step, index) => (
              <li key={step.title} className="bg-surface">
                <Reveal delay={index * 0.08} className="flex h-full flex-col gap-4 p-6 sm:p-7">
                  <span className="tabular font-mono text-sm text-brand-ink">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-xl font-bold">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <WhyChoose />
      <EnquiryCta />
    </>
  );
}
