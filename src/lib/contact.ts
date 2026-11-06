/** Digits only, with India's country code when a 10-digit mobile is given. */
function toInternationalDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

export function getTelHref(phone: string): string {
  return `tel:+${toInternationalDigits(phone)}`;
}

export function getWhatsAppHref(whatsappNumber: string, message?: string): string {
  const base = `https://wa.me/${toInternationalDigits(whatsappNumber)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function formatAddressLines(settings: {
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
}): string[] {
  const cityLine = [settings.city, [settings.state, settings.postalCode].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  return [settings.addressLine1, settings.addressLine2, cityLine].filter((line): line is string =>
    Boolean(line),
  );
}
