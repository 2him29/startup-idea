import { useState } from "react";
import { ArrowLeft, ChevronDown, Minus, Plus, Plus as PlusIcon, ShieldAlert } from "lucide-react";
import {
  createPatientRequest,
  urgencyStyle,
  urgencyLabel,
  usePhoneVerified,
  useHospitals,
  WILAYAS,
  wilayaLabel,
  type Urgency,
} from "@weare/core";
import { useI18n } from "../i18n/LangContext";
import { BloodType } from "./BloodType";
import { FlowSteps } from "./FlowSteps";

/** Everything the form collected, in the shape createPatientRequest() wants. */
export interface RequestDraft {
  patientName: string;
  bloodType: string;
  wilaya: string;
  units: number;
  urgency: Urgency;
  hospitalName: string;
  hospitalId?: string;
  contactPhone: string;
  patientFileRef: string;
  /** True when the hospital matched the directory, so the request gets a map pin. */
  mapped: boolean;
}

interface PatientRequestScreenProps {
  onBack: () => void;
  onPosted: (draft: RequestDraft) => void;
  /**
   * Hands the filled-in draft to phone verification, which RLS requires before
   * a request can be inserted.
   *
   * The draft travels rather than the form re-asking for it: verification
   * interrupts *after* the form, so the words a frightened person found at 3am
   * are already written down, and losing them to a detour we imposed would be
   * unforgivable.
   */
  onNeedsVerification: (draft: RequestDraft) => void;
}

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const urgencies: Urgency[] = ["Critical", "High", "Medium", "Low"];

/**
 * The patient/family request form — the replacement for the
 * hospital-authenticated NewRequestSheet.
 *
 * The hospital is free text on purpose: a family knows their hospital by name,
 * not by an id in our directory, and requiring a match would block requests
 * from any clinic we haven't catalogued yet.
 */
