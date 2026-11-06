import "server-only";
import { z } from "zod";

const serverEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
    NEXT_PUBLIC_SITE_URL: z.url().transform((url) => url.replace(/\/+$/, "")),
    AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
    /** Reverse proxies in front of the app that append to X-Forwarded-For. */
    TRUSTED_PROXY_HOPS: z.coerce.number().int().min(1).max(5).default(1),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== "production") return;
    const local = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(env.NEXT_PUBLIC_SITE_URL);
    if (!env.NEXT_PUBLIC_SITE_URL.startsWith("https://") && !local) {
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

function parse<T extends z.ZodType>(schema: T, label: string): z.infer<T> {
  const result = schema.safeParse(process.env);
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
