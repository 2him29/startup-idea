import { CheckCircle2, Clock, Lock, MapPin, Share2 } from "lucide-react";
import { formatRelativeTime, formatShareMessage, shareToWhatsApp, unitsLabel, urgencyLabel, urgencyStyle, wilayaLabel } from "@weare/core";
import { useI18n } from "../i18n/LangContext";
import { SCREEN_BG } from "../background";
import { BloodType } from "./BloodType";
import { FlowSteps } from "./FlowSteps";
import type { RequestDraft } from "./PatientRequestScreen";

interface RequestPostedScreenProps {
  draft: RequestDraft;
  /** Opens the Find screen, where the request now sits among the others. */
  onSeeRequest: () => void;
  /** Back to an empty form, for a second patient. */
  onStartAgain: () => void;
}

/**
 * The end of the flow: it worked, here is what you made.
 *
 * Three decisions carried over from the design, each worth keeping:
 *
 * 1. It shows the request *as a donor will see it*, not a tick and a
 *    platitude. Someone who has just handed over a relative's blood type and
 *    their own phone number is owed a look at what they published.
 *
 * 2. WhatsApp is offered here rather than buried. These requests spread
 *    through family groups whatever we build, so the honest move is to make
 *    the version that spreads the accurate one.
 *
 * 3. No association badge, and no apology for its absence. A fresh request has
 *    not been vouched for and saying "pending verification" would teach
 *    families that unverified means second-class — which would be both untrue
 *    and, for the wilayas with no committee at all, permanent.
 */
export function RequestPostedScreen({ draft, onSeeRequest, onStartAgain }: RequestPostedScreenProps) {
  const { t, lang } = useI18n();
  const urgency = urgencyStyle[draft.urgency];
  // Rendered through the same formatter the donor cards use, so "now" is
  // localised by Intl rather than being a fourth hand-written string.
  const postedAt = formatRelativeTime(new Date().toISOString(), lang);
  const where = wilayaLabel(draft.wilaya, lang);

  return (
    <div className="min-h-screen px-5 pt-2 pb-[130px]" style={{ background: SCREEN_BG }}>
      <div className="pt-2" />

      <FlowSteps current="posted" />

      <div
        className="rounded-3xl p-5 text-white flex items-start gap-3 shadow-[0_18px_34px_-20px_rgba(18,183,106,0.9)]"
        style={{ background: "linear-gradient(135deg,#12B76A,#0E9F5B)" }}
      >
        <CheckCircle2 className="w-6 h-6 shrink-0 mt-0.5" />
        <div style={{ textAlign: "start" }}>
          <div className="text-[15.5px] font-extrabold leading-snug">{t.requestPosted}</div>
        </div>
      </div>

      {/* The published thing, in the donor's own card layout. */}
      <div className="mt-5 mb-2 text-[12.5px] font-extrabold uppercase tracking-[0.4px]" style={{ color: "#8496A0", textAlign: "start" }}>
        {t.postedAsDonorsSee}
      </div>
      <div className="bg-white border rounded-[20px] p-[18px]" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
        <div className="flex items-start justify-between gap-3">
          <div style={{ textAlign: "start" }}>
            <div className="text-[15.5px] font-extrabold" style={{ color: "#0B2432" }}>
              {draft.hospitalName.trim() || where}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[12.5px]" style={{ color: "#8496A0" }}>
              <Clock className="w-[13px] h-[13px]" />
              {postedAt}
            </div>
          </div>
          <span className="text-[11.5px] font-extrabold px-3 py-1.5 rounded-full shrink-0" style={{ background: urgency.bg, color: urgency.fg }}>
            {urgencyLabel(draft.urgency, t)}
          </span>
        </div>
        <div className="mt-3.5 flex items-center gap-3 flex-wrap">
          <BloodType
            value={draft.bloodType}
            className="font-extrabold text-sm px-3 py-1.5 rounded-xl"
            style={{ color: "#E5484D", background: "#FFECEC" }}
          />
          <span className="text-[13px] font-semibold" style={{ color: "#6B7C88" }}>{unitsLabel(draft.units, t, lang)}</span>
          <span className="flex items-center gap-1 text-[12.5px]" style={{ color: "#8496A0" }}>
            <MapPin className="w-[13px] h-[13px]" />
            {where}
          </span>
        </div>
      </div>

      <div className="mt-5 bg-white border rounded-[20px] p-[18px]" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
        <div className="text-sm font-extrabold mb-3" style={{ color: "#0B2432", textAlign: "start" }}>{t.postedWhatNow}</div>
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "#E4F6FB" }}>
              <MapPin className="w-4 h-4" style={{ color: "#0E8BA8" }} />
            </span>
            <span className="text-[12.5px] leading-relaxed" style={{ color: "#5A6B75", textAlign: "start" }}>
              {(draft.mapped ? t.postedGeoMapped : t.postedGeoUnmapped).replace("{wilaya}", where)}
            </span>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "#EEE9FB" }}>
              <CheckCircle2 className="w-4 h-4" style={{ color: "#6B4FC0" }} />
            </span>
            <span className="text-[12.5px] leading-relaxed" style={{ color: "#5A6B75", textAlign: "start" }}>
              {t.postedBadgeNote}
            </span>
          </div>
          {/* Said last and said plainly. The form asked for a phone number;
              this closes the loop on what happened to everything else. */}
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "#F1F5F6" }}>
              <Lock className="w-4 h-4" style={{ color: "#5A6B75" }} />
            </span>
            <span className="text-[12.5px] leading-relaxed" style={{ color: "#5A6B75", textAlign: "start" }}>
              {t.postedPrivacyNote}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={() =>
          shareToWhatsApp(
            formatShareMessage(t, {
              hospital: draft.hospitalName.trim() || where,
              bloodType: draft.bloodType,
              wilaya: where,
              units: draft.units,
            })
          )
        }
        className="cursor-pointer mt-[18px] w-full h-[54px] rounded-2xl text-white text-base font-extrabold flex items-center justify-center gap-2.5 border-none shadow-[0_16px_28px_-14px_rgba(18,183,106,0.8)]"
        style={{ background: "linear-gradient(135deg,#12B76A,#0E9F5B)" }}
      >
        <Share2 className="w-[19px] h-[19px]" />
        {t.postedShareWhatsApp}
      </button>

      <button
        onClick={onSeeRequest}
        className="cursor-pointer mt-3 w-full h-[52px] rounded-2xl text-[15px] font-extrabold bg-white border-[1.5px]"
        style={{ borderColor: "rgba(11,36,50,0.12)", color: "#0B2432" }}
      >
        {t.postedSeeMine}
      </button>

      <button
        onClick={onStartAgain}
        className="cursor-pointer mt-3 w-full text-center text-[13.5px] font-semibold border-none bg-transparent"
        style={{ color: "#5A6B75" }}
      >
        {t.postedStartAgain}
      </button>
    </div>
  );
}
