import { getSupabase } from "./supabaseClient";
import type { BloodRequest, Urgency } from "./requests";

interface BloodRequestRow {
  id: string;
  patient_id: string;
  blood_type: string;
  units: number;
  urgency: Urgency;
  distance_km: number | null;
  created_at: string;
  hospitals: { name: string } | null;
}

function relativeTime(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return `${hours} hr${hours > 1 ? "s" : ""} ago`;
}

function toBloodRequest(row: BloodRequestRow): BloodRequest {
  return {
    id: row.id,
    hospital: row.hospitals?.name ?? "Unknown hospital",
    patientId: row.patient_id,
    bloodType: row.blood_type,
    units: row.units,
    urgency: row.urgency,
    distance: row.distance_km != null ? `${row.distance_km} km` : "—",
    time: relativeTime(row.created_at),
  };
}

/** Open blood requests, newest first — backs both the Find screen and the hospital dashboard. */
export async function fetchBloodRequests(): Promise<BloodRequest[]> {
  const { data, error } = await getSupabase()
    .from("blood_requests")
    .select("id, patient_id, blood_type, units, urgency, distance_km, created_at, hospitals(name)")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as unknown as BloodRequestRow[]).map(toBloodRequest);
}
