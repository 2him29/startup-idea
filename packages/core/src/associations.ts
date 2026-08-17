import { getSupabase } from "./supabaseClient";

/**
 * Associations — Croissant-Rouge Algérien committees, scout groups, student
 * associations — as the verification layer over patient-posted requests.
 *
 * The trust chain has three links, and all three must hold before anyone can
 * vouch for a request: the association exists, a Qatra admin has verified it,
 * and the user is a member of it. Membership alone is not enough, so an
 * applicant cannot verify requests while its own application is pending.
 */

export type AssociationType = "red_crescent" | "scouts" | "student" | "other";
export type AssociationMemberRole = "admin" | "moderator" | "volunteer";

export interface Association {
  id: string;
  name: string;
  type: AssociationType;
  wilaya: string;
  contactPhone: string | null;
  contactEmail: string | null;
  isVerified: boolean;
  createdAt: string;
}

export interface AssociationMembership {
  association: Association;
  role: AssociationMemberRole;
}

interface AssociationRow {
  id: string;
  name: string;
  type: AssociationType;
  wilaya: string;
  contact_phone: string | null;
  contact_email: string | null;
  is_verified: boolean;
  created_at: string;
}

function toAssociation(row: AssociationRow): Association {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    wilaya: row.wilaya,
    contactPhone: row.contact_phone,
    contactEmail: row.contact_email,
    isVerified: row.is_verified,
    createdAt: row.created_at,
  };
}

const ASSOCIATION_COLUMNS = "id, name, type, wilaya, contact_phone, contact_email, is_verified, created_at";

async function requireUserId(action: string): Promise<string> {
  const { data, error } = await getSupabase().auth.getSession();
  if (error) throw error;
  if (!data.session) throw new Error(`Must be signed in to ${action}`);
  return data.session.user.id;
}

/** Public directory of verified associations, for the "verified by" badge and onboarding. */
export async function fetchVerifiedAssociations(): Promise<Association[]> {
  const { data, error } = await getSupabase()
    .from("associations")
    .select(ASSOCIATION_COLUMNS)
    .eq("is_verified", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data as AssociationRow[]).map(toAssociation);
}

/**
 * Apply to join the network. The row is created unverified; a Qatra admin
 * flips is_verified through the verify_association() database function, which
 * is the only route — the column is revoked from client roles entirely.
 *
 * The applicant is enrolled as the association's first admin in the same call,
 * which the "first member" RLS policy permits precisely because there is no
 * existing admin who could approve them.
 */
export async function applyForAssociation(input: {
  name: string;
  type: AssociationType;
  wilaya: string;
  contactPhone?: string;
  contactEmail?: string;
}): Promise<Association> {
  const supabase = getSupabase();
  const userId = await requireUserId("apply as an association");

  const { data, error } = await supabase
    .from("associations")
    .insert({
      name: input.name.trim(),
      type: input.type,
      wilaya: input.wilaya,
      contact_phone: input.contactPhone?.trim() || null,
      contact_email: input.contactEmail?.trim() || null,
    })
    .select(ASSOCIATION_COLUMNS)
    .single();
  if (error) throw error;

  const association = toAssociation(data as AssociationRow);

  const { error: memberError } = await supabase
    .from("association_members")
    .insert({ association_id: association.id, user_id: userId, role: "admin" });
  if (memberError) throw memberError;

  return association;
}

/** The associations this user belongs to, with the role they hold in each. */
export async function fetchMyMemberships(): Promise<AssociationMembership[]> {
  const userId = await requireUserId("view memberships");
  const { data, error } = await getSupabase()
    .from("association_members")
    .select(`role, associations(${ASSOCIATION_COLUMNS})`)
    .eq("user_id", userId);

  if (error) throw error;

  return (data as unknown as { role: AssociationMemberRole; associations: AssociationRow | null }[])
    .filter((row) => row.associations !== null)
    .map((row) => ({ role: row.role, association: toAssociation(row.associations!) }));
}

/**
 * Vouch for a request. RLS is the real gate — it re-checks that the caller
 * belongs to a verified association in the request's own wilaya — so a caller
 * that fudges associationId gets a row-level rejection, not a bad write.
 */
export async function verifyRequest(requestId: string, associationId: string): Promise<void> {
  const { error } = await getSupabase()
    .from("blood_requests")
    .update({ verified_by: associationId, verified_at: new Date().toISOString() })
    .eq("id", requestId);
  if (error) throw error;
}

/** Withdraw a verification, e.g. after a request turns out to be a duplicate. */
export async function unverifyRequest(requestId: string): Promise<void> {
  const { error } = await getSupabase()
    .from("blood_requests")
    .update({ verified_by: null, verified_at: null })
    .eq("id", requestId);
  if (error) throw error;
}

/** Qatra-staff only; the underlying function raises if the caller isn't an admin. */
export async function setAssociationVerified(associationId: string, verified: boolean): Promise<void> {
  const { error } = await getSupabase().rpc("verify_association", {
    p_association_id: associationId,
    p_verified: verified,
  });
  if (error) throw error;
}

export async function isPlatformAdmin(): Promise<boolean> {
  const { data, error } = await getSupabase().rpc("is_platform_admin");
  if (error) throw error;
  return Boolean(data);
}
