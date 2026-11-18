import type { Metadata, Viewport } from "next";
import { Archivo, Geist, Geist_Mono } from "next/font/google";
import { PRELOADER_BOOT_SCRIPT } from "@/components/brand/preloader-boot";
import { MotionProvider } from "@/components/providers/motion-provider";
import { Toaster } from "@/components/ui/sonner";
import { env } from "@/lib/env";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["wdth"],
});

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: "Jeevan Cars — Quality Pre-Owned Vehicles",
    template: "%s | Jeevan Cars",
  },
  description:
    "Jeevan Cars sells inspected pre-owned cars, SUVs, tempo travellers and commercial vehicles.",
  applicationName: "Jeevan Cars",
  openGraph: { siteName: "Jeevan Cars", locale: "en_IN", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#0f1216",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-IN"
      className={`${archivo.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // The homepage preloader's boot script sets data-preloading before hydration.
      suppressHydrationWarning
    >
      <head>
        {/*
          Plain inline script, not next/script: beforeInteractive queues the
          code until Next's async bootstrap runs, which can be after first
          paint (the hero would flash before the preloader). The root layout
          is only server-rendered and hydrated, never re-created on client
          navigation, so React never has to render this script in the browser.
        */}
        <script
          id="jc-preloader-boot"
          dangerouslySetInnerHTML={{ __html: PRELOADER_BOOT_SCRIPT }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <MotionProvider>{children}</MotionProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
