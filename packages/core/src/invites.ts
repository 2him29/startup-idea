import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "./supabaseClient";

/**
 * Committee invite links.
 *
 * Everything here goes through RPC rather than table reads, and that is worth
 * knowing before changing it. A select naming a column the database does not
 * have makes PostgREST reject the whole query with a 400, and the fallback
 * data in the hooks then renders plausible mock rows over the top of the
 * failure. An RPC that does not exist yet fails alone, loudly, and takes
 * nothing else down with it — which is the behaviour you want for a feature
 * whose migration may not have reached every environment.
 */

export interface AssociationInvite {
  id: string;
  code: string;
  label: string | null;
  createdAt: string;
  expiresAt: string | null;
  maxUses: number | null;
  revokedAt: string | null;
  /** How many donors have joined through this link. */
  redeemed: number;
}

/** What an anonymous visitor learns from a code, and no more. */
export interface InviteDescription {
  associationName: string;
  wilaya: string;
  isValid: boolean;
}

interface InviteRow {
  id: string;
  code: string;
  label: string | null;
  created_at: string;
  expires_at: string | null;
  max_uses: number | null;
  revoked_at: string | null;
}

/**
 * The share URL for a code.
 *
 * Built from the running origin rather than a constant so the same code works
 * from a local dev server, the GitHub Pages deployment under its subpath, and
 * whatever the app is eventually served from. A committee that printed a
 * hardcoded domain on a poster would be stuck with it.
 */
export function inviteUrl(code: string): string {
  if (typeof window === "undefined") return code;
  const { origin, pathname } = window.location;
  return `${origin}${pathname}?invite=${encodeURIComponent(code)}`;
}

/** Reads a code out of the current URL, if the app was opened through a link. */
export function inviteCodeFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const code = new URLSearchParams(window.location.search).get("invite");
  return code && code.trim() ? code.trim().toUpperCase() : null;
}

/**
 * Removes the code from the address bar once it has been dealt with.
 *
 * Without this a refresh re-runs the invite flow, and — worse — the code stays
 * in the URL to be copied into a screenshot or a bug report by someone who has
 * no idea it is a credential of sorts.
 */
export function clearInviteFromUrl(): void {
  if (typeof window === "undefined" || !window.history?.replaceState) return;
  const url = new URL(window.location.href);
  url.searchParams.delete("invite");
  window.history.replaceState({}, "", url.toString());
}

export async function describeInvite(code: string): Promise<InviteDescription | null> {
  const { data, error } = await getSupabase().rpc("describe_invite", { p_code: code });
  if (error) throw error;
  const row = (data as { association_name: string; wilaya: string; is_valid: boolean }[] | null)?.[0];
  if (!row) return null;
  return { associationName: row.association_name, wilaya: row.wilaya, isValid: row.is_valid };
}

export async function redeemInvite(code: string): Promise<{ associationName: string; wilaya: string }> {
  const { data, error } = await getSupabase().rpc("redeem_association_invite", { p_code: code });
  if (error) throw error;
  const row = (data as { association_name: string; wilaya: string }[] | null)?.[0];
  if (!row) throw new Error("Invite accepted but no association returned");
  return { associationName: row.association_name, wilaya: row.wilaya };
}

export async function createInvite(
  associationId: string,
  label?: string | null,
  expiresAt?: string | null,
  maxUses?: number | null
): Promise<void> {
  const { error } = await getSupabase().rpc("create_association_invite", {
    p_association_id: associationId,
    p_label: label ?? null,
    p_expires_at: expiresAt ?? null,
    p_max_uses: maxUses ?? null,
  });
  if (error) throw error;
}

export async function revokeInvite(inviteId: string): Promise<void> {
  const { error } = await getSupabase().rpc("revoke_association_invite", { p_invite_id: inviteId });
  if (error) throw error;
}

export async function fetchInvites(associationId: string): Promise<AssociationInvite[]> {
  const supabase = getSupabase();

  // Two round trips rather than an embed. The counts come from a SECURITY
  // DEFINER function so that a committee can see totals without the redemption
  // rows themselves having to be readable through a join.
  const [rows, counts] = await Promise.all([
    supabase
      .from("association_invites")
      .select("id, code, label, created_at, expires_at, max_uses, revoked_at")
      .eq("association_id", associationId)
      .order("created_at", { ascending: false }),
    supabase.rpc("association_invite_counts", { p_association_id: associationId }),
  ]);

  if (rows.error) throw rows.error;
  if (counts.error) throw counts.error;

  const byId = new Map<string, number>();
  for (const c of (counts.data as { invite_id: string; redeemed: number }[] | null) ?? []) {
    byId.set(c.invite_id, c.redeemed);
  }

  return ((rows.data as InviteRow[] | null) ?? []).map((r) => ({
    id: r.id,
    code: r.code,
    label: r.label,
    createdAt: r.created_at,
    expiresAt: r.expires_at,
    maxUses: r.max_uses,
    revokedAt: r.revoked_at,
    redeemed: byId.get(r.id) ?? 0,
  }));
}

