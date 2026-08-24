import { BadgeCheck, Link2, X, AlertTriangle } from "lucide-react";
import { usePendingInvite } from "@weare/core";
import { useI18n } from "../i18n/LangContext";

/**
 * What a donor sees after following a committee's invite link.
 *
 * Mounted above the screen switch rather than inside a screen, because the
 * link can land anywhere: a first-time visitor meets the splash, someone who
 * already has the app open lands on whatever they were last looking at. There
 * is no router to hang a route off, and adding a screen for this would mean
 * the invite only worked from one starting point.
 *
 * It names the committee before asking for anything. A link that says "sign up
 * to continue" and nothing else is indistinguishable from every other link
 * anyone has ever been sent, and this one is asking for a health-related
 * account — the association's name is the whole reason to trust it.
 */
export function InviteBanner() {
  const { t } = useI18n();
  const { offer, accepted, invalid, dismiss } = usePendingInvite();

  if (!offer && !accepted && !invalid) return null;

  // Accepted wins over invalid: a donor who got in before the link was
  // withdrawn is in, and telling them otherwise would be wrong.
  const tone = accepted
    ? { bg: "#EAF6EF", border: "rgba(18,183,106,0.3)", fg: "#0E7A4B", Icon: BadgeCheck }
    : invalid
      ? { bg: "#FFF3E0", border: "rgba(245,135,31,0.3)", fg: "#8A5A1F", Icon: AlertTriangle }
      : { bg: "#EEF4FF", border: "rgba(59,98,192,0.3)", fg: "#3A4A66", Icon: Link2 };

  const title = accepted
    ? t.inviteAccepted.replace("{association}", accepted.associationName)
    : invalid
      ? t.inviteInvalidTitle
      : t.inviteJoinTitle.replace("{association}", offer?.associationName ?? "");

  const body = accepted ? null : invalid ? t.inviteInvalidBody : t.inviteJoinBody;

  const { Icon } = tone;

  return (
    <div className="fixed top-0 inset-x-0 z-[40] px-4 pt-3" data-testid="invite-banner">
      <div
        className="mx-auto max-w-[520px] rounded-2xl px-4 py-3 flex items-start gap-3 shadow-[0_14px_30px_-18px_rgba(11,36,50,0.6)]"
        style={{ background: tone.bg, border: `1px solid ${tone.border}`, textAlign: "start" }}
      >
        <Icon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: tone.fg }} />
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-extrabold" style={{ color: tone.fg }}>{title}</div>
          {body && (
            <div className="text-[12.5px] mt-0.5 leading-relaxed" style={{ color: tone.fg, opacity: 0.85 }}>
              {body}
            </div>
          )}
        </div>
        <button
          onClick={dismiss}
          data-testid="dismiss-invite"
          className="cursor-pointer w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border-none bg-transparent"
          aria-label={t.dismiss}
        >
          <X className="w-4 h-4" style={{ color: tone.fg, opacity: 0.7 }} />
        </button>
      </div>
    </div>
  );
}
