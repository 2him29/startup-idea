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
  phone: string | null;
  isEligible: boolean;
  daysUntilEligible: number;
}

interface DonorRow {
  id: string;
  blood_type: string;
  last_donation_at: string | null;
  profiles: { full_name: string; wilaya: string | null; phone: string | null } | null;
}

export const ELIGIBILITY_INTERVAL_DAYS = 90;

/** Days left in the cooldown, computed the same way the SQL view does. */
function cooldown(lastDonationAt: string | null): { isEligible: boolean; daysUntilEligible: number } {
  if (!lastDonationAt) return { isEligible: true, daysUntilEligible: 0 };
  const elapsedDays = (Date.now() - new Date(lastDonationAt).getTime()) / 86400000;
  const daysLeft = Math.max(0, Math.ceil(ELIGIBILITY_INTERVAL_DAYS - elapsedDays));
  return { isEligible: daysLeft === 0, daysUntilEligible: daysLeft };
}

/**
 * Donors matching a blood type and/or wilaya.
 *
 * `includeIneligible` exists so a caller can choose between hiding cooling-off
 * donors outright (the default, for urgent matching) and showing them greyed
 * out with a countdown (useful on a console where the coordinator wants to
 * know that coverage exists but isn't available yet).
 */
export async function searchDonors(params: {
  bloodType?: string;
  wilaya?: string;
  includeIneligible?: boolean;
}): Promise<DonorSearchResult[]> {
  let query = getSupabase()
    .from("donor_profiles")
    .select("id, blood_type, last_donation_at, profiles(full_name, wilaya, phone)");

  if (params.bloodType) query = query.eq("blood_type", params.bloodType);

  const { data, error } = await query;
  if (error) throw error;

  const rows = data as unknown as DonorRow[];

  return rows
    .map((row) => {
      const { isEligible, daysUntilEligible } = cooldown(row.last_donation_at);
      return {
        id: row.id,
        fullName: row.profiles?.full_name ?? "—",
        bloodType: row.blood_type,
        wilaya: row.profiles?.wilaya ?? null,
        phone: row.profiles?.phone ?? null,
        isEligible,
        daysUntilEligible,
      };
    })
    .filter((donor) => (params.wilaya ? donor.wilaya === params.wilaya : true))
    .filter((donor) => (params.includeIneligible ? true : donor.isEligible))
    .sort((a, b) => Number(b.isEligible) - Number(a.isEligible) || a.fullName.localeCompare(b.fullName));
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
