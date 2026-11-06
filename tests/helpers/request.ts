/** Fake request context read by the mocked `next/headers` (see tests/setup.ts). */
export const requestState = {
  headers: new Map<string, string>(),
  cookies: new Map<string, string>(),
};

export function resetRequest(ip = "203.0.113.10") {
  requestState.headers = new Map([
    ["x-forwarded-for", ip],
    ["user-agent", "vitest"],
  ]);
  requestState.cookies = new Map();
}

/** Asserts a Server Action / helper threw Next's redirect to `path`. */
export function isRedirectTo(error: unknown, path: string): boolean {
  const digest = (error as { digest?: string } | null)?.digest ?? "";
  return digest.startsWith("NEXT_REDIRECT") && digest.includes(path);
}
