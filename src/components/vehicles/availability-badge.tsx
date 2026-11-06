import type { AvailabilityStatus } from "@/generated/prisma/enums";
import { AVAILABILITY_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";

const DOT: Record<AvailabilityStatus, string> = {
  AVAILABLE: "bg-status-available",
  RESERVED: "bg-status-reserved",
  SOLD: "bg-status-sold",
};

export function AvailabilityBadge({
  status,
  className,
}: {
  status: AvailabilityStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm bg-surface/95 px-2 py-1 text-xs font-medium text-ink shadow-sm ring-1 ring-ink/5 backdrop-blur",
        className,
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", DOT[status])} />
      {AVAILABILITY_LABELS[status]}
    </span>
  );
}