/** Whether an invite can still be accepted, computed the same way the SQL does. */
export function inviteIsLive(invite: AssociationInvite): boolean {
  if (invite.revokedAt) return false;
  if (invite.expiresAt && new Date(invite.expiresAt) <= new Date()) return false;
  if (invite.maxUses != null && invite.redeemed >= invite.maxUses) return false;
  return true;
}

export function useAssociationInvites(associationId: string | null) {
  const [invites, setInvites] = useState<AssociationInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const refresh = useCallback(() => {
    if (!associationId) {
      setInvites([]);
      setLoading(false);
      return Promise.resolve();
    }
    setLoading(true);
    return fetchInvites(associationId)
      .then((data) => {
        setInvites(data);
        setError(null);
      })
      // Surfaced rather than swallowed. There is no sensible fallback for "the
      // links your committee handed out": inventing one would show a committee
      // codes that do not exist, and they would give them to people.
      .catch((err) => {
        console.error("Failed to fetch association invites", err);
        setError(err);
      })
      .finally(() => setLoading(false));
  }, [associationId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { invites, loading, error, refresh };
}

const PENDING_KEY = "qatra-invite";

export interface PendingInvite {
  /** Details of the invite being held, once described. */
  info: InviteDescription | null;
  /** Set once the invite has actually been accepted. */
  accepted: { associationName: string; wilaya: string } | null;
  dismiss: () => void;
}

/**
 * Holds an invite code from the moment the link is opened until there is an
 * account to attach it to.
 *
 * The two halves rarely happen together. Someone follows a committee's link,
 * meets a signed-out app, signs up, verifies a phone number, and only then is
 * there a user to record — several minutes and a page reload later. So the
 * code goes to localStorage on arrival and the redemption waits for a session.
 *
 * It watches auth state rather than only checking on mount, for the same
 * reason useMyMemberships had to: the first run happens on the splash screen
 * with nobody signed in, and a hook that asked once would answer "not signed
 * in" and never look again — which here would mean the invite silently did
 * nothing for every donor who followed a link without already having an
 * account, in other words all of them.
 */
export function usePendingInvite(): PendingInvite {
  const [code, setCode] = useState<string | null>(null);
  const [info, setInfo] = useState<InviteDescription | null>(null);
  const [accepted, setAccepted] = useState<{ associationName: string; wilaya: string } | null>(null);

  useEffect(() => {
    const fromUrl = inviteCodeFromUrl();
    if (fromUrl) {
      try {
        window.localStorage.setItem(PENDING_KEY, fromUrl);
      } catch {
        // Private mode, or storage disabled. The code still works for this
        // page view; it just will not survive the signup reload.
      }
      clearInviteFromUrl();
      setCode(fromUrl);
      return;
    }
    try {
      setCode(window.localStorage.getItem(PENDING_KEY));
    } catch {
      setCode(null);
    }
  }, []);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    describeInvite(code)
      .then((d) => {
        if (!cancelled) setInfo(d);
      })
      .catch((err) => {
        console.error("Failed to describe invite", err);
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;

    const attempt = async () => {
      const { data } = await getSupabase().auth.getSession();
      if (!data.session || cancelled) return;
      try {
        const result = await redeemInvite(code);
        if (cancelled) return;
        setAccepted(result);
        setCode(null);
        window.localStorage.removeItem(PENDING_KEY);
      } catch (err) {
        // A withdrawn, expired or exhausted invite must not sit in storage
        // retrying on every auth event for the rest of the install's life.
        console.error("Failed to redeem invite", err);
        if (!cancelled) setCode(null);
        window.localStorage.removeItem(PENDING_KEY);
      }
    };

    void attempt();
    const { data: sub } = getSupabase().auth.onAuthStateChange(() => {
      void attempt();
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [code]);

  const dismiss = useCallback(() => {
    setCode(null);
    setInfo(null);
    setAccepted(null);
    try {
      window.localStorage.removeItem(PENDING_KEY);
    } catch {
      /* nothing to clear */
    }
  }, []);

  return { info: code ? info : null, accepted, dismiss };
}
