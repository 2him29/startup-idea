import { colors } from "@weare/ui-tokens";
import type { Strings } from "./i18n";

export type Urgency = "Critical" | "High" | "Medium" | "Low";

export interface BloodRequest {
  id: string;
  hospital: string;
  patientId: string;
  bloodType: string;
  units: number;
  urgency: Urgency;
  distance: string;
  time: string;
  hospitalLat: number | null;
  hospitalLng: number | null;
  wilaya: string | null;
}

export const urgencyStyle: Record<Urgency, { bg: string; fg: string }> = {
  Critical: { bg: colors.red, fg: "#FFFFFF" },
  High: { bg: colors.orange, fg: "#FFFFFF" },
  Medium: { bg: "#F1C40F", fg: "#4A3B00" },
  Low: { bg: "#3B82C4", fg: "#FFFFFF" },
};

/** Static fallback so the UI has sensible content before the first fetch resolves. */
export const bloodRequests: BloodRequest[] = [
  { id: "1", hospital: "Hôpital Salim Zemirli – El Harrach", patientId: "P-2024-001", bloodType: "A+", units: 2, urgency: "Critical", distance: "12.9 km", time: "30 min ago", hospitalLat: 36.7169, hospitalLng: 3.1846, wilaya: "Alger" },
  { id: "2", hospital: "EHS Maouche Mohand Amokrane – El Biar", patientId: "P-2024-002", bloodType: "O-", units: 3, urgency: "High", distance: "4.57 km", time: "1 hr ago", hospitalLat: 36.7378, hospitalLng: 3.0392, wilaya: "Alger" },
  { id: "3", hospital: "CHU Lamine Debaghine – Bab El Oued", patientId: "P-2024-003", bloodType: "B+", units: 1, urgency: "Medium", distance: "2.97 km", time: "3 hr ago", hospitalLat: 36.759, hospitalLng: 3.0335, wilaya: "Alger" },
  { id: "4", hospital: "Hôpital Nafissa Hamoud (ex-Parnet)", patientId: "P-2024-004", bloodType: "AB+", units: 2, urgency: "Low", distance: "5.53 km", time: "5 hr ago", hospitalLat: 36.728, hospitalLng: 3.078, wilaya: "Alger" },
  { id: "5", hospital: "CHU Oran – Dr Benzerdjeb", patientId: "P-2024-005", bloodType: "O+", units: 2, urgency: "High", distance: "408 km", time: "2 hrs ago", hospitalLat: 35.6971, hospitalLng: -0.6337, wilaya: "Oran" },
  { id: "6", hospital: "CHU Frantz Fanon – Blida", patientId: "P-2024-006", bloodType: "A-", units: 1, urgency: "Critical", distance: "47 km", time: "45 min ago", hospitalLat: 36.4203, hospitalLng: 2.8277, wilaya: "Blida" },
];

export function unitsLabel(units: number, t?: Strings) {
  if (t) return `${units} ${t.units}`;
  return `${units} ${units > 1 ? "units" : "unit"}`;
}

export function urgencyLabel(urgency: Urgency, t: Strings): string {
  switch (urgency) {
    case "Critical": return t.urgencyCritical;
    case "High": return t.urgencyHigh;
    case "Medium": return t.urgencyMedium;
    case "Low": return t.urgencyLow;
  }
}
