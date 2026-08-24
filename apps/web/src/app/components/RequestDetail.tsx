import { useState } from "react";
import { ArrowLeft, Phone, Clock, AlertTriangle, Info, Share2, Check, Users, X } from "lucide-react";
import {
  urgencyLabel,
  wilayaLabel,
  formatShareMessage,
  shareToWhatsApp,
  useResponses,
  useDonorProfile,
  matchKind,
  formatRelativeTime,
  errorMessage,
  type BloodRequest,
} from "@weare/core";
import { useI18n } from "../i18n/LangContext";
import { BloodType } from "./BloodType";
import { VerifiedBadge } from "./VerifiedBadge";

interface RequestDetailProps {
  onBack: () => void;
  /** Called once the response is actually recorded, not when the button is pressed. */
  onResponded: () => void;
  request: BloodRequest;
}

export function RequestDetail({ onBack, onResponded, request }: RequestDetailProps) {
  const { t, lang, dir } = useI18n();
  const chevronFlip = dir === "rtl" ? "scaleX(-1)" : undefined;

  const { goingTo, counts, respond, withdraw } = useResponses([request.id]);

  /*
   * Whether this donor can actually give to this patient.
   *
   * This replaced a hardcoded string. The screen used to tell every reader
   * "Your A+ type is a direct match" — the A+ was baked into the translation
   * itself, so an O- donor looking at a B+ request was told the same thing.
   * In a blood app that is the worst available thing to be wrong about, and it
   * was wrong for seven donors in eight.
   */
  const { donorProfile } = useDonorProfile();
  const match = matchKind(donorProfile?.bloodType, request.bloodType);
  const going = goingTo.has(request.id);
  const coming = counts[request.id] ?? 0;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRespond = async () => {
    setBusy(true);
    setError(null);
    try {
      await respond(request.id);
      onResponded();
    } catch (err) {
      // Stay here and say why. Navigating to a confirmation after a failed
      // write is how this screen used to lie.
      setError(errorMessage(err, t.genericError));
    } finally {
      setBusy(false);
    }
  };

  const handleWithdraw = async () => {
    setBusy(true);
    setError(null);
    try {
      await withdraw(request.id);
    } catch (err) {
      setError(errorMessage(err, t.genericError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen px-5 pt-2 pb-[130px]" style={{ background: "linear-gradient(180deg,#FFF7F6 0%, #F6FBFC 58%, #FFFFFF 100%)" }}>
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="cursor-pointer w-[42px] h-[42px] rounded-[13px] border bg-white flex items-center justify-center"
          style={{ borderColor: "rgba(11,36,50,0.08)" }}
        >
          <ArrowLeft className="w-5 h-5" style={{ color: "#0B2432", transform: chevronFlip }} />
        </button>
        <div className="text-xl font-extrabold" style={{ color: "#0B2432" }}>{t.requestDetails}</div>
      </div>

      <div
        className="rounded-3xl p-[22px] text-white shadow-[0_22px_40px_-22px_rgba(229,72,77,0.8)]"
        style={{ background: "linear-gradient(135deg,#E5484D,#F4677E)" }}
      >
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[12.5px] opacity-90 font-semibold">{t.requestedBy}</div>
            <div className="text-[21px] font-extrabold tracking-[-0.3px]">{request.hospital}</div>
          </div>
          <span className="text-[11.5px] font-extrabold px-3 py-1.5 rounded-full bg-white/[0.22] border border-white/40">{urgencyLabel(request.urgency, t)}</span>
        </div>
        <div className="mt-5 flex gap-2.5">
          <div className="flex-1 bg-white/[0.16] rounded-2xl p-3 text-center">
            <BloodType value={request.bloodType} className="text-[22px] font-extrabold" />
            <div className="text-[11px] opacity-90">{t.bloodType}</div>
          </div>
          <div className="flex-1 bg-white/[0.16] rounded-2xl p-3 text-center">
            <div className="text-[22px] font-extrabold">{request.units}</div>
            <div className="text-[11px] opacity-90">{t.unitsNeeded}</div>
          </div>
          <div className="flex-1 bg-white/[0.16] rounded-2xl p-3 text-center">
            <div className="text-[15px] font-extrabold leading-[1.3] pt-[5px]">{wilayaLabel(request.wilaya, lang)}</div>
            <div className="text-[11px] opacity-90 mt-[3px]">{t.wilaya}</div>
          </div>
        </div>
      </div>

      {request.verifiedByName && (
        <div className="mt-3.5">
          <VerifiedBadge associationName={request.verifiedByName} />
        </div>
      )}

      <div className="mt-4 bg-white border rounded-[20px] p-[18px]" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
        <div className="text-sm font-extrabold mb-3" style={{ color: "#0B2432", textAlign: "start" }}>{t.details}</div>
        <div className="flex flex-col gap-[13px]">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "#FFECEC" }}>
              <Clock className="w-[17px] h-[17px]" style={{ color: "#E5484D" }} />
            </span>
            <div className="flex-1">
              <div className="text-[13.5px] font-semibold" style={{ color: "#0B2432" }}>{t.posted} {formatRelativeTime(request.createdAt, lang)}</div>
              <div className="text-xs" style={{ color: "#8496A0" }}>{t.responseWindow}</div>
            </div>
          </div>
          {/*
            The compatibility answer, computed rather than asserted.

            "incompatible" is not a dead end: sharing a request is a real
            contribution, and someone who cannot give should be told what they
            can do rather than simply turned away. "unknown" asks for the
            missing fact instead of guessing.
          */}
          <div className="flex items-start gap-3">
            <span
              className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
              style={{ background: match === "incompatible" ? "#F1F5F6" : match === "unknown" ? "#FFF3E0" : "#EAF6EF" }}
            >
              {match === "incompatible" ? (
                <Info className="w-[17px] h-[17px]" style={{ color: "#8496A0" }} />
              ) : match === "unknown" ? (
                <AlertTriangle className="w-[17px] h-[17px]" style={{ color: "#F5871F" }} />
              ) : (
                <Check className="w-[17px] h-[17px]" style={{ color: "#12B76A" }} strokeWidth={3} />
              )}
            </span>
            <div className="flex-1">
              <div className="text-[13.5px] font-semibold" style={{ color: "#0B2432" }}>
                {match === "incompatible" ? t.matchTitleNo : match === "unknown" ? t.matchTitleUnknown : t.matchTitleYes}
              </div>
              <div className="text-xs" style={{ color: "#8496A0" }}>
                {match === "unknown"
                  ? t.matchUnknown
                  : (match === "exact" ? t.matchExact : match === "compatible" ? t.matchCompatible : t.matchIncompatible)
                      .replace("{donor}", donorProfile?.bloodType ?? "")
                      .replace("{recipient}", request.bloodType)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-[18px] flex gap-[11px]">
        <button
          className="cursor-pointer w-14 h-[54px] shrink-0 rounded-2xl border-[1.5px] bg-white flex items-center justify-center"
          style={{ borderColor: "rgba(11,36,50,0.12)" }}
        >
          <Phone className="w-[21px] h-[21px]" style={{ color: "#0B2432" }} />
        </button>
        <button
          onClick={() =>
            shareToWhatsApp(
              formatShareMessage(t, {
                hospital: request.hospital,
                bloodType: request.bloodType,
                wilaya: wilayaLabel(request.wilaya, lang),
                units: request.units,
                verifiedByName: request.verifiedByName,
              })
            )
          }
          aria-label={t.shareLabel}
          className="cursor-pointer w-14 h-[54px] shrink-0 rounded-2xl border-[1.5px] bg-white flex items-center justify-center"
          style={{ borderColor: "rgba(11,36,50,0.12)" }}
        >
          <Share2 className="w-[21px] h-[21px]" style={{ color: "#0B2432" }} />
        </button>
        {/*
          Someone who cannot give is offered the thing they can do.

          The screen states plainly that their type will not work, and then
          used to put a full-width red "Respond to request" underneath it —
          telling a person they cannot help and inviting them to help in the
          same breath. Worse, a response from an incompatible donor would count
          toward "donors coming" and let a family believe help was on its way
          that could never arrive.

          "unknown" is deliberately excluded: a donor who has not recorded a
          blood type may well know their own, so they keep the ordinary action.
        */}
        {match === "incompatible" ? (
          <button
            onClick={() =>
              shareToWhatsApp(
                formatShareMessage(t, {
                  hospital: request.hospital,
                  bloodType: request.bloodType,
                  wilaya: wilayaLabel(request.wilaya, lang),
                  units: request.units,
                  verifiedByName: request.verifiedByName,
                })
              )
            }
            data-testid="share-instead"
            className="cursor-pointer flex-1 h-[54px] rounded-2xl text-white text-[15px] font-extrabold flex items-center justify-center gap-2.5 border-none shadow-[0_16px_28px_-14px_rgba(18,183,106,0.8)]"
            style={{ background: "linear-gradient(135deg,#12B76A,#0E9F5B)" }}
          >
            <Share2 className="w-[19px] h-[19px]" />
            {t.shareInstead}
          </button>
        ) : going ? (
          <button
            onClick={handleWithdraw}
            disabled={busy}
            data-testid="withdraw-response"
            className="cursor-pointer disabled:opacity-60 flex-1 h-[54px] rounded-2xl text-[15px] font-extrabold border-[1.5px] bg-white flex items-center justify-center gap-2"
            style={{ borderColor: "rgba(11,36,50,0.12)", color: "#5A6B75" }}
          >
            <X className="w-[18px] h-[18px]" />
            {t.withdrawResponse}
          </button>
        ) : (
          <button
            onClick={handleRespond}
            disabled={busy}
            data-testid="respond-request"
            className="cursor-pointer disabled:opacity-60 flex-1 h-[54px] rounded-2xl text-white text-base font-extrabold shadow-[0_16px_28px_-14px_rgba(229,72,77,0.8)]"
            style={{ background: "linear-gradient(135deg,#E5484D,#F4677E)" }}
          >
            {busy ? t.respondingNow : t.respondRequest}
          </button>
        )}
      </div>

      {error && (
        <div className="mt-3 rounded-2xl px-4 py-3 text-[13px]" style={{ background: "#FFECEC", color: "#8A3438", border: "1px solid #FBD3D3", textAlign: "start" }}>
          {error}
        </div>
      )}

      {/* Said after the buttons, because it is context for the decision rather
          than the decision itself. A family reads this as reassurance; a donor
          reads it as "am I still needed" — which is why a request with enough
          people coming should not be answered by a twentieth. */}
      {(going || coming > 0) && (
        <div
          className="mt-3.5 flex items-start gap-2.5 rounded-2xl px-3.5 py-3"
          style={{ background: going ? "#EAF6EF" : "#F7FAFB", border: `1px solid ${going ? "rgba(18,183,106,0.25)" : "rgba(11,36,50,0.06)"}` }}
        >
          {going
            ? <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#12B76A" }} strokeWidth={3} />
            : <Users className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#5A6B75" }} />}
          <span className="text-[12.5px] leading-relaxed" style={{ color: going ? "#0E7A4B" : "#5A6B75", textAlign: "start" }}>
            {going ? t.youAreGoing : ""}
            {going && coming > 1 ? " " : ""}
            {coming > 0 ? t.donorsComing.replace("{count}", String(coming)) : ""}
          </span>
        </div>
      )}
    </div>
  );
}
