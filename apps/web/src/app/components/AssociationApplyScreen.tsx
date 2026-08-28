import { useState } from "react";
import { ArrowLeft, ChevronDown, Info } from "lucide-react";
import { applyForAssociation, WILAYAS, type AssociationType, errorMessage} from "@weare/core";
import { useI18n } from "../i18n/LangContext";
import { SCREEN_BG } from "../background";
import { useToast } from "./Toast";

interface AssociationApplyScreenProps {
  onBack: () => void;
  onApplied: () => void;
}

/**
 * Association onboarding. The row is created unverified and a Qatra admin
 * approves it out-of-band — a self-service "verified" flag would make the
 * badge meaningless, since anyone could mint an association and vouch for
 * their own request.
 */
export function AssociationApplyScreen({ onBack, onApplied }: AssociationApplyScreenProps) {
  const { t, lang, dir } = useI18n();
  const toast = useToast();
  const chevronFlip = dir === "rtl" ? "scaleX(-1)" : undefined;

  const [name, setName] = useState("");
  const [type, setType] = useState<AssociationType>("red_crescent");
  const [wilaya, setWilaya] = useState("Alger");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typeLabels: Record<AssociationType, string> = {
    red_crescent: t.assocTypeRedCrescent,
    scouts: t.assocTypeScouts,
    student: t.assocTypeStudent,
    other: t.assocTypeOther,
  };

  const inputStyle = { borderColor: "rgba(11,36,50,0.1)", background: "#F7FAFB", color: "#0B2432" } as const;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await applyForAssociation({ name, type, wilaya, contactPhone, contactEmail });
      toast("success", t.assocAppliedToast);
      onApplied();
    } catch (err) {
      setError(errorMessage(err, t.genericError));
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen px-5 pt-2 pb-[130px]" style={{ background: SCREEN_BG }}>
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="cursor-pointer w-[42px] h-[42px] rounded-[13px] border bg-white flex items-center justify-center"
          style={{ borderColor: "rgba(11,36,50,0.08)" }}
        >
          <ArrowLeft className="w-5 h-5" style={{ color: "#0B2432", transform: chevronFlip }} />
        </button>
        <div>
          <div className="text-xl font-extrabold" style={{ color: "#0B2432" }}>{t.assocApplyTitle}</div>
          <div className="text-[12.5px]" style={{ color: "#8496A0" }}>{t.assocApplySub}</div>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl p-4 mb-4" style={{ background: "#EEE9FB", border: "1px solid rgba(107,79,192,0.2)" }}>
        <Info className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#6B4FC0" }} />
        <div className="text-[13px]" style={{ color: "#3F2E77", textAlign: "start" }}>{t.assocPendingSub}</div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white border rounded-[20px] p-[18px]" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
          <label className="block text-[12.5px] font-bold mb-1.5" style={{ color: "#5A6B75", textAlign: "start" }}>{t.assocNameLabel}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Croissant-Rouge Algérien — Blida"
            required
            className="w-full h-12 rounded-[13px] border-[1.5px] px-3.5 text-[15px] outline-none mb-4"
            style={{ ...inputStyle, textAlign: "start" }}
          />

          <label className="block text-[12.5px] font-bold mb-2" style={{ color: "#5A6B75", textAlign: "start" }}>{t.assocTypeLabel}</label>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {(Object.keys(typeLabels) as AssociationType[]).map((option) => {
              const active = option === type;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setType(option)}
                  className="cursor-pointer h-11 rounded-xl text-[12.5px] font-extrabold border-[1.5px] px-2"
                  style={{
                    background: active ? "#6B4FC0" : "#F7FAFB",
                    color: active ? "#fff" : "#0B2432",
                    borderColor: active ? "#6B4FC0" : "rgba(11,36,50,0.12)",
                  }}
                >
                  {typeLabels[option]}
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
          {/* Wilaya is the whole scope of the permission being applied for, so
              it is stated at the point of choosing rather than discovered later. */}
          <div className="-mt-2.5 mb-4 text-[11.5px]" style={{ color: "#8496A0", textAlign: "start" }}>
            {t.assocWilayaHint}
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

          <label className="block text-[12.5px] font-bold mb-1.5" style={{ color: "#5A6B75", textAlign: "start" }}>{t.email}</label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="contact@association.dz"
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
          disabled={busy}
          className="cursor-pointer disabled:opacity-60 mt-[18px] w-full h-[54px] rounded-2xl text-white text-base font-extrabold shadow-[0_16px_28px_-14px_rgba(107,79,192,0.8)]"
          style={{ background: "linear-gradient(135deg,#6B4FC0,#8A6BD6)" }}
        >
          {busy ? t.posting : t.assocApplyCta}
        </button>

        <div className="mt-2.5 text-center text-[11.5px] leading-relaxed" style={{ color: "#8496A0" }}>
          {t.assocReviewNote}
        </div>
      </form>
    </div>
  );
}
