"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Controller, useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateSiteSettings } from "@/actions/settings";
import { HeroImageField } from "@/components/admin/settings/hero-image-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  siteSettingsSchema,
  type SiteSettingsInput,
  type SiteSettingsValues,
} from "@/lib/validations/settings";

type TextField = Exclude<FieldPath<SiteSettingsInput>, "hero" | `hero.${string}`>;

function Group({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-6 border-b py-8 first:pt-0 last:border-b-0 lg:grid-cols-[16rem_1fr]">
      <div>
        <h2 className="font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function SettingsForm({ defaults }: { defaults: SiteSettingsInput }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<SiteSettingsInput, unknown, SiteSettingsValues>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: defaults,
  });
  const { errors, isDirty } = form.formState;

  const field = (
    name: TextField,
    label: string,
    options: {
      hint?: string;
      type?: string;
      wide?: boolean;
      multiline?: boolean;
      placeholder?: string;
    } = {},
  ) => {
    const message = errors[name]?.message;
    const props = {
      id: `settings-${name}`,
      placeholder: options.placeholder,
      "aria-invalid": Boolean(message),
      ...form.register(name),
    };
    return (
      <div className={options.wide ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
        <Label htmlFor={props.id}>{label}</Label>
        {options.multiline ? (
          <Textarea rows={3} {...props} />
        ) : (
          <Input type={options.type ?? "text"} {...props} />
        )}
        {message ? (
          <p className="text-[0.8125rem] text-destructive">{message}</p>
        ) : (
          options.hint && <p className="text-xs text-muted-foreground">{options.hint}</p>
        )}
      </div>
    );
  };

  const onSubmit = form.handleSubmit(
    (values) => {
      startTransition(async () => {
        const result = await updateSiteSettings(values);
        if (!result.ok) {
          for (const [name, messages] of Object.entries(result.fieldErrors ?? {})) {
            if (messages?.[0])
              form.setError(name as FieldPath<SiteSettingsInput>, { message: messages[0] });
          }
          return void toast.error(result.error);
        }
        form.reset(form.getValues());
        toast.success("Settings saved — the website is updated");
        router.refresh();
      });
    },
    () => toast.error("Please check the highlighted fields."),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-lg border bg-surface p-6">
      <Group title="Business" description="Shown in the footer, About page and search results.">
        {field("businessName", "Business name")}
        {field("tagline", "Tagline", {
          placeholder: "Pre-owned cars and commercial vehicles you can trust",
        })}
      </Group>

      <Group title="Contact" description="Used for the call and WhatsApp buttons across the site.">
        {field("phone", "Phone", { type: "tel", placeholder: "+91 98765 43210" })}
        {field("whatsappNumber", "WhatsApp number", {
          type: "tel",
          hint: "10-digit Indian mobile",
        })}
        {field("email", "Email", { type: "email" })}
      </Group>

      <Group title="Address & hours">
        {field("addressLine1", "Address line 1", { wide: true })}
        {field("addressLine2", "Address line 2", { wide: true })}
        {field("city", "City")}
        {field("state", "State")}
        {field("postalCode", "PIN code")}
        {field("businessHours", "Opening hours", {
          multiline: true,
          wide: true,
          hint: "One line per day range, e.g. Mon–Sat 9:30 am – 7 pm",
        })}
        {field("mapEmbedUrl", "Google Maps embed link (optional)", {
          wide: true,
          hint: 'The map is built from your address automatically (a Plus Code like 58X2+7QF pins it exactly). To show your Google listing instead: Google Maps → Share → Embed a map → copy only the src="…" link.',
        })}
      </Group>

      <Group title="Homepage hero" description="The cinematic photo behind the homepage headline.">
        <div className="sm:col-span-2">
          <Controller
            control={form.control}
            name="hero"
            render={({ field: hero }) => (
              <HeroImageField
                value={hero.value ?? null}
                onChange={hero.onChange}
                error={errors.hero?.message}
              />
            )}
          />
        </div>
      </Group>

      <Group title="Social links" description="Full links to your pages. Leave blank to hide.">
        {field("facebookUrl", "Facebook", { type: "url" })}
        {field("instagramUrl", "Instagram", { type: "url" })}
        {field("youtubeUrl", "YouTube", { type: "url" })}
      </Group>

      <Group
        title="Search engines"
        description="Default title and description when a page doesn't set its own."
      >
        {field("seoTitle", "Default title", { wide: true, hint: "Up to 70 characters" })}
        {field("seoDescription", "Default description", {
          wide: true,
          multiline: true,
          hint: "Up to 170 characters",
        })}
      </Group>

      <div className="sticky bottom-0 -mx-6 -mb-6 flex items-center justify-end gap-3 rounded-b-lg border-t bg-surface/95 px-6 py-4 backdrop-blur">
        {isDirty && <p className="text-sm text-amber-ink">Unsaved changes</p>}
        <Button type="submit" size="lg" disabled={isPending || !isDirty}>
          {isPending && <Loader2 className="animate-spin" data-icon="inline-start" aria-hidden />}
          Save settings
        </Button>
      </div>
    </form>
  );
}
