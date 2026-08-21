import { getSupabase } from "./supabaseClient";
import { drainNotifications } from "./push";
import type { Urgency } from "./requests";

/**
 * Patients and families as request authors — the replacement for
 * hospital-authored requests.
 *
 * TODO(compliance): patient rows carry identifying + health data (name, blood
 * type, phone) written to a Supabase region outside Algeria. Revisit under
 * Loi 18-07 / 25-11 once hosting is settled.
 */

export interface Patient {
  id: string;
  fullName: string;
  bloodType: string;
  wilaya: string;
  /** Free text: the treating hospital as the family knows it, not a directory id. */
  hospitalName: string | null;
  contactPhone: string | null;
  createdAt: string;
}

interface PatientRow {
  id: string;
  full_name: string;
  blood_type: string;
  wilaya: string;
  hospital_name: string | null;
  contact_phone: string | null;
  created_at: string;
}

function toPatient(row: PatientRow): Patient {
  return {
    id: row.id,
    fullName: row.full_name,
    bloodType: row.blood_type,
    wilaya: row.wilaya,
    hospitalName: row.hospital_name,
    contactPhone: row.contact_phone,
    createdAt: row.created_at,
  };
}

export interface PatientRequestInput {
  patientName: string;
  bloodType: string;
  wilaya: string;
  units: number;
  urgency: Urgency;
  hospitalName?: string;
  /**
   * Set only when the typed hospital matches one in the directory.
   *
   * This is what puts a patient-posted request on the map: coordinates come
   * from the hospitals join, so a request with no hospital_id has no pin. The
   * name stays free text either way — a family must never be blocked because
   * their clinic isn't in our directory — so this is precision when we happen
   * to have it, never a requirement.
   */
  hospitalId?: string;
  contactPhone?: string;
  /** The handwritten file reference, when the family has one to hand. */
  patientFileRef?: string;
}

async function requireUserId(action: string): Promise<string> {
  const { data, error } = await getSupabase().auth.getSession();
  if (error) throw error;
  if (!data.session) throw new Error(`Must be signed in to ${action}`);
  return data.session.user.id;
}

/** The patient records this user has created (their own family members). */
export async function fetchMyPatients(): Promise<Patient[]> {
  const userId = await requireUserId("view patients");
  const { data, error } = await getSupabase()
    .from("patients")
    .select("id, full_name, blood_type, wilaya, hospital_name, contact_phone, created_at")
    .eq("created_by", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as PatientRow[]).map(toPatient);
}

/**
 * Create the patient record and its first open request together.
 *
 * The two writes are deliberately sequential rather than a single RPC: if the
 * request insert fails (most often because the account isn't phone-verified
 * yet and RLS rejects it), the patient row is still there and the family can
 * retry the request without retyping everything. The wilaya/blood type/
 * hospital name are copied onto the request on purpose — the donor-facing list
 * reads only blood_requests, so patient names and phone numbers never have to
 * be exposed to it.
 */
export async function createPatientRequest(input: PatientRequestInput): Promise<{ patientId: string; requestId: string }> {
  const supabase = getSupabase();
  const userId = await requireUserId("post a request");

  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .insert({
      full_name: input.patientName.trim(),
      blood_type: input.bloodType,
      wilaya: input.wilaya,
      hospital_name: input.hospitalName?.trim() || null,
      contact_phone: input.contactPhone?.trim() || null,
      created_by: userId,
    })
    .select("id")
    .single();
  if (patientError) throw patientError;

  const patientId = (patient as { id: string }).id;

  const { data: request, error: requestError } = await supabase
    .from("blood_requests")
    .insert({
      patient_record_id: patientId,
      patient_id: input.patientFileRef?.trim() || "—",
      blood_type: input.bloodType,
      units: input.units,
      urgency: input.urgency,
      wilaya: input.wilaya,
      hospital_name: input.hospitalName?.trim() || null,
      hospital_id: input.hospitalId ?? null,
    })
    .select("id")
    .single();
  if (requestError) throw requestError;

  // Donors nearby should hear now, not on the next scheduled run.
  void drainNotifications();

  return { patientId, requestId: (request as { id: string }).id };
}
