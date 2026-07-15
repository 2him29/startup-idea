import { useState } from "react";
import { ArrowLeft, HeartHandshake, Shield, ChevronDown, Check, Navigation } from "lucide-react";
import {
  createCompensation,
  openDirections,
  useHospitals,
  type Compensation,
} from "@weare/core";
import { useI18n } from "../i18n/LangContext";

interface CompensateScreenProps {
  onBack: () => void;
  /** Called after the user dismisses the success screen (e.g. route home). */
  onComplete: () => void;
}

const PURPLE = "#6B4FC0";
const PURPLE_GRADIENT = "linear-gradient(135deg,#6B4FC0,#8A6BD6)";
const SCREEN_BG = "linear-gradient(180deg,#FFF7F6 0%, #F6FBFC 58%, #FFFFFF 100%)";

/**
 * Compensate for a patient (family replacement).
 *
 * A donor pledges a compensation donation in a named patient's honour so the
 * patient's transfusion can be released from the shared regional reserve. The
 * compensating donor does NOT need to match the patient's blood type.
 *
 * On success we show an in-place confirmation (mirrors MatchConfirm) rather
 * than routing away, so the donor gets a reference number to show at intake.
 */
export function CompensateScreen({ onBack, onComplete }: CompensateScreenProps) {
  const { t, dir } = useI18n();
  const chevronFlip = dir === "rtl" ? "scaleX(-1)" : undefined;
  const { hospitals } = useHospitals();

  const [patientName, setPatientName] = useState("");
  const [patientFile, setPatientFile] = useState("");
  const [hospitalId, setHospitalId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Compensation | null>(null);

  // Default the select to the first hospital once the list loads.
  const selectedHospitalId = hospitalId || hospitals[0]?.id || "";
  const selectedHospital = hospitals.find((h) => h.id === selectedHospitalId);
  const canSubmit = patientName.trim() !== "" && patientFile.trim() !== "" && selectedHospitalId !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      const compensation = await createCompensation({
        hospitalId: selectedHospitalId,
        patientName,
        patientFile,
      });
      setDone(compensation);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.genericError);
    } finally {
      setLoading(false);
    }
  };

  // ----- Success state -----
  if (done) {
    return (
      <div
        className="min-h-[730px] flex flex-col items-center justify-center text-center px-[30px] py-[30px]"
        style={{ background: SCREEN_BG }}
      >
        <div
          className="w-[104px] h-[104px] rounded-full flex items-center justify-center"
          style={{
            background: PURPLE_GRADIENT,
            boxShadow: "0 22px 44px -16px rgba(107,79,192,0.7)",
            animation: "waPop .5s ease both",
          }}
        >
          <Check className="w-[52px] h-[52px]" style={{ color: "white" }} strokeWidth={2.6} />
        </div>
        <h2 className="mt-[26px] text-[26px] font-extrabold tracking-[-0.5px]" style={{ color: "#0B2432" }}>
          {t.compensatePledged}
        </h2>
        <p className="mt-[10px] text-[15px] leading-relaxed max-w-[280px]" style={{ color: "#5A6B75" }}>
          {t.thankYouPrefix} {done.patientName}. {t.thankYouSuffix}
        </p>

        <div
          className="mt-[26px] w-full bg-white border rounded-[20px] p-[18px]"
          style={{ borderColor: "rgba(11,36,50,0.06)", boxShadow: "0 12px 26px -20px rgba(11,36,50,0.5)", textAlign: "start" }}
        >
          <Row label={t.patientRowLabel} value={done.patientName} />
          <Divider />
          <Row label={t.fileRowLabel} value={done.patientFile} />
          <Divider />
          <Row label={t.hospitalLabel} value={selectedHospital?.name ?? "—"} />
          <Divider />
          <Row label={t.referenceLabel} value={done.reference} valueColor={PURPLE} />
        </div>

        <div className="mt-[22px] w-full flex flex-col gap-[11px]">
          <button
            onClick={() => openDirections({ name: selectedHospital?.name })}
            className="cursor-pointer w-full h-[52px] rounded-2xl text-white text-[15px] font-extrabold flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#0E8BA8,#23A6C4)" }}
          >
            <Navigation className="w-[19px] h-[19px]" />
            {t.getDirections}
          </button>
          <button
            onClick={onComplete}
            className="cursor-pointer w-full h-[52px] rounded-2xl border-[1.5px] bg-white text-[15px] font-extrabold"
            style={{ borderColor: "rgba(11,36,50,0.12)", color: "#0B2432" }}
          >
            {t.backHome}
          </button>
        </div>
      </div>
    );
  }

  // ----- Form state -----
  const inputStyle = {
    borderColor: "rgba(11,36,50,0.1)",
    background: "#F7FAFB",
    color: "#0B2432",
  } as const;

  return (
    <form onSubmit={handleSubmit} className="min-h-screen px-5 pt-2 pb-[130px]" style={{ background: SCREEN_BG }}>
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer w-[42px] h-[42px] rounded-[13px] border bg-white flex items-center justify-center"
          style={{ borderColor: "rgba(11,36,50,0.08)" }}
        >
          <ArrowLeft className="w-5 h-5" style={{ color: "#0B2432", transform: chevronFlip }} />
        </button>
        <div>
          <div className="text-xl font-extrabold" style={{ color: "#0B2432" }}>
            {t.compensateTitle}
          </div>
          <div className="text-[12.5px]" style={{ color: "#8496A0" }}>
            {t.compensateHint}
          </div>
        </div>
      </div>

      {/* explainer */}
      <div className="rounded-[20px] p-[18px] text-white flex gap-[13px] items-start" style={{ background: PURPLE_GRADIENT, textAlign: "start" }}>
        <HeartHandshake className="w-[22px] h-[22px] shrink-0 mt-[1px]" />
        <span className="text-[13px] leading-relaxed opacity-95">{t.compensateBlurb}</span>
      </div>

      {/* form card */}
      <div
        className="mt-4 bg-white border rounded-[20px] p-[18px]"
        style={{ borderColor: "rgba(11,36,50,0.06)", boxShadow: "0 10px 24px -20px rgba(11,36,50,0.5)", textAlign: "start" }}
      >
        <Label>{t.patientName}</Label>
        <input
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
          placeholder={t.patientNamePh}
          required
          className="w-full h-12 rounded-[13px] border-[1.5px] px-3.5 text-[15px] outline-none mb-3.5"
          style={{ ...inputStyle, textAlign: "start" }}
        />

        <Label>{t.patientFile}</Label>
        <input
          value={patientFile}
          onChange={(e) => setPatientFile(e.target.value)}
          placeholder="P-2024-0148"
          required
          className="w-full h-12 rounded-[13px] border-[1.5px] px-3.5 text-[15px] outline-none mb-3.5"
          style={{ ...inputStyle, textAlign: "start" }}
        />

        <Label>{t.hospitalLabel}</Label>
        <div className="relative">
          <select
            value={selectedHospitalId}
            onChange={(e) => setHospitalId(e.target.value)}
            className="w-full h-12 rounded-[13px] border-[1.5px] px-3.5 text-[15px] outline-none appearance-none"
            style={{ ...inputStyle, textAlign: "start" }}
          >
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
          <ChevronDown
            className="w-4 h-4 absolute top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ insetInlineEnd: "14px", color: "#8496A0" }}
          />
        </div>
      </div>

      {/* reassurance note */}
      <div
        className="mt-3.5 rounded-2xl px-4 py-3.5 flex items-center gap-[11px]"
        style={{ background: "#F5F1FD", border: "1px solid #E4D9F7", textAlign: "start" }}
      >
        <Shield className="w-[19px] h-[19px] shrink-0" style={{ color: PURPLE }} />
        <span className="text-[12.5px] leading-relaxed" style={{ color: "#4A3A78" }}>
          {t.compensateNote}
        </span>
      </div>

      {error && (
        <div className="mt-3.5 rounded-2xl px-4 py-3 text-[13px]" style={{ background: "#FFECEC", color: "#8A3438", border: "1px solid #FBD3D3", textAlign: "start" }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !canSubmit}
        className="cursor-pointer disabled:opacity-60 mt-[18px] w-full h-[54px] rounded-2xl text-white text-base font-extrabold"
        style={{ background: PURPLE_GRADIENT, boxShadow: "0 16px 28px -14px rgba(107,79,192,0.7)" }}
      >
        {loading ? t.pledging : t.compensateCta}
      </button>
    </form>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[12.5px] font-bold mb-1.5" style={{ color: "#5A6B75", textAlign: "start" }}>
      {children}
    </label>
  );
}

function Row({ label, value, valueColor = "#0B2432" }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex justify-between py-[9px]">
      <span className="text-[13.5px]" style={{ color: "#8496A0" }}>{label}</span>
      <span className="text-[13.5px] font-bold" style={{ color: valueColor }}>{value}</span>
    </div>
  );
}

function Divider() {
  return <div className="h-px" style={{ background: "rgba(11,36,50,0.06)" }} />;
}
