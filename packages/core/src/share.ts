import type { Strings } from "./i18n";

/** Opens WhatsApp's share intent with prefilled text -- no contact needed, works on both mobile and desktop web. */
export function shareToWhatsApp(text: string): void {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
}

/**
 * Opens turn-by-turn directions in the device's maps app. Prefers exact
 * coordinates; falls back to a place-name search when we only know the name.
 */
export function openDirections(dest: { lat?: number | null; lng?: number | null; name?: string }): void {
  const url =
    dest.lat != null && dest.lng != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dest.name ?? "")}`;
  window.open(url, "_blank");
}

/**
 * Builds the WhatsApp text for a request.
 *
 * When an association has vouched for the request, its name is appended — this
 * is the one place the verification actually travels, because a forwarded
 * WhatsApp message leaves the app entirely and the recipient has no badge to
 * look at. Naming the vouching committee is what makes a forwarded plea
 * checkable rather than another unattributable chain message.
 */
export function formatShareMessage(
  t: Strings,
  params: { hospital: string; bloodType: string; wilaya: string; units: number; verifiedByName?: string | null }
): string {
  const base = t.shareMessage
    .replace("{bloodType}", params.bloodType)
    .replace("{hospital}", params.hospital)
    .replace("{wilaya}", params.wilaya)
    .replace("{units}", String(params.units));

  if (!params.verifiedByName) return base;
  return `${base}\n${t.shareVerifiedSuffix.replace("{association}", params.verifiedByName)}`;
}
