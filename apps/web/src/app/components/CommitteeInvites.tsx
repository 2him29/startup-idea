import { useState, type ReactNode } from "react";
import { ArrowLeft, Link2, Copy, Check, Share2, X, Users, Plus } from "lucide-react";
import {
  useMyMemberships,
  useAssociationInvites,
  createInvite,
  revokeInvite,
  inviteUrl,
  inviteIsLive,
  shareToWhatsApp,
  errorMessage,
  type AssociationInvite,
} from "@weare/core";
import { useI18n } from "../i18n/LangContext";
import { RequestCardSkeleton } from "./Skeletons";

interface CommitteeInvitesProps {
  onBack: () => void;
}

/**
 * The screen where a committee turns the donor list it already has into
 * accounts on Qatra.
 *
 * The intro paragraph is not decoration. A committee's first instinct is to
 * ask where to upload its member list, and the honest answer — that it cannot,
 * and why — has to arrive before the button rather than after someone has gone
 * looking for the import that does not exist.
 *
 * Creating a link is an administrator's act, because it publishes a standing
 * invitation under the association's name. Reading the list is not, so a
 * volunteer sees everything here and simply has no create button.
 */
export function CommitteeInvites({ onBack }: CommitteeInvitesProps) {
  const { t, dir } = useI18n();
  const flip = dir === "rtl" ? "scaleX(-1)" : undefined;

  const { verifying, loading: loadingMemberships } = useMyMemberships();
  const membership = verifying[0] ?? null;
  const association = membership?.association ?? null;
  const isAdmin = membership?.role === "admin";

  const { invites, loading, error, refresh } = useAssociationInvites(association?.id ?? null);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // One message, from either source. Kept as a string rather than testing
  // `failure || error` inline: the hook reports its error as `unknown`, which
  // widens the whole guard expression to unknown and stops it being renderable.
  const problem: string | null = failure ?? (error ? errorMessage(error, t.genericError) : null);

  const shell = (children: ReactNode) => (
    <div
      className="min-h-screen px-5 pt-2 pb-[130px]"
      style={{ background: "linear-gradient(180deg,#FFF7F6 0%, #F6FBFC 58%, #FFFFFF 100%)" }}
    >
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="cursor-pointer w-[42px] h-[42px] rounded-[13px] border bg-white flex items-center justify-center"
          style={{ borderColor: "rgba(11,36,50,0.08)" }}
        >
          <ArrowLeft className="w-5 h-5" style={{ color: "#0B2432", transform: flip }} />
        </button>
        <div>
          <div className="text-xl font-extrabold" style={{ color: "#0B2432" }}>{t.invitesTitle}</div>
          {association && <div className="text-[12.5px]" style={{ color: "#8496A0" }}>{association.name}</div>}
        </div>
      </div>
      {children}
    </div>
  );

  if (loadingMemberships || (association && loading)) {
    return shell(<div className="flex flex-col gap-3">{[0, 1].map((i) => <RequestCardSkeleton key={i} />)}</div>);
  }
  if (!association) return shell(null);

  const handleCreate = async () => {
    setBusy(true);
    setFailure(null);
    try {
      await createInvite(association.id, label);
      setLabel("");
      await refresh();
    } catch (err) {
      setFailure(errorMessage(err, t.genericError));
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async (invite: AssociationInvite) => {
    setBusy(true);
    setFailure(null);
    try {
      await revokeInvite(invite.id);
      await refresh();
    } catch (err) {
      setFailure(errorMessage(err, t.genericError));
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async (invite: AssociationInvite) => {
    try {
      await navigator.clipboard.writeText(inviteUrl(invite.code));
      setCopied(invite.id);
      window.setTimeout(() => setCopied((c) => (c === invite.id ? null : c)), 2000);
    } catch {
      // Clipboard access is refused in plenty of ordinary situations — an
      // insecure origin, a browser that wants a user gesture it did not see.
      // The code is on screen either way, so this is not worth an error.
    }
  };

  const statusChip = (invite: AssociationInvite) => {
    if (inviteIsLive(invite)) return null;
    const text = invite.revokedAt
      ? t.invitesRevoked
      : invite.expiresAt && new Date(invite.expiresAt) <= new Date()
        ? t.invitesExpired
        : t.invitesFull;
    return (
      <span
        className="text-[10.5px] font-extrabold px-2 py-0.5 rounded-full"
        style={{ background: "rgba(11,36,50,0.07)", color: "#6B7C88" }}
      >
        {text}
      </span>
    );
  };

  return shell(
    <div className="flex flex-col gap-3">
      {/* Said before the button, not after. See the note at the top of the file. */}
      <div
        className="rounded-[20px] p-[18px] flex items-start gap-3"
        style={{ background: "#EEF4FF", border: "1px solid rgba(11,36,50,0.06)", textAlign: "start" }}
      >
        <Link2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#3B62C0" }} />
        <span className="text-[12.5px] leading-relaxed" style={{ color: "#3A4A66" }}>{t.invitesIntro}</span>
      </div>

      {isAdmin ? (
        <div
          className="bg-white border rounded-[20px] p-[18px]"
          style={{ borderColor: "rgba(11,36,50,0.06)" }}
        >
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t.invitesLabelPlaceholder}
            data-testid="invite-label"
            className="w-full h-[46px] rounded-2xl border px-4 text-[14px] outline-none"
            style={{ borderColor: "rgba(11,36,50,0.12)", color: "#0B2432", textAlign: "start" }}
          />
          <button
            onClick={handleCreate}
            disabled={busy}
            data-testid="create-invite"
            className="cursor-pointer disabled:opacity-60 mt-3 w-full h-[50px] rounded-2xl text-white text-[15px] font-extrabold border-none flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#6B4FC0,#8A6BD6)" }}
          >
            <Plus className="w-[18px] h-[18px]" />
            {t.invitesCreate}
          </button>
        </div>
      ) : (
        <div
          className="rounded-[20px] px-[18px] py-3.5 text-[12.5px]"
          style={{ background: "#F7FAFB", border: "1px solid rgba(11,36,50,0.06)", color: "#6B7C88", textAlign: "start" }}
        >
          {t.invitesAdminOnly}
        </div>
      )}

      {problem && (
        <div
          className="rounded-2xl px-4 py-3 text-[13px]"
          style={{ background: "#FFECEC", color: "#8A3438", border: "1px solid #FBD3D3", textAlign: "start" }}
        >
          {problem}
        </div>
      )}

      {invites.length === 0 && !error ? (
        <div
          className="bg-white border rounded-[20px] p-6 text-[13.5px]"
          style={{ borderColor: "rgba(11,36,50,0.06)", color: "#6B7C88", textAlign: "start" }}
        >
          {t.invitesNone}
        </div>
      ) : (
        invites.map((invite) => (
          <div
            key={invite.id}
            data-testid="invite-row"
            className="bg-white border rounded-[20px] p-[18px]"
            style={{ borderColor: "rgba(11,36,50,0.06)", opacity: inviteIsLive(invite) ? 1 : 0.65 }}
          >
            <div className="flex items-center gap-2 flex-wrap">
              {/* The code is the thing a committee reads out loud, so it gets
                  monospace and letter spacing rather than the body font. */}
              <span
                className="text-[17px] font-extrabold tracking-[2px]"
                style={{ color: "#0B2432", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
              >
                {invite.code}
              </span>
              {statusChip(invite)}
            </div>
            {invite.label && (
              <div className="text-[12.5px] mt-0.5" style={{ color: "#8496A0", textAlign: "start" }}>{invite.label}</div>
            )}
            <div className="flex items-center gap-1.5 mt-2 text-[12.5px]" style={{ color: "#5A6B75" }}>
              <Users className="w-[14px] h-[14px]" />
              {t.invitesJoined.replace("{count}", String(invite.redeemed))}
              {invite.maxUses != null && ` / ${invite.maxUses}`}
            </div>

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => handleCopy(invite)}
                data-testid="copy-invite"
                className="cursor-pointer flex-1 h-[42px] rounded-xl border bg-white text-[13px] font-bold flex items-center justify-center gap-1.5"
                style={{ borderColor: "rgba(11,36,50,0.12)", color: "#0B2432" }}
              >
                {copied === invite.id
                  ? <Check className="w-4 h-4" style={{ color: "#12B76A" }} strokeWidth={3} />
                  : <Copy className="w-4 h-4" />}
                {copied === invite.id ? t.invitesCopied : t.invitesCopy}
              </button>
              {/* WhatsApp, because that is how a committee already reaches its
                  donors — the same reason the request share button exists. */}
              <button
                onClick={() =>
                  shareToWhatsApp(
                    `${t.inviteJoinTitle.replace("{association}", association.name)}\n${inviteUrl(invite.code)}`
                  )
                }
                className="cursor-pointer w-[42px] h-[42px] rounded-xl border bg-white flex items-center justify-center shrink-0"
                style={{ borderColor: "rgba(11,36,50,0.12)" }}
              >
                <Share2 className="w-4 h-4" style={{ color: "#0B2432" }} />
              </button>
              {isAdmin && inviteIsLive(invite) && (
                <button
                  onClick={() => handleRevoke(invite)}
                  disabled={busy}
                  data-testid="revoke-invite"
                  className="cursor-pointer disabled:opacity-60 w-[42px] h-[42px] rounded-xl border bg-white flex items-center justify-center shrink-0"
                  style={{ borderColor: "rgba(229,72,77,0.35)" }}
                  aria-label={t.invitesRevoke}
                >
                  <X className="w-4 h-4" style={{ color: "#E5484D" }} />
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
