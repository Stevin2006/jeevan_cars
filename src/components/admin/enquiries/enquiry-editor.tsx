"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteEnquiry, updateEnquiry } from "@/actions/admin-enquiries";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ENQUIRY_STATUS_LABELS } from "@/components/admin/status-badges";
import { NativeSelect } from "@/components/catalogue/native-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EnquiryStatus } from "@/generated/prisma/enums";
import { enquiryUpdateSchema, type EnquiryUpdateInput } from "@/lib/validations/enquiry";

export function EnquiryEditor({
  enquiry,
}: {
  enquiry: {
    id: string;
    name: string;
    status: EnquiryStatus;
    adminNotes: string | null;
    followUpDate: string;
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const form = useForm<EnquiryUpdateInput>({
    resolver: zodResolver(enquiryUpdateSchema),
    defaultValues: {
      id: enquiry.id,
      status: enquiry.status,
      adminNotes: enquiry.adminNotes ?? "",
      followUpAt: enquiry.followUpDate,
    },
  });
  const { errors, isDirty } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await updateEnquiry(values);
      if (!result.ok) return void toast.error(result.error);
      toast.success("Enquiry updated");
      form.reset(values);
      router.refresh();
    });
  });

  function remove() {
    startTransition(async () => {
      const result = await deleteEnquiry(enquiry.id);
      if (!result.ok) return void toast.error(result.error);
      toast.success("Enquiry deleted");
      router.push("/admin/enquiries");
    });
  }

  return (
    <>
      <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-lg border bg-surface p-5">
        <h2 className="font-semibold">Manage</h2>
        <div className="space-y-1.5">
          <Label htmlFor="enquiry-status">Status</Label>
          <NativeSelect id="enquiry-status" {...form.register("status")}>
            {Object.entries(ENQUIRY_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="enquiry-follow-up">Follow-up date</Label>
          <Input id="enquiry-follow-up" type="date" {...form.register("followUpAt")} />
          {errors.followUpAt && (
            <p className="text-[0.8125rem] text-destructive">{errors.followUpAt.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="enquiry-notes">Notes</Label>
          <Textarea
            id="enquiry-notes"
            rows={6}
            placeholder="Call outcome, test drive booked, budget…"
            {...form.register("adminNotes")}
          />
          <p className="text-xs text-muted-foreground">Private — only visible here.</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button type="submit" disabled={isPending || !isDirty}>
            {isPending && <Loader2 className="animate-spin" data-icon="inline-start" aria-hidden />}
            Save
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 data-icon="inline-start" aria-hidden />
            Delete
          </Button>
        </div>
      </form>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete the enquiry from ${enquiry.name}?`}
        description="Use this for spam or duplicates. The enquiry and your notes are removed permanently."
        confirmLabel="Delete enquiry"
        pending={isPending}
        onConfirm={remove}
      />
    </>
  );
}
