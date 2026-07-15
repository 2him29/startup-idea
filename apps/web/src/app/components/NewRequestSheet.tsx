import { useState } from "react";
import { X, Minus, Plus } from "lucide-react";
import { createBloodRequest, urgencyStyle, urgencyLabel, type Urgency } from "@weare/core";
import { useI18n } from "../i18n/LangContext";
import { useToast } from "./Toast";

interface NewRequestSheetProps {
  onClose: () => void;
  /** Called after a successful publish so the host list can refresh. */
  onPublished: () => Promise<void>;
}

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const urgencies: Urgency[] = ["Critical", "High", "Medium", "Low"];

/** Bottom sheet where a hospital publishes a real open blood request. */
export function NewRequestSheet({ onClose, onPublished }: NewRequestSheetProps) {
  const { t } = useI18n();
  const toast = useToast();

  const [patientId, setPatientId] = useState("");
  const [bloodType, setBloodType] = useState("O+");
  const [units, setUnits] = useState(2);
  const [urgency, setUrgency] = useState<Urgency>("High");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPublishing(true);
    try {
      await createBloodRequest({ patientId, bloodType, units, urgency });
      await onPublished();
      toast("success", t.requestPublished);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.genericError);
      setPublishing(false);
    }
  };

  const inputStyle = { borderColor: "rgba(11,36,50,0.1)", background: "#F7FAFB", color: "#0B2432" } as const;

  return (
    <div className="fixed inset-0 z-[75] flex items-end md:items-center md:justify-center">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(11,36,50,0.45)", animation: "waFade .2s ease both" }}
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="relative w-full md:max-w-md bg-white rounded-t-[26px] md:rounded-[26px] p-6 shadow-[0_-20px_60px_-20px_rgba(11,36,50,0.5)]"
        style={{ animation: "waSheet .32s cubic-bezier(.2,.9,.3,1) both", paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="text-lg font-extrabold" style={{ color: "#0B2432" }}>{t.newRequestTitle}</div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer w-9 h-9 rounded-xl border-none flex items-center justify-center"
            style={{ background: "#F1F5F6", color: "#5A6B75" }}
          >
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>

        <label className="block text-[12.5px] font-bold mb-1.5" style={{ color: "#5A6B75", textAlign: "start" }}>{t.patientIdLabel}</label>
        <input
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          placeholder="P-2026-0001"
          required
          className="w-full h-12 rounded-[13px] border-[1.5px] px-3.5 text-[15px] outline-none mb-4"
          style={{ ...inputStyle, textAlign: "start", direction: "ltr" }}
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
                  background: active ? "#0E8BA8" : "#F7FAFB",
                  color: active ? "#fff" : "#0B2432",
                  borderColor: active ? "#0E8BA8" : "rgba(11,36,50,0.12)",
                }}
              >
                {b}
              </button>
            );
          })}
        </div>

        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-[12.5px] font-bold mb-2" style={{ color: "#5A6B75", textAlign: "start" }}>{t.unitsNeeded}</label>
            <div className="flex items-center gap-3 h-12 rounded-[13px] border-[1.5px] px-2 justify-between" style={inputStyle}>
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
          </div>
        </div>

        <label className="block text-[12.5px] font-bold mb-2" style={{ color: "#5A6B75", textAlign: "start" }}>{t.urgencyHeader}</label>
        <div className="grid grid-cols-4 gap-2 mb-5">
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

        {error && (
          <div className="mb-4 rounded-2xl px-4 py-3 text-[13px]" style={{ background: "#FFECEC", color: "#8A3438", border: "1px solid #FBD3D3" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={publishing}
          className="cursor-pointer disabled:opacity-60 w-full h-[52px] rounded-2xl text-white text-[15px] font-extrabold shadow-[0_16px_28px_-14px_rgba(14,139,168,0.8)]"
          style={{ background: "linear-gradient(135deg,#0E8BA8,#23A6C4)" }}
        >
          {publishing ? t.publishing : t.publishRequest}
        </button>
      </form>
    </div>
  );
}
