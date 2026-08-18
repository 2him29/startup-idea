import { getSupabase } from "./supabaseClient";
import { isPatientModelEnabled } from "./featureFlags";
import type { BloodRequest, Urgency } from "./requests";

/**
 * Row shape. Everything the patient model added is optional here because the
 * legacy query never selects those columns — see REQUEST_COLUMNS below.
 */
interface BloodRequestRow {
  id: string;
  patient_id: string;
  blood_type: string;
  units: number;
  urgency: Urgency;
  distance_km: number | null;
  created_at: string;
  hospitals: { name: string; latitude: number | null; longitude: number | null; wilaya: string | null } | null;
  patient_record_id?: string | null;
  wilaya?: string | null;
  hospital_name?: string | null;
  verified_at?: string | null;
  verifier?: { name: string } | null;
}

/**
 * Patient-authored requests carry their own denormalized hospital_name/wilaya
 * (the donor list never reads the `patients` table, whose RLS hides names and
 * phone numbers); legacy hospital-authored rows get theirs from the join.
 */
function toBloodRequest(row: BloodRequestRow): BloodRequest {
  return {
    id: row.id,
    hospital: row.hospital_name ?? row.hospitals?.name ?? "Unknown hospital",
    patientId: row.patient_id,
    patientRecordId: row.patient_record_id ?? null,
    bloodType: row.blood_type,
    units: row.units,
    urgency: row.urgency,
    distance: row.distance_km != null ? `${row.distance_km} km` : "—",
    createdAt: row.created_at,
    hospitalLat: row.hospitals?.latitude ?? null,
    hospitalLng: row.hospitals?.longitude ?? null,
    wilaya: row.wilaya ?? row.hospitals?.wilaya ?? null,
    verifiedByName: row.verifier?.name ?? null,
    verifiedAt: row.verified_at ?? null,
  };
}

const LEGACY_COLUMNS = `
  id, patient_id, blood_type, units, urgency, distance_km, created_at,
  hospitals(name, latitude, longitude, wilaya)
`;

const PATIENT_MODEL_COLUMNS = `
  id, patient_id, patient_record_id, blood_type, units, urgency, distance_km, created_at,
  wilaya, hospital_name, verified_at,
  hospitals(name, latitude, longitude, wilaya),
  verifier:associations!blood_requests_verified_by_fkey(name)
`;

/**
 * The column list has to follow the feature flag, not just the UI.
 *
 * PostgREST rejects the whole query with a 400 if it names a column or
 * embedded table that doesn't exist yet, and useBloodRequests would swallow
 * that into its fallback — so with the flag off against an unmigrated
 * database, asking for the new columns would silently replace every live
 * request with mock data instead of failing loudly.
 */
function requestColumns(): string {
  return isPatientModelEnabled() ? PATIENT_MODEL_COLUMNS : LEGACY_COLUMNS;
}

/** Open blood requests, newest first — backs the Find screen, the hospital dashboard, and the association console. */
export async function fetchBloodRequests(): Promise<BloodRequest[]> {
  const { data, error } = await getSupabase()
    .from("blood_requests")
    .select(requestColumns())
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as unknown as BloodRequestRow[]).map(toBloodRequest);
}

/**
 * Open requests in one wilaya — what an association sees in its console. The
 * wilaya scope mirrors the RLS rule: a committee may only vouch for requests
 * in the wilaya it is verified for, so showing it any others would just be
 * offering actions that the database will reject.
 */
export async function fetchRequestsForWilaya(wilaya: string): Promise<BloodRequest[]> {
  // Always the extended shape: this endpoint only exists under the patient
  // model, so there is no legacy caller to keep compatible.
  const { data, error } = await getSupabase()
    .from("blood_requests")
    .select(PATIENT_MODEL_COLUMNS)
    .eq("status", "open")
    .eq("wilaya", wilaya)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as unknown as BloodRequestRow[]).map(toBloodRequest);
}

/**
 * Publish a new open request for the signed-in hospital account's own
 * hospital (RLS rejects inserts for hospitals the caller doesn't own).
 *
 * LEGACY: this is the pre-patient-model path, kept working behind the
 * patientModel feature flag until a pilot association has verified real
 * requests. New code should call createPatientRequest() in patients.ts.
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
    .select("id, name, wilaya")
    .eq("owner_id", sessionData.session.user.id)
    .maybeSingle();
  if (hospitalError) throw hospitalError;
  if (!hospital) throw new Error("No hospital is linked to this account");

  const owned = hospital as { id: string; name: string; wilaya: string | null };

  const { error } = await supabase.from("blood_requests").insert({
    hospital_id: owned.id,
    patient_id: params.patientId.trim(),
    blood_type: params.bloodType,
    units: params.units,
    urgency: params.urgency,
    // Denormalized alongside the join so both request origins read the same
    // way downstream, and so association wilaya-scoping covers legacy rows.
    // Omitted entirely when the flag is off, because these columns don't
    // exist until the patient-model migrations have been applied.
    ...(isPatientModelEnabled() ? { wilaya: owned.wilaya, hospital_name: owned.name } : {}),
  });
  if (error) throw error;
}
