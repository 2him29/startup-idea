import type { Lang } from "./i18n";

/** Static fallback national reserve levels for Alger (demo data, per design spec). */
export const RESERVE = [
  { type: "O-", width: "18%", color: "#E5484D", statusKey: "critical" as const },
  { type: "A+", width: "46%", color: "#F5871F", statusKey: "low" as const },
  { type: "B+", width: "82%", color: "#12B76A", statusKey: "healthy" as const },
  { type: "AB+", width: "90%", color: "#12B76A", statusKey: "healthy" as const },
];

export const RESERVE_STATUS: Record<Lang, { critical: string; low: string; healthy: string }> = {
  en: { critical: "Critical", low: "Low", healthy: "Healthy" },
  fr: { critical: "Critique", low: "Faible", healthy: "Sain" },
  ar: { critical: "حرج", low: "منخفض", healthy: "جيد" },
};
