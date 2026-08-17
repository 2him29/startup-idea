import { useState } from "react";
import { ArrowLeft, BadgeCheck, Clock, Droplet, MapPin, ShieldQuestion, X } from "lucide-react";
import {
  unitsLabel,
  urgencyStyle,
  urgencyLabel,
  useMyMemberships,
  useWilayaRequests,
  verifyRequest,
  unverifyRequest,
  wilayaLabel,
} from "@weare/core";
import { useI18n } from "../i18n/LangContext";
import { useToast } from "./Toast";
import { RequestCardSkeleton } from "./Skeletons";
import { VerifiedBadge } from "./VerifiedBadge";

interface AssociationConsoleProps {
  onBack: () => void;
  onApply: () => void;
}

/**
 * Where an association vouches for requests in its own wilaya.
 *
 * The wilaya scope is not a UI convenience — it mirrors the RLS rule exactly
 * (can_verify_in_wilaya), so showing requests from elsewhere would only offer
 * buttons the database rejects. An association with memberships in several
 * wilayas gets a switcher.
 */
export function AssociationConsole({ onBack, onApply }: AssociationConsoleProps) {
  const { t, lang, dir } = useI18n();
  const toast = useToast();
  const chevronFlip = dir === "rtl" ? "scaleX(-1)" : undefined;

  const { memberships, verifying, loading: loadingMemberships } = useMyMemberships();
  const [activeIndex, setActiveIndex] = useState(0);

  const active = verifying[activeIndex]?.association ?? null;
  const { requests, loading, refresh } = useWilayaRequests(active?.wilaya ?? null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleVerify = async (requestId: string) => {
    if (!active) return;
    setBusyId(requestId);
    try {
      await verifyRequest(requestId, active.id);
      await refresh();
      toast("success", t.verifiedToast);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : t.genericError);
    } finally {
      setBusyId(null);
    }
  };

  const handleUnverify = async (requestId: string) => {
    setBusyId(requestId);
    try {
      await unverifyRequest(requestId);
      await refresh();
      toast("info", t.unverifiedToast);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : t.genericError);
    } finally {
      setBusyId(null);
    }
  };

  const header = (
    <div className="flex items-center gap-3 mb-4">
      <button
        onClick={onBack}
        className="cursor-pointer w-[42px] h-[42px] rounded-[13px] border bg-white flex items-center justify-center"
        style={{ borderColor: "rgba(11,36,50,0.08)" }}
      >
        <ArrowLeft className="w-5 h-5" style={{ color: "#0B2432", transform: chevronFlip }} />
      </button>
      <div>
        <div className="text-xl font-extrabold" style={{ color: "#0B2432" }}>{t.assocConsoleTitle}</div>
        {active && (
          <div className="text-[12.5px]" style={{ color: "#8496A0" }}>
            {t.assocConsoleSub.replace("{wilaya}", wilayaLabel(active.wilaya, lang))}
          </div>
        )}
      </div>
    </div>
  );

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen px-5 pt-2 pb-[130px]" style={{ background: "linear-gradient(180deg,#FFF7F6 0%, #F6FBFC 58%, #FFFFFF 100%)" }}>
      {header}
      {children}
    </div>
  );

  if (loadingMemberships) {
    return shell(<div className="flex flex-col gap-3">{[0, 1, 2].map((i) => <RequestCardSkeleton key={i} />)}</div>);
  }

  // Belongs to an association, but none of them approved yet — or belongs to
  // none at all. Both land on the same explainer, since the only useful next
  // action in either case is to wait or to apply.
  if (!active) {
    const hasPending = memberships.length > 0;
    return shell(
      <div className="bg-white border rounded-[20px] p-6 text-center" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
        <span className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center" style={{ background: "#EEE9FB" }}>
          <ShieldQuestion className="w-7 h-7" style={{ color: "#6B4FC0" }} />
        </span>
        <div className="mt-4 text-lg font-extrabold" style={{ color: "#0B2432" }}>
          {hasPending ? t.assocPendingTitle : t.assocApplyTitle}
        </div>
        <div className="mt-1.5 text-[13.5px]" style={{ color: "#6B7C88" }}>
          {hasPending ? t.assocPendingSub : t.assocApplySub}
        </div>
        {!hasPending && (
          <button
            onClick={onApply}
            className="cursor-pointer mt-5 w-full h-[52px] rounded-2xl text-white text-[15px] font-extrabold"
            style={{ background: "linear-gradient(135deg,#6B4FC0,#8A6BD6)" }}
          >
            {t.assocApplyCta}
          </button>
        )}
      </div>
    );
  }

  return shell(
    <>
      {verifying.length > 1 && (
        <div className="flex gap-2 mb-3.5 flex-wrap">
          {verifying.map((m, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={m.association.id}
                onClick={() => setActiveIndex(i)}
                className="cursor-pointer text-[12.5px] font-bold px-3.5 py-2 rounded-full border"
                style={
                  isActive
                    ? { background: "#6B4FC0", color: "#fff", borderColor: "#6B4FC0" }
                    : { background: "#fff", color: "#5A6B75", borderColor: "rgba(11,36,50,0.1)" }
                }
              >
                {wilayaLabel(m.association.wilaya, lang)}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2 mb-4 rounded-2xl px-4 py-3" style={{ background: "#EEE9FB", border: "1px solid rgba(107,79,192,0.2)" }}>
        <BadgeCheck className="w-[18px] h-[18px] shrink-0" style={{ color: "#6B4FC0" }} />
        <span className="text-[13px] font-bold" style={{ color: "#3F2E77", textAlign: "start" }}>{active.name}</span>
      </div>

      <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
        {loading && [0, 1].map((i) => <RequestCardSkeleton key={`sk-${i}`} />)}

        {!loading && requests.length === 0 && (
          <div className="text-center text-[13.5px] py-10" style={{ color: "#8496A0" }}>{t.noRequestsWilaya}</div>
        )}

        {!loading && requests.map((r) => {
          const badge = urgencyStyle[r.urgency];
          const isVerified = Boolean(r.verifiedByName);
          const busy = busyId === r.id;
          return (
            <div
              key={r.id}
              className="border rounded-[20px] p-4 bg-white shadow-[0_10px_22px_-18px_rgba(11,36,50,0.55)]"
              style={{ borderColor: "rgba(11,36,50,0.06)", animation: "waRise .4s ease both", textAlign: "start" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-[13px] min-w-0">
                  <span
                    className="w-12 h-12 rounded-[15px] flex items-center justify-center shrink-0 shadow-[0_8px_16px_-8px_rgba(229,72,77,0.7)]"
                    style={{ background: "linear-gradient(135deg,#E5484D,#F4677E)" }}
                  >
                    <Droplet className="w-6 h-6" fill="white" stroke="none" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[15.5px] font-bold truncate" style={{ color: "#0B2432" }}>{r.hospital}</div>
                    <div className="flex items-center gap-1 mt-0.5 text-[12.5px]" style={{ color: "#8496A0" }}>
                      <Clock className="w-[13px] h-[13px]" />
                      {r.time}
                    </div>
                  </div>
                </div>
                <span className="text-[11.5px] font-extrabold px-[11px] py-1.5 rounded-full shrink-0" style={{ background: badge.bg, color: badge.fg }}>
                  {urgencyLabel(r.urgency, t)}
                </span>
              </div>

              <div className="mt-3.5 flex items-center gap-2.5 flex-wrap">
                <span className="font-extrabold text-sm px-3 py-1.5 rounded-xl" style={{ color: "#E5484D", background: "#FFECEC" }}>{r.bloodType}</span>
                <span className="text-[13px] font-semibold" style={{ color: "#6B7C88" }}>{unitsLabel(r.units, t)}</span>
                {r.wilaya && (
                  <span className="flex items-center gap-1 text-[12.5px]" style={{ color: "#8496A0" }}>
                    <MapPin className="w-[13px] h-[13px]" />
                    {wilayaLabel(r.wilaya, lang)}
                  </span>
                )}
              </div>

              {isVerified && (
                <div className="mt-3">
                  <VerifiedBadge associationName={r.verifiedByName} />
                </div>
              )}

              <button
                onClick={() => (isVerified ? handleUnverify(r.id) : handleVerify(r.id))}
                disabled={busy}
                className="cursor-pointer disabled:opacity-60 mt-3.5 w-full h-[46px] rounded-2xl text-[14px] font-extrabold flex items-center justify-center gap-2 border-none"
                style={
                  isVerified
                    ? { background: "#F1F5F6", color: "#5A6B75" }
                    : { background: "linear-gradient(135deg,#12B76A,#0E9F5B)", color: "#fff" }
                }
              >
                {isVerified ? <X className="w-[17px] h-[17px]" /> : <BadgeCheck className="w-[17px] h-[17px]" />}
                {isVerified ? t.unverifyAction : t.verifyAction}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
