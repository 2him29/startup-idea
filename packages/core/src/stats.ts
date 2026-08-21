import { getSupabase } from "./supabaseClient";

export interface PublicStats {
  /** Open requests right now, across the country. */
  openRequests: number;
  /** How many wilayas those requests are spread across. */
  wilayas: number;
  /** How many carry an association's badge. */
  verified: number;
}

/**
 * The live state of the network, for the splash screen.
 *
 * Deliberately counts rather than rows: a signed-out visitor has no business
 * reading who needs what, and this needs no identities to be worth showing.
 * It reads the same columns the Find screen already exposes publicly, so it
 * widens nothing.
 *
 * Returns null on any failure instead of zeroes. "0 requests open" is a
 * claim — a wrong and rather bleak one — where showing nothing is merely
 * quiet. The splash renders fine without it.
 */
export async function fetchPublicStats(): Promise<PublicStats | null> {
  try {
    const { data, error } = await getSupabase()
      .from("blood_requests")
      .select("wilaya, verified_by")
      .eq("status", "open");

    if (error || !data) return null;

    const rows = data as { wilaya: string | null; verified_by: string | null }[];
    if (rows.length === 0) return null;

    return {
      openRequests: rows.length,
      wilayas: new Set(rows.map((r) => r.wilaya).filter(Boolean)).size,
      verified: rows.filter((r) => r.verified_by).length,
    };
  } catch {
    return null;
  }
}
