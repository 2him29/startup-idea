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
  hospitals: { name: string; latitude: number | null; longitude: number | null; wilaya: string | null } | null;
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
    hospitalLat: row.hospitals?.latitude ?? null,
    hospitalLng: row.hospitals?.longitude ?? null,
    wilaya: row.hospitals?.wilaya ?? null,
  };
}

/** Open blood requests, newest first — backs both the Find screen and the hospital dashboard. */
export async function fetchBloodRequests(): Promise<BloodRequest[]> {
  const { data, error } = await getSupabase()
    .from("blood_requests")
    .select("id, patient_id, blood_type, units, urgency, distance_km, created_at, hospitals(name, latitude, longitude, wilaya)")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as unknown as BloodRequestRow[]).map(toBloodRequest);
}

/**
 * Publish a new open request for the signed-in hospital account's own
 * hospital (RLS rejects inserts for hospitals the caller doesn't own).
 */
export async function createBloodRequest(params: {
  patientId: string;
  bloodType: string;
  units: number;
  urgency: Urgency;
}): Promise<void> {
  const supabase = getSupabase();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session) throw new Error("Must be signed in to publish a request");

  const { data: hospital, error: hospitalError } = await supabase
    .from("hospitals")
    .select("id")
    .eq("owner_id", sessionData.session.user.id)
    .maybeSingle();
  if (hospitalError) throw hospitalError;
  if (!hospital) throw new Error("No hospital is linked to this account");

  const { error } = await supabase.from("blood_requests").insert({
    hospital_id: hospital.id,
    patient_id: params.patientId.trim(),
    blood_type: params.bloodType,
    units: params.units,
    urgency: params.urgency,
  });
  if (error) throw error;
}
