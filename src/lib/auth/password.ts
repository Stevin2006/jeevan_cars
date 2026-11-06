import { hash, verify } from "@node-rs/argon2";

// Argon2id with OWASP-recommended minimums (19 MiB memory, 2 iterations).
const ARGON2_OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

export { PASSWORD_MIN_LENGTH } from "@/lib/validations/auth";

export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}
