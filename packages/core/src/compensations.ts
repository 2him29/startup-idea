import { getSupabase } from "./supabaseClient";

export type CompensationStatus = "pledged" | "completed" | "cancelled";

export interface Hospital {
  id: string;
  name: string;
}

export interface CompensationInput {
  hospitalId: string;
  patientName: string;
  patientFile: string;
}

export interface Compensation {
  id: string;
  hospitalId: string;
  patientName: string;
  patientFile: string;
  status: CompensationStatus;
  createdAt: string;
  /** Short human-friendly reference derived from the id, e.g. "#WA-4821". */
  reference: string;
}

interface HospitalRow {
  id: string;
  name: string;
}

interface CompensationRow {
  id: string;
  hospital_id: string;
  patient_name: string;
  patient_file: string;
  status: CompensationStatus;
  created_at: string;
}

/** Static fallback so the hospital <select> has content before the first fetch
 *  resolves (or when Supabase env isn't configured yet in local dev). */
export const fallbackHospitals: Hospital[] = [
  { id: "h-mustapha", name: "CHU Mustapha Pacha — Alger" },
  { id: "h-husseindey", name: "EPH Hussein Dey — Alger" },
  { id: "h-benimessous", name: "CHU Beni Messous — Alger" },
  { id: "h-blida", name: "CAC Blida" },
];

function reference(id: string): string {
  return `#WA-${id.replace(/\D/g, "").slice(0, 4).padStart(4, "0")}`;
}

function toCompensation(row: CompensationRow): Compensation {
  return {
    id: row.id,
    hospitalId: row.hospital_id,
    patientName: row.patient_name,
    patientFile: row.patient_file,
    status: row.status,
    createdAt: row.created_at,
    reference: reference(row.id),
  };
}

/** Hospitals the donor can compensate at, alphabetical. */
export async function fetchHospitals(): Promise<Hospital[]> {
  const { data, error } = await getSupabase()
    .from("hospitals")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data as HospitalRow[]).map((r) => ({ id: r.id, name: r.name }));
}

/**
 * Record a compensation pledge for a named patient. The signed-in user is the
 * donor; RLS enforces that donor_id must equal auth.uid(), so we read it from
 * the session rather than trusting a caller-supplied id.
 */
export async function createCompensation(input: CompensationInput): Promise<Compensation> {
  const supabase = getSupabase();

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session) throw new Error("Must be signed in to pledge a compensation");

  const { data, error } = await supabase
    .from("compensations")
    .insert({
      donor_id: sessionData.session.user.id,
      hospital_id: input.hospitalId,
      patient_name: input.patientName.trim(),
      patient_file: input.patientFile.trim(),
    })
    .select("id, hospital_id, patient_name, patient_file, status, created_at")
    .single();

  if (error) throw error;
  return toCompensation(data as CompensationRow);
}
