"use server";

import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getRequestMeta } from "@/lib/request-meta";
import { enquirySubmissionSchema, normalizeIndianMobile } from "@/lib/validations/enquiry";

const MIN_FILL_TIME_MS = 2_500;

/** Public enquiry submission from vehicle pages and the contact page. */
export async function submitEnquiry(input: unknown): Promise<ActionResult> {
  const parsed = enquirySubmissionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const submission = parsed.data;

  // Bots that fill the hidden field get a convincing success and no record.
  if (submission.website) return { ok: true, data: undefined };

  if (submission.elapsedMs < MIN_FILL_TIME_MS) {
    return { ok: false, error: "That was quick! Please wait a moment and send again." };
  }

  const { ipHash, userAgent } = await getRequestMeta();
  const limit = await rateLimit(`enquiry:${ipHash}`, { limit: 5, windowSeconds: 600 });
  if (!limit.allowed) {
    return {
      ok: false,
      error:
        "You've sent several enquiries in a short time. Please try again in a few minutes, or call us directly.",
    };
  }

  // Only link enquiries to vehicles the public can actually see.
  const vehicle = submission.vehicleId
    ? await prisma.vehicle.findFirst({
        where: { id: submission.vehicleId, status: "PUBLISHED" },
        select: { id: true, name: true, manufacturingYear: true },
      })
    : null;

  try {
    await prisma.enquiry.create({
      data: {
        name: submission.name,
        phone: normalizeIndianMobile(submission.phone)!,
        email: submission.email || null,
        message: submission.message,
        source: submission.source,
        vehicleId: vehicle?.id ?? null,
        vehicleLabel: vehicle ? `${vehicle.manufacturingYear} ${vehicle.name}` : null,
        ipHash,
        userAgent,
      },
    });
  } catch (error) {
    console.error("[enquiry] failed to save", error);
    return {
      ok: false,
      error: "We couldn't send your enquiry just now. Please try again, or call us directly.",
    };
  }

  return { ok: true, data: undefined };
}
