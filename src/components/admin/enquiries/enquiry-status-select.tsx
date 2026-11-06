"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { setEnquiryStatus } from "@/actions/admin-enquiries";
import { ENQUIRY_STATUS_LABELS } from "@/components/admin/status-badges";
import { NativeSelect } from "@/components/catalogue/native-select";
import type { EnquiryStatus } from "@/generated/prisma/enums";

/** Inline status change from the enquiries table. */
export function EnquiryStatusSelect({
  id,
  status,
  name,
}: {
  id: string;
  status: EnquiryStatus;
  name: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <NativeSelect
      aria-label={`Status for ${name}`}
      defaultValue={status}
      disabled={isPending}
      className="w-36"
      onChange={(event) => {
        const next = event.target.value;
        startTransition(async () => {
          const result = await setEnquiryStatus(id, next);
          if (!result.ok) return void toast.error(result.error);
          toast.success(`Marked as ${ENQUIRY_STATUS_LABELS[next as EnquiryStatus].toLowerCase()}`);
          router.refresh();
        });
      }}
    >
      {Object.entries(ENQUIRY_STATUS_LABELS).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </NativeSelect>
  );
}
