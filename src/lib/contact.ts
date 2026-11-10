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

type MapAddress = Parameters<typeof formatAddressLines>[0] & { businessName: string };

// Open Location Code ("Plus Code") alphabet, e.g. "58X2+7QF" or "7J4V58X2+7QF".
const PLUS_CODE = /\b[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3}\b/i;

/**
 * What to search Google Maps for. A Plus Code in the address pins the exact
 * spot, so it wins over free-text lines like "near Monday Market"; otherwise
 * the business name plus full address is used. Null when there's no address.
 */
export function getMapQuery(settings: MapAddress): string | null {
  const lines = formatAddressLines(settings);
  if (lines.length === 0) return null;
  const plusCode = lines.join(" ").match(PLUS_CODE)?.[0].toUpperCase();
  if (plusCode) {
    return [plusCode, settings.city, settings.state].filter(Boolean).join(", ");
  }
  return [settings.businessName, ...lines].join(", ");
}

/** Key-less Google Maps embed for the iframe (frame-src allows www.google.com). */
export function getMapsEmbedUrl(query: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`;
}

/** Google Maps URLs API: opens the app on phones, the website elsewhere. */
export function getMapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function getDirectionsUrl(query: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}
