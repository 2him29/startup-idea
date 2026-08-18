import { colors } from "@weare/ui-tokens";
import type { Lang, Strings } from "./i18n";

export type Urgency = "Critical" | "High" | "Medium" | "Low";

export interface BloodRequest {
  id: string;
  hospital: string;
  patientId: string;
  bloodType: string;
  units: number;
  urgency: Urgency;
  distance: string;
  /** Raw ISO timestamp. Formatted at render time so it can follow the UI language. */
  createdAt: string;
  hospitalLat: number | null;
  hospitalLng: number | null;
  wilaya: string | null;
  /** Set on patient-authored requests; null on legacy hospital-authored ones. */
  patientRecordId: string | null;
  /**
   * Name of the association vouching for this request, or null when nobody
   * has. Verification is optional by design — an unverified request is still
   * shown, just without the badge, because a family in a wilaya with no active
   * committee must not be silenced while they wait for one.
   */
  verifiedByName: string | null;
  verifiedAt: string | null;
}

export const urgencyStyle: Record<Urgency, { bg: string; fg: string }> = {
  Critical: { bg: colors.red, fg: "#FFFFFF" },
  High: { bg: colors.orange, fg: "#FFFFFF" },
  Medium: { bg: "#F1C40F", fg: "#4A3B00" },
  Low: { bg: "#3B82C4", fg: "#FFFFFF" },
};

/** Static fallback so the UI has sensible content before the first fetch resolves. */
export const bloodRequests: BloodRequest[] = [
  { id: "1", hospital: "Hôpital Salim Zemirli – El Harrach", patientId: "P-2024-001", bloodType: "A+", units: 2, urgency: "Critical", distance: "12.9 km", createdAt: new Date(Date.now() - 30 * 60000).toISOString(), hospitalLat: 36.7169, hospitalLng: 3.1846, wilaya: "Alger", patientRecordId: null, verifiedByName: "Croissant-Rouge Algérien — Alger", verifiedAt: "2026-08-17T09:00:00Z" },
  { id: "2", hospital: "EHS Maouche Mohand Amokrane – El Biar", patientId: "P-2024-002", bloodType: "O-", units: 3, urgency: "High", distance: "4.57 km", createdAt: new Date(Date.now() - 60 * 60000).toISOString(), hospitalLat: 36.7378, hospitalLng: 3.0392, wilaya: "Alger", patientRecordId: null, verifiedByName: null, verifiedAt: null },
  { id: "3", hospital: "CHU Lamine Debaghine – Bab El Oued", patientId: "P-2024-003", bloodType: "B+", units: 1, urgency: "Medium", distance: "2.97 km", createdAt: new Date(Date.now() - 180 * 60000).toISOString(), hospitalLat: 36.759, hospitalLng: 3.0335, wilaya: "Alger", patientRecordId: null, verifiedByName: null, verifiedAt: null },
  { id: "4", hospital: "Hôpital Nafissa Hamoud (ex-Parnet)", patientId: "P-2024-004", bloodType: "AB+", units: 2, urgency: "Low", distance: "5.53 km", createdAt: new Date(Date.now() - 300 * 60000).toISOString(), hospitalLat: 36.728, hospitalLng: 3.078, wilaya: "Alger", patientRecordId: null, verifiedByName: null, verifiedAt: null },
  { id: "5", hospital: "CHU Oran – Dr Benzerdjeb", patientId: "P-2024-005", bloodType: "O+", units: 2, urgency: "High", distance: "408 km", createdAt: new Date(Date.now() - 120 * 60000).toISOString(), hospitalLat: 35.6971, hospitalLng: -0.6337, wilaya: "Oran", patientRecordId: null, verifiedByName: null, verifiedAt: null },
  { id: "6", hospital: "CHU Frantz Fanon – Blida", patientId: "P-2024-006", bloodType: "A-", units: 1, urgency: "Critical", distance: "47 km", createdAt: new Date(Date.now() - 45 * 60000).toISOString(), hospitalLat: 36.4203, hospitalLng: 2.8277, wilaya: "Blida", patientRecordId: null, verifiedByName: "Croissant-Rouge Algérien — Blida", verifiedAt: "2026-08-17T08:15:00Z" },
];

/**
 * "1 unit" / "2 units" / "وحدتان" — the right form for the count *and* the
 * language.
 *
 * This used to append a single plural string, so every language rendered
 * "1 units". Arabic is the reason it needs more than an if: it inflects by
 * count in five bands (one, two, three-to-ten, eleven-plus, and larger), and
 * "2 وحدات" is as wrong to an Arabic reader as "1 units" is to an English one.
 * Intl.PluralRules already knows those bands for every locale, so the
 * dictionary only has to supply the forms.
 */
export function unitsLabel(units: number, t: Strings, lang: Lang): string {
  let category: Intl.LDMLPluralRule = "other";
  try {
    category = new Intl.PluralRules(lang).select(units);
  } catch {
    // A runtime without full ICU data: fall back to the plural form rather
    // than failing to render a request at all.
  }

  const form =
    category === "one" ? t.unitsOne
    : category === "two" ? t.unitsTwo
    : category === "few" ? t.unitsFew
    : t.units;

  // Arabic's singular and dual forms already carry the count — وحدتان *is*
  // "two units" — so prefixing the numeral reads like "2 two-units". Every
  // other band (3–10, 11+) does take the numeral, as do English and French
  // throughout.
  const formCarriesTheCount = lang === "ar" && (category === "one" || category === "two");

  return formCarriesTheCount ? form : `${units} ${form}`;
}

/**
 * "30 min ago", "il y a 3 heures", "قبل ٥ أيام".
 *
 * Formatted here rather than when the row is fetched, because the fetch layer
 * has no idea which language the UI is in — that is why every request used to
 * read "812 hrs ago" in Arabic. It also rolls up through hours into days:
 * hours alone made week-old demo data read as three-digit hour counts.
 */
export function formatRelativeTime(iso: string, lang: Lang): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));

  const [value, unit]: [number, Intl.RelativeTimeFormatUnit] =
    minutes < 60 ? [minutes, "minute"]
    : minutes < 60 * 24 ? [Math.round(minutes / 60), "hour"]
    : minutes < 60 * 24 * 30 ? [Math.round(minutes / (60 * 24)), "day"]
    : [Math.round(minutes / (60 * 24 * 30)), "month"];

  try {
    // `numeric: "auto"` lets a locale say "yesterday" instead of "1 day ago"
    // where that reads better.
    return new Intl.RelativeTimeFormat(lang, { numeric: "auto" }).format(-value, unit);
  } catch {
    return `${value} ${unit}${value === 1 ? "" : "s"} ago`;
  }
}

export function urgencyLabel(urgency: Urgency, t: Strings): string {
  switch (urgency) {
    case "Critical": return t.urgencyCritical;
    case "High": return t.urgencyHigh;
    case "Medium": return t.urgencyMedium;
    case "Low": return t.urgencyLow;
  }
}
