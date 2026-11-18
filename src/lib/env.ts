import "server-only";
import { z } from "zod";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]"]);

function isLocalUrl(url: string): boolean {
  try {
    return LOCAL_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

export const serverEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
    NEXT_PUBLIC_SITE_URL: z.url().transform((url) => url.replace(/\/+$/, "")),
    AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
    /** Reverse proxies in front of the app that append to X-Forwarded-For. */
    TRUSTED_PROXY_HOPS: z.coerce.number().int().min(1).max(5).default(1),
    /** Set to "1" by Vercel on its build machines and functions. */
    VERCEL: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    // Values copied from a local .env are the most common Vercel misconfiguration:
    // fail with a clear message instead of a wall of "can't reach 127.0.0.1" errors.
    if (env.VERCEL) {
      if (isLocalUrl(env.DATABASE_URL)) {
        ctx.addIssue({
          code: "custom",
          path: ["DATABASE_URL"],
          message:
            "points to localhost, which doesn't exist on Vercel. Use the Neon pooled URL (the one with -pooler) from .env.neon.",
        });
      }
      if (isLocalUrl(env.NEXT_PUBLIC_SITE_URL)) {
        ctx.addIssue({
          code: "custom",
          path: ["NEXT_PUBLIC_SITE_URL"],
          message:
            "is a localhost address. Delete it on Vercel (the project's .vercel.app domain is used automatically) or set your https:// domain.",
        });
      }
    }
    if (env.NODE_ENV !== "production") return;
    // Local production builds (next build && next start) may use http://localhost.
    if (!env.NEXT_PUBLIC_SITE_URL.startsWith("https://") && !isLocalUrl(env.NEXT_PUBLIC_SITE_URL)) {
      ctx.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_SITE_URL"],
        message: "must use https:// in production",
      });
    }
  });

const cloudinaryEnvSchema = z.object({
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  CLOUDINARY_FOLDER: z.string().min(1).default("jeevan-cars"),
});

/**
 * On Vercel, NEXT_PUBLIC_SITE_URL may be left unset until a custom domain is
 * added: fall back to the project's production domain (VERCEL_PROJECT_PRODUCTION_URL,
 * e.g. "jeevan-cars.vercel.app"), which Vercel provides at build and runtime.
 */
export function withDefaults(
  source: Record<string, string | undefined>,
): Record<string, string | undefined> {
  const vercelDomain = source.VERCEL_PROJECT_PRODUCTION_URL;
  if (source.NEXT_PUBLIC_SITE_URL || !vercelDomain) return source;
  return { ...source, NEXT_PUBLIC_SITE_URL: `https://${vercelDomain}` };
}

function parse<T extends z.ZodType>(schema: T, label: string): z.infer<T> {
  const result = schema.safeParse(withDefaults(process.env));
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid ${label} environment variables:\n${issues}`);
  }
  return result.data;
}

export const env = parse(serverEnvSchema, "server");

let cloudinaryEnv: z.infer<typeof cloudinaryEnvSchema> | undefined;

/** Validated lazily so the site can run before Cloudinary is configured. */
export function getCloudinaryEnv() {
  cloudinaryEnv ??= parse(cloudinaryEnvSchema, "Cloudinary");
  return cloudinaryEnv;
}
