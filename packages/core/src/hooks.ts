import { useEffect, useState } from "react";
import { fetchBloodRequests } from "./api";
import { bloodRequests as fallbackRequests, type BloodRequest } from "./requests";
import { getCurrentProfile, getDonorProfile, type DonorProfile, type Profile } from "./auth";
import { getSupabase } from "./supabaseClient";
import { fetchHospitals, fallbackHospitals, type Hospital } from "./compensations";
import { fetchBloodDrives, fallbackDrives, type BloodDrive } from "./drives";
import { ELIGIBILITY_INTERVAL_DAYS } from "./donors";
import { fetchMyMemberships, type AssociationMembership } from "./associations";
import { fetchRequestsForWilaya } from "./api";
import { isPhoneVerified } from "./otp";

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

  /** Re-fetch on demand, e.g. right after publishing a new request. */
  const refresh = async () => {
    const data = await fetchBloodRequests();
    setRequests(data);
  };

  return { requests, loading, refresh };
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

export interface Eligibility {
  eligible: boolean;
  /** 0..1 progress toward the next eligible date (1 = eligible now). */
  progress: number;
  daysLeft: number;
  nextEligibleDate: Date | null;
}

/**
 * Eligibility from the last donation; a donor with no recorded donation is
 * eligible. Accepts either storage format — the legacy date-only
 * `last_donation_date` ("2026-05-01") or the newer `last_donation_at`
 * timestamptz — because both columns are live during the patient-model
 * migration. A bare date is read as local midnight, which is what the profile
 * editor means when it stores one.
 */
export function computeEligibility(lastDonation: string | null): Eligibility {
  if (!lastDonation) return { eligible: true, progress: 1, daysLeft: 0, nextEligibleDate: null };
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(lastDonation);
  const last = new Date(isDateOnly ? `${lastDonation}T00:00:00` : lastDonation);
  const next = new Date(last.getTime() + ELIGIBILITY_INTERVAL_DAYS * 86400000);
  const elapsedDays = (Date.now() - last.getTime()) / 86400000;
  const progress = Math.max(0, Math.min(1, elapsedDays / ELIGIBILITY_INTERVAL_DAYS));
  const daysLeft = Math.max(0, Math.ceil(ELIGIBILITY_INTERVAL_DAYS - elapsedDays));
  return { eligible: daysLeft === 0, progress, daysLeft, nextEligibleDate: next };
}

/**
 * The associations this user belongs to. Drives whether the association
 * console is reachable at all: no membership, no console.
 */
export function useMyMemberships() {
  const [memberships, setMemberships] = useState<AssociationMembership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      fetchMyMemberships()
        .then((data) => {
          if (!cancelled) setMemberships(data);
        })
        .catch((err) => {
          console.error("Failed to fetch association memberships", err);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    load();

    /**
     * Reload whenever auth changes, not only on mount.
     *
     * Both navigation components call this hook above the early return that
     * hides them, so its first run happens on the splash screen with nobody
     * signed in. A mount-only fetch therefore answered "no memberships" and
     * never asked again, hiding the Committee tab for the whole session and
     * making the hub unreachable for the volunteers it exists for.
     */
    const { data: subscription } = getSupabase().auth.onAuthStateChange(() => load());

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  /** Only verified associations confer the right to vouch for a request. */
  const verifying = memberships.filter((m) => m.association.isVerified);

  return { memberships, verifying, loading };
}

/** Open requests in one wilaya — the association console's working list. */
export function useWilayaRequests(wilaya: string | null) {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wilaya) {
      setRequests([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchRequestsForWilaya(wilaya)
      .then((data) => {
        if (!cancelled) setRequests(data);
      })
      .catch((err) => {
        console.error("Failed to fetch wilaya requests", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [wilaya]);

  const refresh = async () => {
    if (!wilaya) return;
    setRequests(await fetchRequestsForWilaya(wilaya));
  };

  return { requests, loading, refresh };
}

/**
 * Whether the signed-in account has a verified phone. Gates the patient
 * request form: RLS rejects the insert without it, so the UI checks first and
 * routes to verification rather than letting the user fill in a form that
 * cannot be submitted.
 */
export function usePhoneVerified() {
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    isPhoneVerified()
      .then((v) => {
        if (!cancelled) setVerified(v);
      })
      .catch((err) => console.error("Failed to check phone verification", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = async () => setVerified(await isPhoneVerified());

  return { verified, loading, refresh };
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

/** A request open longer than this reads as stale on the committee hub. */
const STALE_AFTER_DAYS = 30;

/**
 * Everything the Committee tab needs, in one call.
 *
 * The nav has to know two things before it can render — whether this account is
 * in an approved committee at all, and how many requests are waiting — so
 * gathering them here keeps that decision out of the navigation component.
 *
 * `stale` counts requests nobody has closed in a month. Nothing in the product
 * expires a request, so without surfacing this a wilaya slowly fills with
 * month-old pleas still marked Critical, which is exactly the WhatsApp problem
 * Qatra exists to fix.
 */
export function useCommitteeInbox() {
  const { verifying, loading: loadingMemberships } = useMyMemberships();
  const association = verifying[0]?.association ?? null;
  const { requests, loading, refresh } = useWilayaRequests(association?.wilaya ?? null);

  const waiting = requests.filter((r) => !r.verifiedByName).length;
  const staleBefore = Date.now() - STALE_AFTER_DAYS * 86400000;
  const stale = requests.filter((r) => new Date(r.createdAt).getTime() < staleBefore).length;

  return {
    isMember: verifying.length > 0,
    association,
    memberships: verifying,
    requests,
    waiting,
    stale,
    loading: loadingMemberships || loading,
    refresh,
  };
}
