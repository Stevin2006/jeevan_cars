import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { PublicSiteSettings } from "@/lib/data/settings";
import { formatAddressLines, getTelHref, getWhatsAppHref } from "@/lib/contact";
import { cn } from "@/lib/utils";

function Item({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Phone;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 py-6 first:pt-0 last:pb-0">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-surface text-ink">
        <Icon className="size-[1.125rem]" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="min-w-0 space-y-1">
        <dt className="label-caps text-muted-foreground">{label}</dt>
        <dd className="text-[0.9375rem] leading-relaxed text-ink">{children}</dd>
      </div>
    </div>
  );
}

/** Address, phone, WhatsApp, email and hours from Site Settings. Empty fields are skipped. */
export function ContactDetails({
  settings,
  className,
}: {
  settings: PublicSiteSettings;
  className?: string;
}) {
  const address = formatAddressLines(settings);
  const linkClass = "underline-offset-4 hover:underline";

  return (
    <dl className={cn("divide-y", className)}>
      {address.length > 0 && (
        <Item icon={MapPin} label="Visit the forecourt">
          <address className="not-italic">
            {address.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </address>
        </Item>
      )}
      {settings.phone && (
        <Item icon={Phone} label="Call">
          <a href={getTelHref(settings.phone)} className={cn(linkClass, "tabular")}>
            {settings.phone}
          </a>
        </Item>
      )}
      {settings.whatsappNumber && (
        <Item icon={MessageCircle} label="WhatsApp">
          <a
            href={getWhatsAppHref(settings.whatsappNumber)}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            Message us on WhatsApp
          </a>
        </Item>
      )}
      {settings.email && (
        <Item icon={Mail} label="Email">
          <a href={`mailto:${settings.email}`} className={cn(linkClass, "break-all")}>
            {settings.email}
          </a>
        </Item>
      )}
      {settings.businessHours && (
        <Item icon={Clock} label="Opening hours">
          <span className="whitespace-pre-line">{settings.businessHours}</span>
        </Item>
      )}
    </dl>
  );
}
