import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/page-title";
import { PasswordForm } from "@/components/admin/settings/password-form";
import { SettingsForm } from "@/components/admin/settings/settings-form";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isCloudinaryConfigured } from "@/lib/cloudinary/server";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireAdmin();
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  const s = (value: string | null | undefined) => value ?? "";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageTitle
        title="Settings"
        description="Business details, contact numbers and the homepage hero."
      />
      {!isCloudinaryConfigured() && (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Photo uploads are turned off until Cloudinary keys are added to the server environment
          (see <code className="font-mono text-xs">.env.example</code>).
        </p>
      )}
      <SettingsForm
        defaults={{
          businessName: settings?.businessName ?? "Jeevan Cars",
          tagline: s(settings?.tagline),
          phone: s(settings?.phone),
          whatsappNumber: s(settings?.whatsappNumber),
          email: s(settings?.email),
          addressLine1: s(settings?.addressLine1),
          addressLine2: s(settings?.addressLine2),
          city: s(settings?.city),
          state: s(settings?.state),
          postalCode: s(settings?.postalCode),
          businessHours: s(settings?.businessHours),
          mapEmbedUrl: s(settings?.mapEmbedUrl),
          facebookUrl: s(settings?.facebookUrl),
          instagramUrl: s(settings?.instagramUrl),
          youtubeUrl: s(settings?.youtubeUrl),
          seoTitle: s(settings?.seoTitle),
          seoDescription: s(settings?.seoDescription),
          hero: settings?.heroImageUrl
            ? {
                url: settings.heroImageUrl,
                publicId:
                  settings.heroImagePublicId ?? `external/${settings.heroImageUrl}`.slice(0, 255),
              }
            : null,
        }}
      />
      <PasswordForm />
    </div>
  );
}
