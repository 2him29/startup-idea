import { useEffect, useState } from "react";
import { fetchBloodRequests } from "./api";
import { bloodRequests as fallbackRequests, type BloodRequest } from "./requests";
import { getCurrentProfile, getDonorProfile, type DonorProfile, type Profile } from "./auth";
import { getSupabase } from "./supabaseClient";
import { fetchHospitals, fallbackHospitals, type Hospital } from "./compensations";
import { fetchBloodDrives, fallbackDrives, type BloodDrive } from "./drives";

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

  /** Re-fetch the profile on demand, e.g. right after an edit-profile save. */
  const refresh = async () => {
    const p = await getCurrentProfile();
    setProfile(p);
  };

  return { profile, loading, refresh };
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

/** The signed-in donor's medical details (blood type, vitals, last donation). */
export function useDonorProfile() {
  const [donorProfile, setDonorProfile] = useState<DonorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getDonorProfile()
      .then((d) => {
        if (!cancelled) setDonorProfile(d);
      })
      .catch((err) => {
        console.error("Failed to fetch donor profile", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { donorProfile, loading };
}

/** Days between donations before a donor is eligible again (whole-blood rule used in Algeria). */
export const ELIGIBILITY_INTERVAL_DAYS = 90;

export interface Eligibility {
  eligible: boolean;
  /** 0..1 progress toward the next eligible date (1 = eligible now). */
  progress: number;
  daysLeft: number;
  nextEligibleDate: Date | null;
}

/** Eligibility from the last donation date; a donor with no recorded donation is eligible. */
export function computeEligibility(lastDonationDate: string | null): Eligibility {
  if (!lastDonationDate) return { eligible: true, progress: 1, daysLeft: 0, nextEligibleDate: null };
  const last = new Date(lastDonationDate + "T00:00:00");
  const next = new Date(last.getTime() + ELIGIBILITY_INTERVAL_DAYS * 86400000);
  const elapsedDays = (Date.now() - last.getTime()) / 86400000;
  const progress = Math.max(0, Math.min(1, elapsedDays / ELIGIBILITY_INTERVAL_DAYS));
  const daysLeft = Math.max(0, Math.ceil(ELIGIBILITY_INTERVAL_DAYS - elapsedDays));
  return { eligible: daysLeft === 0, progress, daysLeft, nextEligibleDate: next };
}

/** Upcoming community blood drives for the Drives screen. Mirrors useBloodRequests's fallback pattern. */
export function useBloodDrives() {
  const [drives, setDrives] = useState<BloodDrive[]>(fallbackDrives);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchBloodDrives()
      .then((data) => {
        if (!cancelled) setDrives(data);
      })
      .catch((err) => {
        console.error("Failed to fetch blood drives, using fallback data", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { drives, loading };
}
