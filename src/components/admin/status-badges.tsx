import type {
  AvailabilityStatus,
  EnquiryStatus,
  PublicationStatus,
} from "@/generated/prisma/enums";
import { AVAILABILITY_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";

const BASE =
  "inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-medium whitespace-nowrap";

export const ENQUIRY_STATUS_LABELS: Record<EnquiryStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  FOLLOW_UP: "Follow-up",
  CONVERTED: "Converted",
  CLOSED: "Closed",
};

const ENQUIRY_STYLES: Record<EnquiryStatus, string> = {
  NEW: "bg-amber/20 text-amber-ink",
  CONTACTED: "bg-sky-100 text-sky-800",
  FOLLOW_UP: "bg-violet-100 text-violet-800",
  CONVERTED: "bg-status-available/12 text-status-available",
  CLOSED: "bg-muted text-muted-foreground",
};

export function EnquiryStatusBadge({ status }: { status: EnquiryStatus }) {
  return <span className={cn(BASE, ENQUIRY_STYLES[status])}>{ENQUIRY_STATUS_LABELS[status]}</span>;
}

const AVAILABILITY_STYLES: Record<AvailabilityStatus, string> = {
  AVAILABLE: "bg-status-available/12 text-status-available",
  RESERVED: "bg-status-reserved/12 text-status-reserved",
  SOLD: "bg-status-sold/10 text-status-sold",
};

export function AvailabilityStatusBadge({ status }: { status: AvailabilityStatus }) {
  return (
    <span className={cn(BASE, AVAILABILITY_STYLES[status])}>{AVAILABILITY_LABELS[status]}</span>
  );
}

export function PublicationBadge({ status }: { status: PublicationStatus }) {
  return status === "PUBLISHED" ? (
    <span className={cn(BASE, "bg-ink text-paper")}>Published</span>
  ) : (
    <span className={cn(BASE, "border border-dashed border-ink/30 text-muted-foreground")}>
      Draft
    </span>
  );
}
