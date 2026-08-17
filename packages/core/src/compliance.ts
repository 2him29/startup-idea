import { getSupabase } from "./supabaseClient";

/**
 * Data-protection obligations for health data under Algeria's Loi 18-07 /
 * 25-11: recorded consent, and a route for data-subject rights.
 *
 * ---------------------------------------------------------------------------
 * PRODUCT INVARIANT — no donor payment or reward, anywhere.
 *
 * Blood donation in Algeria is voluntary and unpaid, and paying donors (in
 * cash, vouchers, credit, priority, or anything exchangeable for them)
 * compromises the safety of the supply: a donor with a financial motive has a
 * reason to conceal a disqualifying history. Nothing in Qatra may introduce
 * donor payment, cash-equivalent rewards, or paid-priority matching.
 *
 * This is a review gate, not a preference. Any change adding a price, a
 * payout, a wallet, a redeemable point, or a paid tier that reorders donors
 * or requests should be rejected in code review and raised with the product
 * owner. Non-transferable recognition — the streak counter, the donation
 * certificate — is fine precisely because it cannot be exchanged for anything.
 * ---------------------------------------------------------------------------
 *
 * TODO(compliance): consent records and data-subject requests are written to a
 * Supabase region outside Algeria. Resolve hosting (Supabase region vs. local
 * hosting vs. ANPDP transfer authorization) before onboarding real patients.
 */

export type ConsentPurpose = "health_data" | "contact_sharing";

/**
 * The version of each consent text currently shown in the UI.
 *
 * Bump the version whenever the wording changes in a way that alters what the
 * user agreed to. Consent already given against an older version stays on
 * record as that older version — hasCurrentConsent() then reports false and
 * the user is asked again, which is the whole point of versioning it.
 */
export const CONSENT_VERSIONS: Record<ConsentPurpose, string> = {
  health_data: "health-data-v1",
  contact_sharing: "contact-sharing-v1",
};

export type DsrKind = "export" | "correction" | "deletion";
export type DsrStatus = "open" | "in_progress" | "resolved" | "rejected";

export interface DataSubjectRequest {
  id: string;
  kind: DsrKind;
  status: DsrStatus;
  details: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

interface DsrRow {
  id: string;
  kind: DsrKind;
  status: DsrStatus;
  details: string | null;
  created_at: string;
  resolved_at: string | null;
}

async function requireUserId(action: string): Promise<string> {
  const { data, error } = await getSupabase().auth.getSession();
  if (error) throw error;
  if (!data.session) throw new Error(`Must be signed in to ${action}`);
  return data.session.user.id;
}

/**
 * Record consent for one specific purpose, stamped with the version of the
 * text the user actually read. Health-data consent is captured separately from
 * everything else on purpose: a bundled "I accept the terms" tick is not
 * specific consent for processing medical data, so it would not stand up.
 */
export async function recordConsent(purpose: ConsentPurpose): Promise<void> {
  const userId = await requireUserId("record consent");
  const { error } = await getSupabase().from("consent_records").insert({
    user_id: userId,
    purpose,
    consent_version: CONSENT_VERSIONS[purpose],
  });
  if (error) throw error;
}

/** True only for consent against the *current* version, still un-withdrawn. */
export async function hasCurrentConsent(purpose: ConsentPurpose): Promise<boolean> {
  const userId = await requireUserId("check consent");
  const { data, error } = await getSupabase()
    .from("consent_records")
    .select("id")
    .eq("user_id", userId)
    .eq("purpose", purpose)
    .eq("consent_version", CONSENT_VERSIONS[purpose])
    .is("revoked_at", null)
    .limit(1);

  if (error) throw error;
  return (data as { id: string }[]).length > 0;
}

/**
 * Withdraw consent. The row is stamped rather than deleted — it is the
 * evidence that consent was held during the period it covers, so erasing it
 * would destroy the record of lawful processing that already happened.
 */
export async function withdrawConsent(purpose: ConsentPurpose): Promise<void> {
  const userId = await requireUserId("withdraw consent");
  const { error } = await getSupabase()
    .from("consent_records")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("purpose", purpose)
    .is("revoked_at", null);
  if (error) throw error;
}

/**
 * Raise an access/correction/erasure request.
 *
 * Intentionally a queue worked by a human for now: automating erasure across
 * patients, requests, pledges, and consent evidence needs a retention policy
 * decided first (which records must survive an erasure, and for how long).
 * The user-facing contract doesn't change when that automation lands.
 */
export async function submitDataSubjectRequest(kind: DsrKind, details?: string): Promise<void> {
  const userId = await requireUserId("submit a data request");
  const { error } = await getSupabase().from("data_subject_requests").insert({
    user_id: userId,
    kind,
    details: details?.trim() || null,
  });
  if (error) throw error;
}

export async function fetchMyDataSubjectRequests(): Promise<DataSubjectRequest[]> {
  const userId = await requireUserId("view data requests");
  const { data, error } = await getSupabase()
    .from("data_subject_requests")
    .select("id, kind, status, details, created_at, resolved_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as DsrRow[]).map((row) => ({
    id: row.id,
    kind: row.kind,
    status: row.status,
    details: row.details,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  }));
}