export function PatientRequestScreen({ onBack, onPosted, onNeedsVerification }: PatientRequestScreenProps) {
  const { t, lang, dir } = useI18n();
  const chevronFlip = dir === "rtl" ? "scaleX(-1)" : undefined;
  const { verified, loading: checkingVerification } = usePhoneVerified();
  const { hospitals } = useHospitals();

  const [patientName, setPatientName] = useState("");
  const [bloodType, setBloodType] = useState("O+");
  const [wilaya, setWilaya] = useState("Alger");
  const [units, setUnits] = useState(2);
  const [urgency, setUrgency] = useState<Urgency>("High");
  const [hospitalName, setHospitalName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [fileRef, setFileRef] = useState("");
  // Folded away by default. Most families do not have the file number to hand,
  // and an empty field they cannot fill reads as a requirement they are failing.
  const [showFileRef, setShowFileRef] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputStyle = { borderColor: "rgba(11,36,50,0.1)", background: "#F7FAFB", color: "#0B2432" } as const;

  /**
   * Three numbered blocks, in the order someone in a hospital corridor can
   * actually answer them: who the patient is, where they are, and how urgent
   * it is. One long undifferentiated form asks a frightened person to hold the
   * whole thing in their head at once.
   */
  const block = (n: number, title: string) => (
    <div className="flex items-center gap-2.5 mb-3">
      <span
        className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0"
        style={{ background: "#FFECEC", color: "#E5484D" }}
      >
        {n}
      </span>
      <span className="text-[13.5px] font-extrabold uppercase tracking-[0.4px]" style={{ color: "#0B2432" }}>
        {title}
      </span>
    </div>
  );

  const urgencyHint: Record<Urgency, string> = {
    Critical: t.urgencyCriticalHint,
    High: t.urgencyHighHint,
    Medium: t.urgencyMediumHint,
    Low: t.urgencyLowHint,
  };

  // Hospitals in the chosen wilaya, offered as suggestions. Narrowed to the
  // wilaya because a national list is too long to skim and the treating
  // hospital is nearly always in the patient's own province.
  const suggestions = hospitals.filter((h) => h.wilaya === wilaya);

  // How many wilayas the directory actually covers — counted from the data so
  // the copy cannot drift from it. It was 12 of 58 when this was written.
  const coveredWilayas = new Set(hospitals.map((h) => h.wilaya)).size;

  /**
   * Resolve what the family typed against the directory.
   *
   * A match gives the request real coordinates (they come from the hospitals
   * join) and so a pin on the donor map. No match is not an error — the name
   * is kept as free text and the request simply has no pin, exactly as before.
   */
  const matchedHospital = suggestions.find(
    (h) => h.name.trim().toLowerCase() === hospitalName.trim().toLowerCase()
  );

  const draft = (): RequestDraft => ({
    patientName,
    bloodType,
    wilaya,
    units,
    urgency,
    hospitalName,
    hospitalId: matchedHospital?.id,
    contactPhone,
    patientFileRef: fileRef,
    mapped: Boolean(matchedHospital),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    /*
     * Unverified: hand the draft over and let verification finish the job.
     *
     * Attempting the insert first would fail on the RLS phone-verification
     * check and surface as a generic error on a form the person has just
     * finished filling in — the worst possible moment to be told "something
     * went wrong". The gate is known in advance, so honour it in advance.
     */
    if (!checkingVerification && !verified) {
      onNeedsVerification(draft());
      return;
    }

    setPosting(true);
    try {
      await createPatientRequest(draft());
      // No toast: the screen this navigates to leads with the same sentence,
      // and a toast saying it over the top of it is the app talking twice.
      onPosted(draft());
    } catch (err) {
      setError(err instanceof Error ? err.message : t.genericError);
      setPosting(false);
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
        <div>
          <div className="text-xl font-extrabold" style={{ color: "#0B2432" }}>{t.postRequestTitle}</div>
          <div className="text-[12.5px]" style={{ color: "#8496A0" }}>{t.postRequestSub}</div>
        </div>
      </div>

      <FlowSteps current="request" />

      {!checkingVerification && !verified && (
        <button
          // Carries whatever has been typed so far. Tapping the banner
          // mid-form is a detour, not a restart.
          onClick={() => onNeedsVerification(draft())}
          className="cursor-pointer w-full flex items-start gap-3 rounded-2xl p-4 mb-4 border-none"
          style={{ background: "#FFF3E0", border: "1px solid rgba(245,135,31,0.3)", textAlign: "start" }}
        >
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#F5871F" }} />
          <span style={{ textAlign: "start" }}>
            <span className="block text-[13px] font-semibold" style={{ color: "#7A4A10" }}>{t.verifyRequiredNote}</span>
            {/* The form is not blocked — say so, or people abandon it here. */}
            <span className="block text-[12px] mt-1 leading-relaxed" style={{ color: "#8A6534" }}>{t.verifyBannerSub}</span>
          </span>
        </button>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white border rounded-[20px] p-[18px]" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
          {block(1, t.blockWho)}
          <label className="block text-[12.5px] font-bold mb-1.5" style={{ color: "#5A6B75", textAlign: "start" }}>{t.patientName}</label>
          <input
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder={t.patientNamePh}
            required
            className="w-full h-12 rounded-[13px] border-[1.5px] px-3.5 text-[15px] outline-none mb-4"
            style={{ ...inputStyle, textAlign: "start" }}
          />

          <label className="block text-[12.5px] font-bold mb-2" style={{ color: "#5A6B75", textAlign: "start" }}>{t.bloodType}</label>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {bloodTypes.map((b) => {
              const active = b === bloodType;
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBloodType(b)}
                  className="cursor-pointer h-10 rounded-xl text-sm font-extrabold border-[1.5px]"
                  style={{
                    background: active ? "#E5484D" : "#F7FAFB",
                    color: active ? "#fff" : "#0B2432",
                    borderColor: active ? "#E5484D" : "rgba(11,36,50,0.12)",
                  }}
                >
                  <BloodType value={b} />
                </button>
              );
            })}
          </div>

          {/* Nobody should stall here: the hospital knows the blood type. */}
          <div className="-mt-2 mb-5 text-[11.5px]" style={{ color: "#8496A0", textAlign: "start" }}>{t.bloodTypeUnsure}</div>

          <div className="pt-4" style={{ borderTop: "1px solid rgba(11,36,50,0.06)" }} />
          {block(2, t.blockWhere)}
          <label className="block text-[12.5px] font-bold mb-1.5" style={{ color: "#5A6B75", textAlign: "start" }}>{t.wilayaField}</label>
          <div className="relative mb-4">
            <select
              value={wilaya}
              onChange={(e) => setWilaya(e.target.value)}
              required
              className="w-full h-12 rounded-[13px] border-[1.5px] px-3.5 text-[15px] outline-none appearance-none"
              style={{ ...inputStyle, textAlign: "start" }}
            >
              {WILAYAS.map((w) => (
                <option key={w.code} value={w.fr}>
                  {w.code} — {w[lang]}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute top-1/2 -translate-y-1/2 pointer-events-none" style={{ insetInlineEnd: "14px", color: "#8496A0" }} />
          </div>
          {/*
            Said before the hospital field, not after it.

            Whether suggestions appear at all is a property of the wilaya, and
            a family in Tissemsilt should learn that here — while choosing —
            rather than by typing into a field that stays silent and wondering
            what they got wrong. The count is derived, not written down, so it
            stops being true the day a hospital is added.
          */}
          <div className="-mt-3 mb-4 text-[11.5px]" style={{ color: "#8496A0", textAlign: "start" }}>
            {suggestions.length > 0
              ? t.coverageMapped
                  .replace("{wilaya}", wilayaLabel(wilaya, lang))
                  .replace("{count}", String(coveredWilayas))
              : t.coverageUnmapped.replace("{wilaya}", wilayaLabel(wilaya, lang))}
          </div>

          <label className="block text-[12.5px] font-bold mb-1.5" style={{ color: "#5A6B75", textAlign: "start" }}>{t.hospitalNameOptional}</label>
          {/*
            A plain text input backed by a datalist, not a select: the family
            can type any hospital, and picking a listed one is what earns the
            request a map pin. Typing something we don't know stays valid.
          */}
          <input
            value={hospitalName}
            onChange={(e) => setHospitalName(e.target.value)}
            placeholder="CHU Mustapha Pacha"
            list="qatra-hospital-suggestions"
            autoComplete="off"
            className="w-full h-12 rounded-[13px] border-[1.5px] px-3.5 text-[15px] outline-none"
            style={{ ...inputStyle, textAlign: "start" }}
          />
          <datalist id="qatra-hospital-suggestions">
            {suggestions.map((h) => (
              <option key={h.id} value={h.name} />
            ))}
          </datalist>
          {/*
            Three states, and none of them is a failure.

            The directory covers 12 of 58 wilayas, so "no suggestions" is the
            common case, not an error — in Tissemsilt there is nothing to
            match against and never will be. A field that searched and
            announced "no results" would teach a family they had typed
            something wrong. This one only ever confirms: it offers
            suggestions silently where they exist, and otherwise says plainly
            that what they typed is enough.
          */}
          <div
            className="mt-1.5 mb-4 text-[11.5px]"
            style={{ color: matchedHospital ? "#0E7A4B" : "#8496A0", textAlign: "start" }}
          >
            {matchedHospital
              ? t.hospitalMatched
              : suggestions.length > 0
              ? t.hospitalFreeTextHint
              : t.hospitalNoDirectoryHint}
          </div>

          <div className="pt-4" style={{ borderTop: "1px solid rgba(11,36,50,0.06)" }} />
          {block(3, t.blockUrgency)}
          <label className="block text-[12.5px] font-bold mb-2" style={{ color: "#5A6B75", textAlign: "start" }}>{t.unitsNeeded}</label>
          <div className="flex items-center gap-3 h-12 rounded-[13px] border-[1.5px] px-2 justify-between mb-4" style={inputStyle}>
            <button
              type="button"
              onClick={() => setUnits((u) => Math.max(1, u - 1))}
              className="cursor-pointer w-8 h-8 rounded-lg border-none flex items-center justify-center"
              style={{ background: "#EAF0F2", color: "#0B2432" }}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-lg font-extrabold" style={{ color: "#0B2432" }}>{units}</span>
            <button
              type="button"
              onClick={() => setUnits((u) => Math.min(10, u + 1))}
              className="cursor-pointer w-8 h-8 rounded-lg border-none flex items-center justify-center"
              style={{ background: "#EAF0F2", color: "#0B2432" }}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <label className="block text-[12.5px] font-bold mb-2" style={{ color: "#5A6B75", textAlign: "start" }}>{t.urgencyHeader}</label>
          <div className="grid grid-cols-1 gap-2 mb-4">
            {urgencies.map((u) => {
              const active = u === urgency;
              const style = urgencyStyle[u];
              return (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUrgency(u)}
                  className="cursor-pointer rounded-xl border-[1.5px] px-3 py-2.5 flex items-center gap-2.5"
                  style={{
                    background: active ? style.bg : "#F7FAFB",
                    color: active ? style.fg : "#0B2432",
                    borderColor: active ? style.bg : "rgba(11,36,50,0.12)",
                    textAlign: "start",
                  }}
                >
                  <span className="text-[12.5px] font-extrabold">{urgencyLabel(u, t)}</span>
                  {/* What each level means in plain words. "High" means nothing
                      on its own to someone who has never used the app. */}
                  <span className="text-[11.5px]" style={{ opacity: active ? 0.85 : 0.6 }}>{urgencyHint[u]}</span>
                </button>
              );
            })}
          </div>

          <label className="block text-[12.5px] font-bold mb-1.5" style={{ color: "#5A6B75", textAlign: "start" }}>{t.contactPhoneLabel}</label>
          <input
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="05 55 12 34 56"
            inputMode="tel"
            className="w-full h-12 rounded-[13px] border-[1.5px] px-3.5 text-[15px] outline-none"
            style={{ ...inputStyle, direction: "ltr", textAlign: "start" }}
          />
          <div className="mt-1.5 mb-4 text-[11.5px]" style={{ color: "#8496A0", textAlign: "start" }}>{t.contactPhoneHint}</div>

          {!showFileRef ? (
            <button
              type="button"
              onClick={() => setShowFileRef(true)}
              className="cursor-pointer flex items-center gap-2 text-[13px] font-bold border-none bg-transparent p-0"
              style={{ color: "#0E8BA8" }}
            >
              <PlusIcon className="w-4 h-4" />
              {t.addFileNumber}
            </button>
          ) : (
          <>
          <label className="block text-[12.5px] font-bold mb-1.5" style={{ color: "#5A6B75", textAlign: "start" }}>{t.patientFileOptional}</label>
          <input
            value={fileRef}
            onChange={(e) => setFileRef(e.target.value)}
            placeholder="P-2026-0001"
            className="w-full h-12 rounded-[13px] border-[1.5px] px-3.5 text-[15px] outline-none"
            style={{ ...inputStyle, direction: "ltr", textAlign: "start" }}
          />
          </>
          )}
        </div>

        {error && (
          <div className="mt-3.5 rounded-2xl px-4 py-3 text-[13px]" style={{ background: "#FFECEC", color: "#8A3438", border: "1px solid #FBD3D3", textAlign: "start" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={posting}
          className="cursor-pointer disabled:opacity-60 mt-[18px] w-full h-[54px] rounded-2xl text-white text-base font-extrabold shadow-[0_16px_28px_-14px_rgba(229,72,77,0.8)]"
          style={{ background: "linear-gradient(135deg,#E5484D,#F4677E)" }}
        >
          {posting ? t.posting : t.postRequestCta}
        </button>

        {/* What the button is about to do, when it isn't what the label says.
            An unverified account is one SMS away from posting, and knowing
            that in advance turns the detour into a step rather than a
            surprise. */}
        {!checkingVerification && !verified && (
          <div className="mt-2.5 text-center text-[11.5px] font-semibold" style={{ color: "#8496A0" }}>
            {t.postCtaHint}
          </div>
        )}

        {/* Verification is a bonus, not a gate — say so before someone waits
            for a badge that may never come. */}
        <div className="mt-2.5 text-center text-[11.5px] leading-relaxed" style={{ color: "#8496A0" }}>
          {t.postRequestFooter.replace("{wilaya}", wilayaLabel(wilaya, lang))}
        </div>
      </form>
    </div>
  );
}
