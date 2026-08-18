import { useState } from "react";
import { ArrowLeft, ShieldCheck, Smartphone } from "lucide-react";
import { sendVerificationCode, confirmVerificationCode, normalizeAlgerianPhone } from "@weare/core";
import { useI18n } from "../i18n/LangContext";
import { useToast } from "./Toast";

interface PhoneVerificationScreenProps {
  onBack: () => void;
  onVerified: () => void;
  /**
   * Offers a way past this screen. Set when verification is a step in
   * registration rather than a gate in front of an action the user has already
   * chosen to take.
   */
  onSkip?: () => void;
}

/**
 * Phone OTP step. Required before posting a request — RLS rejects the insert
 * from an unverified account, so this is the gate rather than a nicety, and a
 * phone number is also the only way a donor can actually reach the family.
 *
 * The provider behind sendVerificationCode/confirmVerificationCode is
 * swappable (see packages/core/src/otp.ts); nothing here knows which one is
 * configured.
 */
export function PhoneVerificationScreen({ onBack, onVerified, onSkip }: PhoneVerificationScreenProps) {
  const { t, dir } = useI18n();
  const toast = useToast();
  const chevronFlip = dir === "rtl" ? "scaleX(-1)" : undefined;

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [normalized, setNormalized] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputStyle = { borderColor: "rgba(11,36,50,0.1)", background: "#F7FAFB", color: "#0B2432" } as const;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const e164 = normalizeAlgerianPhone(phone);
    if (!e164) {
      setError(t.invalidPhone);
      return;
    }

    setBusy(true);
    try {
      await sendVerificationCode(e164);
      setNormalized(e164);
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.genericError);
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await confirmVerificationCode(normalized, code);
      toast("success", t.phoneVerifiedToast);
      onVerified();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.genericError);
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
        <div>
          <div className="text-xl font-extrabold" style={{ color: "#0B2432" }}>{t.verifyPhoneTitle}</div>
          <div className="text-[12.5px]" style={{ color: "#8496A0" }}>{t.verifyPhoneSub}</div>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl p-4 mb-4" style={{ background: "#E4F6FB", border: "1px solid rgba(14,139,168,0.2)" }}>
        <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#0E8BA8" }} />
        <div className="text-[13px]" style={{ color: "#0B4A5A", textAlign: "start" }}>{t.verifyRequiredNote}</div>
      </div>

      <form onSubmit={step === "phone" ? handleSend : handleVerify}>
        <div className="bg-white border rounded-[20px] p-[18px]" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
          {step === "phone" ? (
            <>
              <label className="block text-[12.5px] font-bold mb-1.5" style={{ color: "#5A6B75", textAlign: "start" }}>{t.phoneLabel}</label>
              <div className="relative">
                <Smartphone className="w-[18px] h-[18px] absolute top-1/2 -translate-y-1/2 pointer-events-none" style={{ insetInlineStart: "13px", color: "#8496A0" }} />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05 55 12 34 56"
                  inputMode="tel"
                  required
                  className="w-full h-12 rounded-[13px] border-[1.5px] text-[15px] outline-none"
                  style={{ ...inputStyle, direction: "ltr", textAlign: "start", paddingInlineStart: "40px", paddingInlineEnd: "14px" }}
                />
              </div>
            </>
          ) : (
            <>
              <label className="block text-[12.5px] font-bold mb-1.5" style={{ color: "#5A6B75", textAlign: "start" }}>{t.codeLabel}</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                inputMode="numeric"
                required
                className="w-full h-12 rounded-[13px] border-[1.5px] px-3.5 text-[19px] font-extrabold tracking-[6px] outline-none"
                style={{ ...inputStyle, direction: "ltr", textAlign: "center" }}
              />
              <div className="mt-2 text-[12px]" style={{ color: "#8496A0", direction: "ltr", textAlign: "start" }}>{normalized}</div>
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
          disabled={busy}
          className="cursor-pointer disabled:opacity-60 mt-[18px] w-full h-[54px] rounded-2xl text-white text-base font-extrabold shadow-[0_16px_28px_-14px_rgba(14,139,168,0.8)]"
          style={{ background: "linear-gradient(135deg,#0E8BA8,#23A6C4)" }}
        >
          {step === "phone"
            ? busy ? t.sendingCode : t.sendCodeCta
            : busy ? t.verifyingCode : t.verifyCodeCta}
        </button>

        {/*
          Registration offers a way past this. Verification is what RLS
          requires to *post a request*, not to hold an account, so blocking
          sign-up on it would strand anyone whose SMS never arrives — and
          leave the app unusable anywhere an SMS provider isn't configured.
        */}
        {onSkip && (
          <>
            <button
              type="button"
              onClick={onSkip}
              className="cursor-pointer mt-3.5 w-full text-center text-[13.5px] font-semibold border-none bg-transparent"
              style={{ color: "#5A6B75" }}
            >
              {t.skipForNow}
            </button>
            <div className="mt-1.5 text-center text-[12px]" style={{ color: "#8496A0" }}>
              {t.verifyLaterHint}
            </div>
          </>
        )}
      </form>
    </div>
  );
}
