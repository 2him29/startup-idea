import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { signIn, signUpDonor, signUpHospital, type Profile } from "@weare/core";
import { QatraMark } from "./QatraMark";
import { useI18n } from "../i18n/LangContext";

interface AuthScreenProps {
  role: "donor" | "hospital";
  onBack: () => void;
  onAuthenticated: (profile: Profile) => void;
}

export function AuthScreen({ role, onBack, onAuthenticated }: AuthScreenProps) {
  const { t, lang, dir } = useI18n();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isHospital = role === "hospital";
  const accent = isHospital ? "#0E8BA8" : "#E5484D";
  const gradient = isHospital
    ? "linear-gradient(135deg,#0E8BA8,#23A6C4)"
    : "linear-gradient(135deg,#E5484D,#F4677E)";
  const chevronFlip = dir === "rtl" ? "scaleX(-1)" : undefined;

  // Auth-flow micro-copy is computed per role/mode/lang (matches the design
  // prototype's own approach -- these are too situational for the shared
  // dictionary, which only holds static per-screen strings).
  const authTitle = mode === "signup"
    ? (lang === "fr" ? "Créer un compte" : lang === "ar" ? "إنشاء حساب" : "Create account")
    : (lang === "fr" ? "Se connecter" : lang === "ar" ? "تسجيل الدخول" : "Log in");
  const authAccountLabel = isHospital
    ? (lang === "fr" ? "Compte hôpital" : lang === "ar" ? "حساب مستشفى" : "Hospital account")
    : (lang === "fr" ? "Compte donneur" : lang === "ar" ? "حساب متبرع" : "Donor account");
  const authSwitch = mode === "signup"
    ? (lang === "fr" ? "Déjà un compte ? Se connecter" : lang === "ar" ? "لديك حساب؟ سجّل الدخول" : "Already have an account? Log in")
    : (lang === "fr" ? "Nouveau ? Créer un compte" : lang === "ar" ? "جديد؟ أنشئ حساباً" : "New here? Create an account");
  const nameLabel = isHospital
    ? (lang === "fr" ? "Nom de l'hôpital" : lang === "ar" ? "اسم المستشفى" : "Hospital name")
    : t.fullName;
  const namePlaceholder = isHospital ? "CHU Mustapha Pacha" : lang === "ar" ? "ياسين ب." : "Yacine B.";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const profile =
        mode === "login"
          ? await signIn({ email, password })
          : isHospital
          ? await signUpHospital({ hospitalName: name, email, password })
          : await signUpDonor({ fullName: name, email, password });
      onAuthenticated(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen px-5 pt-2 pb-[130px] md:flex md:flex-col md:items-center md:justify-center md:px-6 md:py-12"
      style={{ background: "linear-gradient(180deg,#FFF7F6 0%, #F6FBFC 58%, #FFFFFF 100%)" }}
    >
      <div className="md:w-full md:max-w-md">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="cursor-pointer w-[42px] h-[42px] rounded-[13px] border bg-white flex items-center justify-center"
          style={{ borderColor: "rgba(11,36,50,0.08)" }}
        >
          <ArrowLeft className="w-5 h-5" style={{ color: "#0B2432", transform: chevronFlip }} />
        </button>
        <div>
          <div className="text-xl font-extrabold" style={{ color: "#0B2432" }}>{authTitle}</div>
          <div className="text-[12.5px]" style={{ color: "#8496A0" }}>{authAccountLabel}</div>
        </div>
      </div>

      <div className="flex flex-col items-center text-center mb-[22px]">
        <QatraMark size={66} radius={20} style={{ boxShadow: "0 16px 30px -14px rgba(11,36,50,0.4)" }} />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white border rounded-[20px] p-[18px] shadow-[0_10px_24px_-20px_rgba(11,36,50,0.5)]" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
          {mode === "signup" && (
            <>
              <label className="block text-[12.5px] font-bold mb-1.5" style={{ color: "#5A6B75", textAlign: "start" }}>
                {nameLabel}
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={namePlaceholder}
                required
                className="w-full h-12 rounded-[13px] border-[1.5px] px-3.5 text-[15px] outline-none mb-3.5"
                style={{ borderColor: "rgba(11,36,50,0.1)", background: "#F7FAFB", color: "#0B2432" }}
              />
            </>
          )}

          <label className="block text-[12.5px] font-bold mb-1.5" style={{ color: "#5A6B75", textAlign: "start" }}>{t.email}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            required
            className="w-full h-12 rounded-[13px] border-[1.5px] px-3.5 text-[15px] outline-none mb-3.5"
            style={{ borderColor: "rgba(11,36,50,0.1)", background: "#F7FAFB", color: "#0B2432" }}
          />

          <label className="block text-[12.5px] font-bold mb-1.5" style={{ color: "#5A6B75", textAlign: "start" }}>{t.password}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            minLength={6}
            required
            className="w-full h-12 rounded-[13px] border-[1.5px] px-3.5 text-[15px] outline-none"
            style={{ borderColor: "rgba(11,36,50,0.1)", background: "#F7FAFB", color: "#0B2432" }}
          />
        </div>

        {error && (
          <div className="mt-3.5 rounded-2xl px-4 py-3 text-[13px]" style={{ background: "#FFECEC", color: "#8A3438", border: "1px solid #FBD3D3" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="cursor-pointer disabled:opacity-60 mt-[18px] w-full h-[54px] rounded-2xl text-white text-base font-extrabold shadow-[0_16px_28px_-14px_rgba(0,0,0,0.3)]"
          style={{ background: gradient }}
        >
          {loading ? "…" : authTitle}
        </button>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setMode((m) => (m === "signup" ? "login" : "signup"));
          }}
          className="cursor-pointer mt-3.5 w-full text-center text-[13.5px] font-semibold"
          style={{ color: accent }}
        >
          {authSwitch}
        </button>
      </form>
      </div>
    </div>
  );
}
