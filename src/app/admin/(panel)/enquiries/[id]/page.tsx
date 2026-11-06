import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MessageCircle, Phone } from "lucide-react";
import { EnquiryEditor } from "@/components/admin/enquiries/enquiry-editor";
import { AvailabilityStatusBadge, EnquiryStatusBadge } from "@/components/admin/status-badges";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getTelHref, getWhatsAppHref } from "@/lib/contact";
import { getEnquiry } from "@/lib/data/admin";
import { formatDateTime } from "@/lib/format-date";

export const metadata: Metadata = { title: "Enquiry" };

/** yyyy-mm-dd in India time, for <input type="date">. */
function toDateInput(date: Date | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(date);
}

export default async function EnquiryPage({ params }: PageProps<"/admin/enquiries/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const enquiry = await getEnquiry(id);
  if (!enquiry) notFound();

  const subject = enquiry.vehicleLabel ?? "your enquiry";
  const whatsappMessage = `Hi ${enquiry.name.split(" ")[0]}, this is Jeevan Cars replying about ${subject}.`;

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/admin/enquiries"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden /> All enquiries
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <section className="rounded-lg border bg-surface p-6">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl font-bold">{enquiry.name}</h1>
              <EnquiryStatusBadge status={enquiry.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Received {formatDateTime(enquiry.createdAt)} via the{" "}
              {enquiry.source === "VEHICLE_PAGE" ? "vehicle page" : "contact page"}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild>
                <a href={getTelHref(enquiry.phone)}>
                  <Phone data-icon="inline-start" aria-hidden /> Call {enquiry.phone}
                </a>
              </Button>
              <Button asChild variant="accent">
                <a
                  href={getWhatsAppHref(enquiry.phone, whatsappMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle data-icon="inline-start" aria-hidden /> WhatsApp
                </a>
              </Button>
              {enquiry.email && (
                <Button asChild variant="outline">
                  <a
                    href={`mailto:${enquiry.email}?subject=${encodeURIComponent(`Re: ${subject}`)}`}
                  >
                    <Mail data-icon="inline-start" aria-hidden /> {enquiry.email}
                  </a>
                </Button>
              )}
            </div>

            <h2 className="mt-8 mb-2 label-caps text-muted-foreground">Message</h2>
            <p className="leading-relaxed whitespace-pre-line">{enquiry.message}</p>
          </section>

          <section className="rounded-lg border bg-surface p-6">
            <h2 className="mb-3 label-caps text-muted-foreground">Vehicle</h2>
            {enquiry.vehicle ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link
                    href={`/admin/vehicles/${enquiry.vehicle.id}/edit`}
                    className="font-medium hover:underline"
                  >
                    {enquiry.vehicle.manufacturingYear} {enquiry.vehicle.name}
                  </Link>
                  <div className="mt-1">
                    <AvailabilityStatusBadge status={enquiry.vehicle.availability} />
                  </div>
                </div>
                {enquiry.vehicle.status === "PUBLISHED" && (
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={`/vehicles/${enquiry.vehicle.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View listing
                    </a>
                  </Button>
                )}
              </div>
            ) : enquiry.vehicleLabel ? (
              <p className="text-sm">
                {enquiry.vehicleLabel}{" "}
                <span className="text-muted-foreground">(listing since deleted)</span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                General enquiry — no specific vehicle.
              </p>
            )}
          </section>
        </div>

        <EnquiryEditor
          enquiry={{
            id: enquiry.id,
            name: enquiry.name,
            status: enquiry.status,
            adminNotes: enquiry.adminNotes,
            followUpDate: toDateInput(enquiry.followUpAt),
          }}
        />
      </div>
    </div>
  );
}
