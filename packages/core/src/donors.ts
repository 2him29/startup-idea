import { getSupabase } from "./supabaseClient";

/**
 * Donor search with the 90-day whole-blood cooldown applied.
 *
 * A donor who gave recently is not *removed* from the network, only hidden
 * from search until they are eligible again, and they reappear on their own —
 * the cooldown is computed at read time from last_donation_at (see the
 * donor_eligibility view), so there is no scheduled job that could leave a
 * stale flag behind. This mirrors how comparable donor registries behave, and
 * it matters clinically: contacting an ineligible donor wastes an urgent
 * request's response window and teaches donors to ignore alerts.
 */

export interface DonorSearchResult {
  id: string;
  fullName: string;
  bloodType: string;
  wilaya: string | null;
  /** Null unless the donor opted into contact sharing — see `sharesPhone`. */
  phone: string | null;
  isEligible: boolean;
  daysUntilEligible: number;
  /** Whether this donor has agreed to be phoned directly by associations. */
  sharesPhone: boolean;
}

interface DonorSearchRow {
  id: string;
  full_name: string;
  blood_type: string;
  wilaya: string | null;
  phone: string | null;
  is_eligible: boolean;
  days_until_eligible: number;
  shares_phone: boolean;
}

export const ELIGIBILITY_INTERVAL_DAYS = 90;

/**
 * Donors an association may contact in its own wilaya.
 *
 * Goes through the search_donors() database function rather than reading the
 * tables: `profiles` and `donor_profiles` are readable only by their owner, so
 * the function is the audited exception — it re-checks that the caller belongs
 * to a verified association in that wilaya, and withholds phone numbers from
 * donors who have not opted into contact sharing. A client cannot widen any of
 * that by changing its query.
 *
 * `includeIneligible` shows donors still inside the 90-day cooldown, greyed
 * out with a countdown, so a coordinator can tell "nobody is available yet"
 * apart from "nobody exists here".
 */
export async function searchDonors(params: {
  wilaya: string;
  bloodType?: string;
  includeIneligible?: boolean;
}): Promise<DonorSearchResult[]> {
  const { data, error } = await getSupabase().rpc("search_donors", {
    p_wilaya: params.wilaya,
    p_blood_type: params.bloodType ?? null,
    p_include_ineligible: params.includeIneligible ?? false,
  });
  if (error) throw error;

  return (data as DonorSearchRow[]).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    bloodType: row.blood_type,
    wilaya: row.wilaya,
    phone: row.phone,
    isEligible: row.is_eligible,
    daysUntilEligible: row.days_until_eligible,
    sharesPhone: row.shares_phone,
  }));
}

/**
 * Mark a donation as completed: stamps the cooldown clock and closes the
 * request. Both date columns are written — last_donation_at drives eligibility,
 * last_donation_date still backs the profile editor and the certificate.
 */
export async function recordDonation(params: { requestId?: string }): Promise<void> {
  const supabase = getSupabase();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session) throw new Error("Must be signed in to record a donation");

  const now = new Date();
  const { error } = await supabase
    .from("donor_profiles")
    .update({ last_donation_at: now.toISOString(), last_donation_date: now.toISOString().slice(0, 10) })
    .eq("id", sessionData.session.user.id);
  if (error) throw error;

  if (params.requestId) {
    const { error: requestError } = await supabase
      .from("blood_requests")
      .update({ status: "fulfilled" })
      .eq("id", params.requestId);
    if (requestError) throw requestError;
  }
}
