import { useEffect, useState } from "react";
import { fetchBloodRequests } from "./api";
import { bloodRequests as fallbackRequests, type BloodRequest } from "./requests";
import { getCurrentProfile, type Profile } from "./auth";
import { getSupabase } from "./supabaseClient";
import { fetchHospitals, fallbackHospitals, type Hospital } from "./compensations";

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

/**
 * The signed-in user's profile, kept in sync with Supabase Auth's session
 * state (covers sign-out and token refresh) so screens don't need their own
 * auth-state wiring.
 */
export function useSession() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getCurrentProfile()
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch((err) => {
        console.error("Failed to load session", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const { data: subscription } = getSupabase().auth.onAuthStateChange(() => {
      getCurrentProfile()
        .then((p) => {
          if (!cancelled) setProfile(p);
        })
        .catch((err) => console.error("Failed to refresh session", err));
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return { profile, loading };
}

/**
 * Hospitals for the compensation form's <select>. Mirrors useBloodRequests:
 * seed with the static fallback so the control is usable immediately, then
 * swap in live rows once Supabase responds (and keep the fallback on error).
 */
export function useHospitals() {
  const [hospitals, setHospitals] = useState<Hospital[]>(fallbackHospitals);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchHospitals()
      .then((data) => {
        if (!cancelled && data.length > 0) setHospitals(data);
      })
      .catch((err) => {
        console.error("Failed to fetch hospitals, using fallback data", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { hospitals, loading };
}
