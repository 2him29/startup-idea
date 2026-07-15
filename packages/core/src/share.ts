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

export function formatShareMessage(
  t: Strings,
  params: { hospital: string; bloodType: string; distance: string; units: number }
): string {
  return t.shareMessage
    .replace("{bloodType}", params.bloodType)
    .replace("{hospital}", params.hospital)
    .replace("{distance}", params.distance)
    .replace("{units}", String(params.units));
}
