import { useState } from "react";
import { ArrowLeft, ChevronDown, Minus, Plus, ShieldAlert } from "lucide-react";
import {
  createPatientRequest,
  urgencyStyle,
  urgencyLabel,
  usePhoneVerified,
  useHospitals,
  WILAYAS,
  type Urgency,
} from "@weare/core";
import { useI18n } from "../i18n/LangContext";
import { useToast } from "./Toast";

interface PatientRequestScreenProps {
  onBack: () => void;
  onPosted: () => void;
  /** Routes to phone verification, which RLS requires before a request can be inserted. */
  onNeedsVerification: () => void;
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
  const toast = useToast();
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
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputStyle = { borderColor: "rgba(11,36,50,0.1)", background: "#F7FAFB", color: "#0B2432" } as const;

  // Hospitals in the chosen wilaya, offered as suggestions. Narrowed to the
  // wilaya because a national list is too long to skim and the treating
  // hospital is nearly always in the patient's own province.
  const suggestions = hospitals.filter((h) => h.wilaya === wilaya);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPosting(true);
    try {
      await createPatientRequest({
        patientName,
        bloodType,
        wilaya,
        units,
        urgency,
        hospitalName,
        hospitalId: matchedHospital?.id,
        contactPhone,
        patientFileRef: fileRef,
      });
      toast("success", t.requestPosted);
      onPosted();
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

      {!checkingVerification && !verified && (
        <button
          onClick={onNeedsVerification}
          className="cursor-pointer w-full flex items-start gap-3 rounded-2xl p-4 mb-4 border-none"
          style={{ background: "#FFF3E0", border: "1px solid rgba(245,135,31,0.3)", textAlign: "start" }}
        >
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#F5871F" }} />
          <span className="text-[13px] font-semibold" style={{ color: "#7A4A10" }}>{t.verifyRequiredNote}</span>
        </button>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white border rounded-[20px] p-[18px]" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
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
                  {b}
                </button>
              );
            })}
          </div>

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
          <div className="mt-1.5 mb-4 text-[11.5px]" style={{ color: matchedHospital ? "#0E7A4B" : "#8496A0", textAlign: "start" }}>
            {matchedHospital ? t.hospitalMatched : t.hospitalFreeTextHint}
          </div>

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
          <div className="grid grid-cols-4 gap-2 mb-4">
            {urgencies.map((u) => {
              const active = u === urgency;
              const style = urgencyStyle[u];
              return (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUrgency(u)}
                  className="cursor-pointer h-10 rounded-xl text-[11.5px] font-extrabold border-[1.5px] px-1"
                  style={{
                    background: active ? style.bg : "#F7FAFB",
                    color: active ? style.fg : "#0B2432",
                    borderColor: active ? style.bg : "rgba(11,36,50,0.12)",
                  }}
                >
                  {urgencyLabel(u, t)}
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
            className="w-full h-12 rounded-[13px] border-[1.5px] px-3.5 text-[15px] outline-none mb-4"
            style={{ ...inputStyle, direction: "ltr", textAlign: "start" }}
          />

          <label className="block text-[12.5px] font-bold mb-1.5" style={{ color: "#5A6B75", textAlign: "start" }}>{t.patientFileOptional}</label>
          <input
            value={fileRef}
            onChange={(e) => setFileRef(e.target.value)}
            placeholder="P-2026-0001"
            className="w-full h-12 rounded-[13px] border-[1.5px] px-3.5 text-[15px] outline-none"
            style={{ ...inputStyle, direction: "ltr", textAlign: "start" }}
          />
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
      </form>
    </div>
  );
}
