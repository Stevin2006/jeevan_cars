import Link from "next/link";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSiteSettings } from "@/lib/data/settings";
import { getWhatsAppHref } from "@/lib/contact";

export async function EnquiryCta() {
  const { whatsappNumber } = await getSiteSettings();

  return (
    <section aria-labelledby="cta-heading" className="grain bg-brand text-white">
      <div className="container-page flex flex-col gap-8 py-16 sm:py-20 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl space-y-4">
          <h2
            id="cta-heading"
            className="font-display text-3xl leading-[1.05] font-extrabold text-balance sm:text-4xl"
          >
            Can&rsquo;t see the vehicle you&rsquo;re after?
          </h2>
          <p className="text-lg text-white/85">
            Tell us the make, budget and year you have in mind. New stock arrives every week, and
            we&rsquo;ll let you know the moment a match comes in.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="xl">
            <Link href="/contact#enquiry">
              Send an enquiry
              <ArrowUpRight data-icon="inline-end" aria-hidden />
            </Link>
          </Button>
          {whatsappNumber && (
            <Button
              asChild
              size="xl"
              variant="outline"
              className="border-white/45 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <a
                href={getWhatsAppHref(
                  whatsappNumber,
                  "Hi Jeevan Cars, I'm looking for a vehicle. Can you help?",
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle data-icon="inline-start" aria-hidden />
                Chat on WhatsApp
              </a>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
