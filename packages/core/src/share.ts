import type { Strings } from "./i18n";

/** Opens WhatsApp's share intent with prefilled text -- no contact needed, works on both mobile and desktop web. */
export function shareToWhatsApp(text: string): void {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
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
