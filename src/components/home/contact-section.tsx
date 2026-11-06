import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ContactDetails } from "@/components/public/contact-details";
import { MapEmbed } from "@/components/public/map-embed";
import { SectionHeading } from "@/components/public/section-heading";
import { getSiteSettings } from "@/lib/data/settings";

export async function ContactSection() {
  const settings = await getSiteSettings();

  return (
    <section aria-labelledby="contact-heading" className="py-20 sm:py-28">
      <div className="container-page grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="space-y-10 lg:col-span-5">
          <SectionHeading
            eyebrow="Find us"
            title={<span id="contact-heading">Come and see them in person</span>}
            description="Photos only tell part of the story. Visit for a walk-around and a test drive."
          />
          <ContactDetails settings={settings} />
          <Link
            href="/contact"
            className="group inline-flex items-center gap-2 text-sm font-medium"
          >
            All contact options
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-1"
              aria-hidden
            />
          </Link>
        </div>
        <div className="lg:col-span-7">
          <MapEmbed settings={settings} className="h-full min-h-80" />
        </div>
      </div>
    </section>
  );
}
