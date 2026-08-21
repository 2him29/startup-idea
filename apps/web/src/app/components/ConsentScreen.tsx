import { useState } from "react";
import { ArrowLeft, Check, HeartPulse, Lock, ShieldCheck } from "lucide-react";
import { recordConsent, CONSENT_VERSIONS, errorMessage} from "@weare/core";
import { useI18n } from "../i18n/LangContext";

interface ConsentScreenProps {
  onBack: () => void;
  onConsented: () => void;
}

/**
 * Explicit consent for processing health data, kept separate from the general
 * terms checkbox on the registration form.
 *
 * That separation is the point: a bundled "I accept the terms" tick is not
 * specific consent to process medical data, so it would not hold up under
 * Loi 18-07 / 25-11. The version of the copy shown here is stored alongside
 * the timestamp (see CONSENT_VERSIONS in packages/core/src/compliance.ts) —
 * without it, consent given against older wording is indistinguishable from
 * consent to the current text.
 */
export function ConsentScreen({ onBack, onConsented }: ConsentScreenProps) {
  const { t, dir } = useI18n();
  const chevronFlip = dir === "rtl" ? "scaleX(-1)" : undefined;

  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Each point is a pair: what we do with this data, and what we never do with
   * it. People skim consent screens for the catch, so the answer to "who else
   * sees this?" sits next to the claim rather than in a policy nobody opens.
   */
  const points = [
    { icon: HeartPulse, text: t.consentPoint1, never: t.consentNever1, bg: "#FFECEC", fg: "#E5484D" },
    { icon: Lock, text: t.consentPoint2, never: t.consentNever2, bg: "#E4F6FB", fg: "#0E8BA8" },
    { icon: ShieldCheck, text: t.consentPoint3, never: null, bg: "#EAF6EF", fg: "#0E7A4B" },
  ];

  const handleContinue = async () => {
    if (!agreed) {
      setError(t.consentRequiredError);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await recordConsent("health_data");
      onConsented();
    } catch (err) {
      setError(errorMessage(err, t.genericError));
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
        <div className="text-xl font-extrabold" style={{ color: "#0B2432" }}>{t.consentTitle}</div>
      </div>

      <div className="bg-white border rounded-[20px] p-[18px]" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
        <p className="text-[13.5px] leading-relaxed m-0" style={{ color: "#5A6B75", textAlign: "start" }}>{t.consentIntro}</p>

        {/* The scope, stated before the detail: two fields, not "your data". */}
        <div
          className="mt-3 rounded-2xl px-3.5 py-2.5 text-[13px] font-bold"
          style={{ background: "#F7FAFB", color: "#0B2432", textAlign: "start" }}
        >
          {t.consentScope}
        </div>

        <div className="mt-4 flex flex-col gap-3.5">
          {points.map((point, i) => {
            const Icon = point.icon;
            return (
              <div key={i} className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: point.bg }}>
                  <Icon className="w-[17px] h-[17px]" style={{ color: point.fg }} />
                </span>
                <span className="flex-1" style={{ textAlign: "start" }}>
                  <span className="block text-[13.5px] font-semibold" style={{ color: "#0B2432" }}>{point.text}</span>
                  {point.never && (
                    <span className="block text-[12.5px] mt-1 leading-relaxed" style={{ color: "#8496A0" }}>
                      {point.never}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => {
          setAgreed((a) => !a);
          setError(null);
        }}
        className="cursor-pointer mt-4 w-full flex items-start gap-3 rounded-2xl p-4 border bg-white"
        style={{ borderColor: agreed ? "#12B76A" : "rgba(11,36,50,0.1)", textAlign: "start" }}
      >
        <span
          className="w-[22px] h-[22px] rounded-[7px] shrink-0 mt-0.5 flex items-center justify-center border-2"
          style={{
            background: agreed ? "#12B76A" : "transparent",
            borderColor: agreed ? "#12B76A" : "rgba(11,36,50,0.2)",
          }}
        >
          {agreed && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3.5} />}
        </span>
        <span className="text-[13.5px] font-semibold flex-1" style={{ color: "#0B2432" }}>{t.consentAgreeLabel}</span>
      </button>

      {error && (
        <div className="mt-3.5 rounded-2xl px-4 py-3 text-[13px]" style={{ background: "#FFECEC", color: "#8A3438", border: "1px solid #FBD3D3", textAlign: "start" }}>
          {error}
        </div>
      )}

      {/*
        The stored version, shown. What gets written to consent_records is this
        identifier, and a consent you cannot tie to the wording it covered is
        not much of a record.
      */}
      <div className="mt-3 text-center text-[11.5px]" style={{ color: "#8496A0" }}>
        {t.consentVersionNote.replace("{version}", CONSENT_VERSIONS.health_data)}
      </div>

      <button
        onClick={handleContinue}
        disabled={busy}
        className="cursor-pointer disabled:opacity-60 mt-[18px] w-full h-[54px] rounded-2xl text-white text-base font-extrabold shadow-[0_16px_28px_-14px_rgba(229,72,77,0.8)]"
        style={{ background: "linear-gradient(135deg,#E5484D,#F4677E)" }}
      >
        {t.consentContinueCta}
      </button>
    </div>
  );
}
