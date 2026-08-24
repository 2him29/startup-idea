import { ArrowLeft, BadgeCheck, ChevronRight, Clock, Link2, Users } from "lucide-react";
import { useCommitteeInbox, wilayaLabel } from "@weare/core";
import { useI18n } from "../i18n/LangContext";
import { RequestCardSkeleton } from "./Skeletons";

interface CommitteeHubProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  onApply: () => void;
}

/**
 * The Committee tab's landing screen: one tab covering the two things a
 * volunteer does — vouch for requests, and find donors.
 *
 * A hub rather than two tabs because association work is one job with two
 * tools, and the bottom bar only has five slots. It costs a tap on the way to
 * verifying, which is the deliberate trade: most people using this app are
 * never in a committee at all, and they get their Give slot back.
 */
export function CommitteeHub({ onBack, onNavigate, onApply }: CommitteeHubProps) {
  const { t, lang, dir } = useI18n();
  const chevronFlip = dir === "rtl" ? "scaleX(-1)" : undefined;
  const { association, waiting, stale, loading } = useCommitteeInbox();

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen px-5 pt-2 pb-[130px]" style={{ background: "linear-gradient(180deg,#FFF7F6 0%, #F6FBFC 58%, #FFFFFF 100%)" }}>
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="cursor-pointer w-[42px] h-[42px] rounded-[13px] border bg-white flex items-center justify-center"
          style={{ borderColor: "rgba(11,36,50,0.08)" }}
        >
          <ArrowLeft className="w-5 h-5" style={{ color: "#0B2432", transform: chevronFlip }} />
        </button>
        <div>
          <div className="text-xl font-extrabold" style={{ color: "#0B2432" }}>{t.committeeTitle}</div>
          {association && (
            <div className="text-[12.5px]" style={{ color: "#8496A0" }}>{association.name}</div>
          )}
        </div>
      </div>
      {children}
    </div>
  );

  if (loading) {
    return shell(<div className="flex flex-col gap-3">{[0, 1].map((i) => <RequestCardSkeleton key={i} />)}</div>);
  }

  // The tab is only offered to members, but a stale session or a revoked
  // membership can still land here — so the screen explains itself rather than
  // rendering two cards that lead nowhere.
  if (!association) {
    return shell(
      <div className="bg-white border rounded-[20px] p-6 text-center" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
        <span className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center" style={{ background: "#EEE9FB" }}>
          <BadgeCheck className="w-7 h-7" style={{ color: "#6B4FC0" }} />
        </span>
        <div className="mt-4 text-lg font-extrabold" style={{ color: "#0B2432" }}>{t.assocApplyTitle}</div>
        <div className="mt-1.5 text-[13.5px]" style={{ color: "#6B7C88" }}>{t.assocApplySub}</div>
        <button
          onClick={onApply}
          className="cursor-pointer mt-5 w-full h-[52px] rounded-2xl text-white text-[15px] font-extrabold border-none"
          style={{ background: "linear-gradient(135deg,#6B4FC0,#8A6BD6)" }}
        >
          {t.assocApplyCta}
        </button>
      </div>
    );
  }

  const card = (
    key: string,
    icon: typeof BadgeCheck,
    title: string,
    subtitle: string,
    screen: string,
    badge?: number
  ) => {
    const Icon = icon;
    return (
      <button
        key={key}
        data-testid={`committee-${key}`}
        onClick={() => onNavigate(screen)}
        className="cursor-pointer w-full border rounded-[20px] p-[18px] bg-white flex items-center gap-4 shadow-[0_10px_22px_-18px_rgba(11,36,50,0.55)]"
        style={{ borderColor: "rgba(11,36,50,0.06)", textAlign: "start" }}
      >
        <span className="w-12 h-12 rounded-[15px] flex items-center justify-center shrink-0" style={{ background: "#EEE9FB" }}>
          <Icon className="w-6 h-6" style={{ color: "#6B4FC0" }} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[15.5px] font-bold" style={{ color: "#0B2432" }}>{title}</span>
          <span className="block text-[12.5px] mt-0.5" style={{ color: "#8496A0" }}>{subtitle}</span>
        </span>
        {badge !== undefined && badge > 0 && (
          <span
            className="text-[12px] font-extrabold px-2.5 py-1 rounded-full shrink-0"
            style={{ background: "#E5484D", color: "#fff" }}
          >
            {badge}
          </span>
        )}
        <ChevronRight className="w-[19px] h-[19px] shrink-0" style={{ color: "#C0CCD2", transform: chevronFlip }} />
      </button>
    );
  };

  return shell(
    <div className="flex flex-col gap-3">
      {card(
        "verify",
        BadgeCheck,
        t.committeeVerifyCard,
        waiting > 0 ? t.committeeVerifySub.replace("{waiting}", String(waiting)) : t.committeeNoneToday,
        "association",
        waiting
      )}

      {card(
        "donors",
        Users,
        t.committeeDonorsCard,
        t.committeeDonorsSub.replace("{wilaya}", wilayaLabel(association.wilaya, lang)),
        "donor-search"
      )}

      {/* Third tool, and the one that decides whether the other two ever have
          anything to work with: a wilaya committee's real donor list is on
          paper, and until now the app had no way to ask for it. */}
      {card(
        "invites",
        Link2,
        t.invitesCard,
        t.invitesCardSub,
        "committee-invites"
      )}

      {/*
        Nothing in the product closes a request. Without this, a wilaya quietly
        accumulates month-old pleas still badged Critical — the exact failure of
        the WhatsApp chains Qatra is meant to replace. The committee is the only
        party positioned to ring the family and find out.
      */}
      {stale > 0 && (
        <div
          className="mt-1 rounded-[20px] p-[18px] flex items-start gap-3"
          style={{ background: "#FFF3E0", border: "1px solid rgba(245,135,31,0.3)", textAlign: "start" }}
        >
          <Clock className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#F5871F" }} />
          <div>
            <div className="text-[13.5px] font-extrabold" style={{ color: "#7A4A10" }}>
              {t.staleTitle.replace("{count}", String(stale))}
            </div>
            <div className="text-[12.5px] mt-1 leading-relaxed" style={{ color: "#8A6534" }}>{t.staleBody}</div>
          </div>
        </div>
      )}
    </div>
  );
}
