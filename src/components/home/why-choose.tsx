import { ClipboardCheck, FileCheck2, HandCoins, Wrench } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/public/section-heading";

const REASONS = [
  {
    icon: ClipboardCheck,
    title: "Inspected before it's listed",
    body: "Engine, gearbox, suspension, electricals and bodywork are checked before a vehicle reaches the forecourt. If we wouldn't drive it, we don't sell it.",
  },
  {
    icon: FileCheck2,
    title: "Clear history and paperwork",
    body: "Ownership, service records and insurance are verified up front, and we handle the RC transfer so the handover is simple.",
  },
  {
    icon: HandCoins,
    title: "Honest, upfront pricing",
    body: "Prices reflect the real condition of each vehicle. Where a price isn't listed, one call gets you a straight answer.",
  },
  {
    icon: Wrench,
    title: "Here after the sale",
    body: "Questions after you drive away? We're a phone call away for help with servicing, documents and anything else you need.",
  },
];

export function WhyChoose() {
  return (
    <section aria-labelledby="why-heading" className="py-20 sm:py-28">
      <div className="container-page grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <SectionHeading
              eyebrow="Why Jeevan Cars"
              title={<span id="why-heading">A used car, bought the way it should be</span>}
              description="Buying pre-owned shouldn't feel like a gamble. Here's what you can expect from us on every vehicle."
            />
          </div>
        </div>

        <ul className="grid gap-px overflow-hidden rounded-lg border bg-line sm:grid-cols-2 lg:col-span-7">
          {REASONS.map((reason, index) => (
            <li key={reason.title} className="bg-paper">
              <Reveal delay={index * 0.06} className="flex h-full flex-col gap-5 p-6 sm:p-8">
                <span className="flex size-11 items-center justify-center rounded-md bg-ink text-brand-bright">
                  <reason.icon className="size-5" strokeWidth={1.75} aria-hidden />
                </span>
                <h3 className="font-display text-lg leading-snug font-bold">{reason.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{reason.body}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
