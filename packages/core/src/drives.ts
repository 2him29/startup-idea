import { getSupabase } from "./supabaseClient";
import type { Lang } from "./i18n";

export interface BloodDrive {
  id: string;
  title: string;
  organizer: string;
  location: string;
  wilaya: string;
  startsAt: string;
}

interface BloodDriveRow {
  id: string;
  title: string;
  organizer: string;
  location: string;
  wilaya: string;
  starts_at: string;
}

function toBloodDrive(row: BloodDriveRow): BloodDrive {
  return {
    id: row.id,
    title: row.title,
    organizer: row.organizer,
    location: row.location,
    wilaya: row.wilaya,
    startsAt: row.starts_at,
  };
}

/** Static fallback so the screen has sensible content before the first fetch resolves. */
export const fallbackDrives: BloodDrive[] = [
  {
    id: "d1",
    title: "Collecte de sang — Université d'Alger 1",
    organizer: "Université d'Alger 1",
    location: "Amphithéâtre central, Alger",
    wilaya: "Alger",
    startsAt: new Date(Date.now() + 3 * 86400000).toISOString(),
  },
  {
    id: "d2",
    title: "Collecte après la prière du vendredi",
    organizer: "Grande Mosquée d'Alger",
    location: "Grande Mosquée d'Alger",
    wilaya: "Alger",
    startsAt: new Date(Date.now() + 5 * 86400000).toISOString(),
  },
  {
    id: "d3",
    title: "Journée de don du sang Sonatrach",
    organizer: "Sonatrach",
    location: "Siège Sonatrach, Oran",
    wilaya: "Oran",
    startsAt: new Date(Date.now() + 9 * 86400000).toISOString(),
  },
  {
    id: "d4",
    title: "Collecte du Croissant-Rouge Algérien",
    organizer: "Croissant-Rouge Algérien — antenne de Blida",
    location: "Maison du Croissant-Rouge, Blida",
    wilaya: "Blida",
    startsAt: new Date(Date.now() + 12 * 86400000).toISOString(),
  },
];

/** Upcoming community blood drives, soonest first. */
export async function fetchBloodDrives(): Promise<BloodDrive[]> {
  const { data, error } = await getSupabase()
    .from("blood_drives")
    .select("id, title, organizer, location, wilaya, starts_at")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  if (error) throw error;
  return (data as BloodDriveRow[]).map(toBloodDrive);
}

export function formatDriveDate(iso: string, lang: Lang): string {
  const locale = lang === "ar" ? "ar-DZ" : lang === "fr" ? "fr-DZ" : "en-US";
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
