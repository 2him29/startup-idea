import { colors } from "@weare/ui-tokens";

export type Urgency = "Critical" | "High" | "Medium" | "Low";

export interface BloodRequest {
  id: number;
  hospital: string;
  patientId: string;
  bloodType: string;
  units: number;
  urgency: Urgency;
  distance: string;
  time: string;
}

export const urgencyStyle: Record<Urgency, { bg: string; fg: string }> = {
  Critical: { bg: colors.red, fg: "#FFFFFF" },
  High: { bg: colors.orange, fg: "#FFFFFF" },
  Medium: { bg: "#F1C40F", fg: "#4A3B00" },
  Low: { bg: "#3B82C4", fg: "#FFFFFF" },
};

export const bloodRequests: BloodRequest[] = [
  { id: 1, hospital: "City General Hospital", patientId: "P-2024-001", bloodType: "A+", units: 2, urgency: "Critical", distance: "2.3 km", time: "30 min ago" },
  { id: 2, hospital: "Memorial Medical Center", patientId: "P-2024-002", bloodType: "O-", units: 3, urgency: "High", distance: "4.1 km", time: "1 hr ago" },
  { id: 3, hospital: "St. Mary's Hospital", patientId: "P-2024-003", bloodType: "B+", units: 1, urgency: "Medium", distance: "5.7 km", time: "3 hr ago" },
  { id: 4, hospital: "County Hospital", patientId: "P-2024-004", bloodType: "AB+", units: 2, urgency: "Low", distance: "8.2 km", time: "5 hr ago" },
];

export function unitsLabel(units: number) {
  return `${units} ${units > 1 ? "units" : "unit"}`;
}
