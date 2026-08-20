import { useState } from "react";
import { AlertTriangle, ArrowLeft, BadgeCheck, Check, Clock, Droplet, Info, MapPin, ShieldQuestion, X } from "lucide-react";
import {
  unitsLabel,
  urgencyStyle,
  urgencyLabel,
  isStale,
  daysOpen,
  useMyMemberships,
  useSession,
  useWilayaRequests,
  verifyRequest,
  unverifyRequest,
  wilayaLabel,
  formatRelativeTime,
  type BloodRequest,
} from "@weare/core";
import { useI18n } from "../i18n/LangContext";
import { BloodType } from "./BloodType";
import { useToast } from "./Toast";
import { RequestCardSkeleton } from "./Skeletons";
import { VerifiedBadge } from "./VerifiedBadge";
import { VouchConfirm } from "./VouchConfirm";

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
  const { profile } = useSession();
  const [activeIndex, setActiveIndex] = useState(0);

  const active = verifying[activeIndex]?.association ?? null;
  const { requests, loading, refresh } = useWilayaRequests(active?.wilaya ?? null);
  const [busyId, setBusyId] = useState<string | null>(null);

  /**
   * Verification binds the association's name, so RLS allows it only for its
   * admins (migration 20260820120000). Volunteers still get the list — knowing
   * what is waiting is most of the job — but offering them a button the
   * database will refuse would turn a rule into a bug report.
   */
  const canVerify = verifying[activeIndex]?.role === "admin";

  /** The member doing the vouching, named on the confirmation. */
  const memberName = profile?.fullName ?? "";

  /**
   * Three groups, in the order a volunteer's attention should fall.
   *
   * A flat list makes every request look equally urgent, which is exactly the
   * WhatsApp failure Qatra exists to fix. What a committee actually needs to
   * know is: what is waiting on me, what have we already put our name to, and
   * what has been sitting here so long that somebody should telephone the
   * family. Sorting cannot say that; headings can.
   */
  const now = Date.now();
  const groups = [
    {
      key: "review",
      label: t.groupNeedsReview,
      tone: "#E5484D",
      items: requests.filter((r) => !r.verifiedByName && !isStale(r.createdAt, now)),
    },
    {
      key: "stale",
      label: t.groupOpenLongTime,
      tone: "#F5871F",
      items: requests.filter((r) => isStale(r.createdAt, now)),
    },
    {
      key: "ours",
      label: t.groupVerifiedByUs,
      tone: "#12B76A",
      items: requests.filter((r) => r.verifiedByName && !isStale(r.createdAt, now)),
    },
  ].filter((g) => g.items.length > 0);

  /**
   * Verification is confirmed, never one-tapped.
   *
   * It publishes the committee's name to strangers and cannot be undone
   * without someone noticing, so a mis-tap on a phone in a corridor is a real
   * cost. (A stray click is exactly how this screen's own author once removed
   * a verification on the live project.) The sheet also names who is vouching,
   * which is the part a volunteer should see before, not after.
   */
  const [confirming, setConfirming] = useState<BloodRequest | null>(null);

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
    const pendingWilaya = memberships[0]?.association.wilaya ?? null;

    /**
     * The wait, made legible.
     *
     * A volunteer who applies and then sees an unchanging "pending" screen
     * assumes it was lost. Three steps show where the application actually is,
     * and the list underneath answers the question they are really asking —
     * whether they are shut out of the app until someone gets round to them.
     * They are not: everything except vouching still works.
     */
    if (hasPending) {
      const steps = [
        { title: t.assocStep1, body: t.assocStep1Body, done: true },
        { title: t.assocStep2, body: t.assocStep2Body, done: false },
        {
          title: t.assocStep3,
          body: t.assocStep3Body.replace("{wilaya}", pendingWilaya ? wilayaLabel(pendingWilaya, lang) : ""),
          done: false,
        },
      ];
      return shell(
        <>
          <div className="bg-white border rounded-[20px] p-[18px]" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
            <div className="text-lg font-extrabold" style={{ color: "#0B2432", textAlign: "start" }}>{t.assocPendingTitle}</div>
            <div className="mt-4 flex flex-col gap-4">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span
                    className="w-6 h-6 rounded-full shrink-0 mt-0.5 flex items-center justify-center"
                    style={{
                      background: step.done ? "#12B76A" : "#EAF0F2",
                      color: step.done ? "#fff" : "#8496A0",
                    }}
                  >
                    {step.done ? <Check className="w-3.5 h-3.5" strokeWidth={3.5} /> : <span className="text-[11px] font-extrabold">{i + 1}</span>}
                  </span>
                  <div style={{ textAlign: "start" }}>
                    <div className="text-[13.5px] font-bold" style={{ color: "#0B2432" }}>{step.title}</div>
                    <div className="text-[12.5px] mt-0.5 leading-relaxed" style={{ color: "#8496A0" }}>{step.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-[20px] p-[18px]" style={{ background: "#EAF6EF", border: "1px solid rgba(18,183,106,0.25)" }}>
            <div className="text-[13.5px] font-extrabold" style={{ color: "#0E7A4B", textAlign: "start" }}>{t.assocMeanwhileTitle}</div>
            <div className="mt-2.5 flex flex-col gap-2">
              {[t.assocMeanwhile1, t.assocMeanwhile2, t.assocMeanwhile3].map((line) => (
                <div key={line} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#0E7A4B" }} strokeWidth={3} />
                  <span className="text-[12.5px]" style={{ color: "#0B4A32", textAlign: "start" }}>{line}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      );
    }

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

      {loading && (
        <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
          {[0, 1].map((i) => <RequestCardSkeleton key={`sk-${i}`} />)}
        </div>
      )}

      {/* An empty wilaya is a quiet day, not a broken screen. Name the wilaya
          so it is obvious which one is quiet. */}
      {!loading && requests.length === 0 && (
        <div className="bg-white border rounded-[20px] p-6 text-center" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
          <span className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center" style={{ background: "#EAF6EF" }}>
            <Check className="w-7 h-7" style={{ color: "#12B76A" }} strokeWidth={3} />
          </span>
          <div className="mt-4 text-[15.5px] font-extrabold" style={{ color: "#0B2432" }}>{t.consoleEmptyTitle}</div>
          <div className="mt-1.5 text-[13px] leading-relaxed" style={{ color: "#8496A0" }}>
            {t.consoleEmptyBody.replace("{wilaya}", wilayaLabel(active.wilaya, lang))}
          </div>
        </div>
      )}

      {!loading && groups.map((group) => (
      <div key={group.key} className="mb-5">
        <div className="flex items-center gap-2 mb-2.5" style={{ textAlign: "start" }}>
          <span className="w-1.5 h-[15px] rounded-full shrink-0" style={{ background: group.tone }} />
          <span className="text-[12.5px] font-extrabold uppercase tracking-[0.4px]" style={{ color: "#0B2432" }}>
            {group.label}
          </span>
          <span
            className="text-[11px] font-extrabold rounded-full min-w-[19px] h-[19px] px-1.5 flex items-center justify-center"
            style={{ background: "#F1F5F6", color: "#5A6B75" }}
          >
            {group.items.length}
          </span>
        </div>
      <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
        {group.items.map((r) => {
          const badge = urgencyStyle[r.urgency];
          const isVerified = Boolean(r.verifiedByName);
          const busy = busyId === r.id;
          const stale = isStale(r.createdAt);
          return (
            <div
              key={r.id}
              data-testid="request-card"
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
                    {/* The person, then the place. An association deciding
                        whether a plea is real is looking at a patient, and
                        "CHU Lamine Debaghine" is not one. Falls back to the
                        hospital for a volunteer, whose RLS filters the name
                        away, and for legacy hospital-authored rows. */}
                    <div className="text-[15.5px] font-bold truncate" style={{ color: "#0B2432" }}>
                      {r.patientName?.trim() || r.hospital}
                    </div>
                    {r.patientName?.trim() && (
                      <div className="text-[12.5px] truncate mt-0.5" style={{ color: "#6B7C88" }}>{r.hospital}</div>
                    )}
                    <div className="flex items-center gap-1 mt-0.5 text-[12.5px]" style={{ color: "#8496A0" }}>
                      <Clock className="w-[13px] h-[13px]" />
                      {stale ? t.openDays.replace("{days}", String(daysOpen(r.createdAt))) : formatRelativeTime(r.createdAt, lang)}
                    </div>
                  </div>
                </div>
                <span className="text-[11.5px] font-extrabold px-[11px] py-1.5 rounded-full shrink-0" style={{ background: badge.bg, color: badge.fg }}>
                  {urgencyLabel(r.urgency, t)}
                </span>
              </div>

              <div className="mt-3.5 flex items-center gap-2.5 flex-wrap">
                <BloodType value={r.bloodType} className="font-extrabold text-sm px-3 py-1.5 rounded-xl" style={{ color: "#E5484D", background: "#FFECEC" }} />
                <span className="text-[13px] font-semibold" style={{ color: "#6B7C88" }}>{unitsLabel(r.units, t, lang)}</span>
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

              {/*
                A month-old request is not a request to vouch for faster; it is
                one to telephone about. Nothing in the product closes a request
                automatically, so a wilaya slowly fills with month-old pleas
                still marked Critical — the exact WhatsApp failure Qatra
                exists to fix. Vouching for one would launder that staleness
                into the committee's own credibility.
              */}
              {stale && !isVerified && (
                <div className="mt-3 rounded-2xl px-3.5 py-3" style={{ background: "#FFF3E0", border: "1px solid rgba(245,135,31,0.3)" }}>
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#F5871F" }} />
                    <span className="text-[12.5px] leading-relaxed" style={{ color: "#7A4A10", textAlign: "start" }}>
                      {t.staleWarnBody}
                    </span>
                  </div>
                </div>
              )}

              {canVerify ? (
                <button
                  // The nav carries a "Verify" label too, so tests need a way to
                  // reach this action that cannot accidentally match the sidebar
                  // or the bottom bar.
                  data-testid="verify-request"
                  onClick={() => (isVerified ? handleUnverify(r.id) : setConfirming(r))}
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
              ) : (
                /* Said once per card would be nagging; said once, at the top of
                   the list, is where a volunteer looks for why the button is
                   missing. Rendered here only when the card would have had one. */
                !isVerified && (
                  <div
                    className="mt-3.5 flex items-start gap-2.5 rounded-2xl px-3.5 py-3"
                    style={{ background: "#F7FAFB", border: "1px solid rgba(11,36,50,0.06)", textAlign: "start" }}
                  >
                    <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#8496A0" }} />
                    <span className="text-[12px] leading-relaxed" style={{ color: "#5A6B75" }}>
                      {t.verifyAdminsOnly}
                    </span>
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>
      </div>
      ))}

      {/* Confirmation, not a second guess: it restates exactly what is about
          to be published and in whose name. */}
      {confirming && (
        <VouchConfirm
          request={confirming}
          wilaya={wilayaLabel(active.wilaya, lang)}
          memberName={memberName}
          associationName={active.name}
          busy={busyId === confirming.id}
          onCancel={() => setConfirming(null)}
          onConfirm={async () => {
            const id = confirming.id;
            setConfirming(null);
            await handleVerify(id);
          }}
        />
      )}
    </>
  );
}
