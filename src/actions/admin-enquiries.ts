"use server";

import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { ENQUIRY_STATUSES, enquiryUpdateSchema } from "@/lib/validations/enquiry";

export async function updateEnquiry(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = enquiryUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const { id, status, adminNotes, followUpAt } = parsed.data;
  const result = await prisma.enquiry.updateMany({
    where: { id },
    data: {
      status,
      adminNotes,
      // Stored at noon IST so the calendar date never shifts across time zones.
      followUpAt: followUpAt ? new Date(`${followUpAt}T12:00:00+05:30`) : null,
    },
  });
  if (result.count === 0) return { ok: false, error: "This enquiry no longer exists." };
  return { ok: true, data: undefined };
}

export async function setEnquiryStatus(id: string, status: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = z.enum(ENQUIRY_STATUSES).safeParse(status);
  if (!parsed.success) return { ok: false, error: "Invalid status." };
  const result = await prisma.enquiry.updateMany({ where: { id }, data: { status: parsed.data } });
  if (result.count === 0) return { ok: false, error: "This enquiry no longer exists." };
  return { ok: true, data: undefined };
}

export async function deleteEnquiry(id: string): Promise<ActionResult> {
  await requireAdmin();
  const result = await prisma.enquiry.deleteMany({ where: { id } });
  if (result.count === 0) return { ok: false, error: "This enquiry was already deleted." };
  return { ok: true, data: undefined };
}
