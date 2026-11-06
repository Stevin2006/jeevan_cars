/**
 * Creates the single administrator account from ADMIN_EMAIL / ADMIN_NAME /
 * ADMIN_PASSWORD. There is no public sign-up route; this is the only way in.
 *
 *   npm run admin:create            create the admin (refuses if one exists)
 *   npm run admin:create -- --reset reset the existing admin's password and
 *                                   sign out all of their sessions
 */
import "dotenv/config";
import { z } from "zod";
import { createPrismaClient } from "@/lib/db/create-client";
import { hashPassword, PASSWORD_MIN_LENGTH } from "@/lib/auth/password";

const inputSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is not set"),
  ADMIN_EMAIL: z.email().transform((email) => email.trim().toLowerCase()),
  ADMIN_NAME: z.string().trim().min(1, "ADMIN_NAME is required"),
  ADMIN_PASSWORD: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `ADMIN_PASSWORD must be at least ${PASSWORD_MIN_LENGTH} characters`),
});

async function main() {
  const parsed = inputSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join("\n"));
  }
  const { DATABASE_URL, ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD } = parsed.data;
  const reset = process.argv.includes("--reset");
  const prisma = createPrismaClient(DATABASE_URL);

  try {
    const existing = await prisma.admin.findFirst();
    const passwordHash = await hashPassword(ADMIN_PASSWORD);

    if (!existing) {
      await prisma.admin.create({
        data: { email: ADMIN_EMAIL, name: ADMIN_NAME, passwordHash },
      });
      console.log(`Admin created: ${ADMIN_EMAIL}`);
      return;
    }

    if (!reset) {
      throw new Error(
        `An admin already exists (${existing.email}). Use --reset to change their credentials.`,
      );
    }

    await prisma.$transaction([
      prisma.admin.update({
        where: { id: existing.id },
        data: { email: ADMIN_EMAIL, name: ADMIN_NAME, passwordHash },
      }),
      prisma.adminSession.deleteMany({ where: { adminId: existing.id } }),
    ]);
    console.log(`Admin credentials reset for ${ADMIN_EMAIL}; all sessions signed out.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
