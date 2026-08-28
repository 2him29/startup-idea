import { useEffect, useState } from "react";
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

/**
 * How a wilaya is actually doing: how many pleas were answered, and how fast.
 *
 * Both halves matter and the second is meaningless alone. A median computed
 * over answered requests only would report "four minutes" for a wilaya where
 * nine pleas in ten go nowhere and the tenth was lucky — the failures vanish
 * precisely because they failed. Callers are expected to show `answered` out of
 * `requests` beside the time, never the time by itself.
 */
export interface WilayaResponseStats {
  /** Requests posted in this wilaya within the window. */
  requests: number;
  /** How many of them got at least one donor who has not withdrawn. */
  answered: number;
  /** Median minutes from posting to the first donor, or null if none were. */
  medianMinutes: number | null;
  fastestMinutes: number | null;
}

export async function fetchWilayaResponseStats(
  wilaya: string,
  days = 90
): Promise<WilayaResponseStats | null> {
  try {
    const { data, error } = await getSupabase().rpc("wilaya_response_stats", {
      p_wilaya: wilaya,
      p_days: days,
    });
    if (error || !data) return null;

    const row = (data as {
      requests: number;
      answered: number;
      median_minutes: string | number | null;
      fastest_minutes: string | number | null;
    }[])[0];
    if (!row) return null;

    // Postgres numerics arrive as strings; null must survive as null rather
    // than becoming 0, which would read as help arriving instantly.
    const num = (v: string | number | null) => (v === null ? null : Number(v));

    return {
      requests: Number(row.requests),
      answered: Number(row.answered),
      medianMinutes: num(row.median_minutes),
      fastestMinutes: num(row.fastest_minutes),
    };
  } catch {
    return null;
  }
}

export function useWilayaResponseStats(wilaya: string | null) {
  const [stats, setStats] = useState<WilayaResponseStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wilaya) {
      setStats(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchWilayaResponseStats(wilaya)
      .then((s) => {
        if (!cancelled) setStats(s);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [wilaya]);

  return { stats, loading };
}
