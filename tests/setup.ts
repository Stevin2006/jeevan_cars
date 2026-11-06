import { vi } from "vitest";
import { requestState } from "./helpers/request";

// Refuse to run against anything that isn't a dedicated test database —
// integration tests truncate every table.
if (!/_test(\?|$)/.test(process.env.DATABASE_URL ?? "")) {
  throw new Error(`Tests must use a *_test database, got: ${process.env.DATABASE_URL}`);
}

// Next.js cache APIs need the Next runtime; record calls instead.
vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  updateTag: vi.fn(),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

// Request-scoped APIs backed by an in-memory request per test.
vi.mock("next/headers", () => ({
  headers: async () => new Headers([...requestState.headers]),
  cookies: async () => ({
    get: (name: string) =>
      requestState.cookies.has(name) ? { name, value: requestState.cookies.get(name)! } : undefined,
    has: (name: string) => requestState.cookies.has(name),
    set: (name: string, value: string) => void requestState.cookies.set(name, value),
    delete: (name: string) => void requestState.cookies.delete(name),
  }),
}));
