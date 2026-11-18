import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
// Sample stock hotlinks Unsplash; production builds only allow it when asked.
const allowSampleImages = isDev || process.env.ALLOW_SAMPLE_IMAGES === "true";

// Vercel's comments/feedback toolbar is injected on preview deployments only.
const vercelToolbar = process.env.VERCEL_ENV === "preview";
const toolbar = (sources: string) => (vercelToolbar ? ` ${sources}` : "");

// Static CSP (no nonces) so pages stay cacheable under Cache Components.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${toolbar("https://vercel.live")}`,
  `style-src 'self' 'unsafe-inline'${toolbar("https://vercel.live")}`,
  `img-src 'self' data: blob: https://res.cloudinary.com${toolbar("https://vercel.live https://vercel.com")}`,
  `font-src 'self'${toolbar("https://vercel.live https://assets.vercel.com")}`,
  `connect-src 'self' https://api.cloudinary.com${toolbar("https://vercel.live wss://ws-us3.pusher.com")}`,
  `frame-src https://www.google.com https://maps.google.com${toolbar("https://vercel.live")}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // No `preload`: submitting to the HSTS preload list is a one-way decision for the domain owner.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  // E2E builds use their own folder so they can run alongside `next dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  cacheComponents: true,
  experimental: {
    // Turbopack's on-disk dev cache (.next/dev/cache) corrupted repeatedly on
    // this project's NTFS drive, crashing `next dev` with "task no longer
    // exists" panics. Dev compiles from scratch on each start instead.
    turbopackFileSystemCacheForDev: false,
  },
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Development sample inventory (prisma/seed-sample.ts) only.
      ...(allowSampleImages
        ? [{ protocol: "https" as const, hostname: "images.unsplash.com" }]
        : []),
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
