import { useEffect, useState } from "react";
import { fetchBloodRequests } from "./api";
import { bloodRequests as fallbackRequests, type BloodRequest } from "./requests";

/**
 * Live open requests from Supabase, shared by the Find screen and the
 * hospital dashboard. Falls back to the static mock list on error (e.g. no
 * env configured yet) so screens still render something sensible.
 */
export function useBloodRequests() {
  const [requests, setRequests] = useState<BloodRequest[]>(fallbackRequests);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchBloodRequests()
      .then((data) => {
        if (!cancelled) setRequests(data);
      })
      .catch((err) => {
        console.error("Failed to fetch blood requests, using fallback data", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { requests, loading };
}
