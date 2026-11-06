import type { Metadata } from "next";
import { EnquiryForm } from "@/components/enquiry/enquiry-form";
import { ContactDetails } from "@/components/public/contact-details";
import { MapEmbed } from "@/components/public/map-embed";
import { PageHeader } from "@/components/public/page-header";
import { DealerJsonLd } from "@/components/seo/dealer-json-ld";
import { getSiteSettings } from "@/lib/data/settings";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Call, WhatsApp or visit Jeevan Cars, or send us an enquiry and we'll call you back about any vehicle.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <DealerJsonLd />
      <PageHeader
        eyebrow="Contact"
        title="Let's find your next vehicle"
        description="Questions about a vehicle, finance, or selling your own? Call, message or send an enquiry — we'll get back to you quickly."
      />

      <div className="container-page grid gap-12 py-16 sm:py-20 lg:grid-cols-12 lg:gap-16">
        <div className="space-y-10 lg:col-span-5">
          <ContactDetails settings={settings} />
          <MapEmbed settings={settings} className="min-h-72" />
        </div>

        <section
          id="enquiry"
          aria-labelledby="enquiry-heading"
          className="scroll-mt-28 lg:col-span-7"
        >
          <div className="rounded-xl bg-surface p-6 ring-1 ring-ink/[0.07] sm:p-10">
            <h2 id="enquiry-heading" className="font-display text-2xl font-bold sm:text-3xl">
              Send an enquiry
            </h2>
            <p className="mt-2 mb-8 text-muted-foreground">
              Tell us what you&rsquo;re looking for — make, budget, year — and we&rsquo;ll call you
              back.
            </p>
            <EnquiryForm source="CONTACT_PAGE" />
          </div>
        </section>
      </div>
    </>
  );
}
