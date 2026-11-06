/**
 * Creates the single administrator account from ADMIN_EMAIL / ADMIN_NAME /
 * ADMIN_PASSWORD. There is no public sign-up route; this is the only way in.
 *
 *   npm run admin:create            create the admin (refuses if one exists)
 *   npm run admin:create -- --reset reset the existing admin's password and
 *                                   sign out all of their sessions
 *   --interactive                   ask for email, name and password instead of
 *                                   reading ADMIN_* (use for production)
 */
import "dotenv/config";
import { createInterface } from "node:readline/promises";
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

/** Prompts on the terminal; `secret` answers are not echoed. */
async function ask(question: string, secret = false): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  if (secret) {
    const write = (rl as unknown as { _writeToOutput: (text: string) => void })._writeToOutput;
    (rl as unknown as { _writeToOutput: (text: string) => void })._writeToOutput = (text) =>
      write.call(rl, text.startsWith(question) ? text : "");
  }
  const answer = await rl.question(question);
  rl.close();
  if (secret) process.stdout.write("\n");
  return secret ? answer : answer.trim();
}

async function readInput() {
  if (!process.argv.includes("--interactive")) return process.env;
  if (!process.stdin.isTTY) throw new Error("--interactive needs a terminal");
  const email = await ask("Admin email: ");
  const name = await ask("Admin name: ");
  const password = await ask(`Password (min ${PASSWORD_MIN_LENGTH} characters): `, true);
  if ((await ask("Repeat password: ", true)) !== password) throw new Error("Passwords don't match");
  return {
    DATABASE_URL: process.env.DATABASE_URL,
    ADMIN_EMAIL: email,
    ADMIN_NAME: name,
    ADMIN_PASSWORD: password,
  };
}

async function main() {
  const parsed = inputSchema.safeParse(await readInput());
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
