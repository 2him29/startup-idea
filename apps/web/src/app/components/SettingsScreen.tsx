import { ArrowLeft, Check } from "lucide-react";
import { LANGS, type Lang } from "@weare/core";
import { useI18n } from "../i18n/LangContext";

interface SettingsScreenProps {
  onBack: () => void;
}

const LANG_LABEL: Record<Lang, string> = { en: "English", fr: "Français", ar: "العربية" };

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const { t, lang, setLang, dir } = useI18n();
  const chevronFlip = dir === "rtl" ? "scaleX(-1)" : undefined;

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
        <div className="text-xl font-extrabold" style={{ color: "#0B2432" }}>{t.settingsLabel}</div>
      </div>

      <div className="text-[15px] font-extrabold mb-[11px]" style={{ color: "#0B2432", textAlign: "start" }}>{t.languageLabel}</div>
      <div className="bg-white border rounded-2xl overflow-hidden" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
        {LANGS.map((l, i) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className="cursor-pointer w-full text-start border-none bg-transparent py-[15px] px-[15px] flex items-center gap-3"
            style={i < LANGS.length - 1 ? { borderBottom: "1px solid rgba(11,36,50,0.05)" } : undefined}
          >
            <span className="flex-1 text-[15px] font-semibold" style={{ color: "#0B2432" }}>{LANG_LABEL[l]}</span>
            {lang === l && <Check className="w-[18px] h-[18px]" style={{ color: "#E5484D" }} strokeWidth={3} />}
          </button>
        ))}
      </div>

      <div className="mt-8 text-center text-xs" style={{ color: "#B8C4CA" }}>Qatra · قطرة v1.0.0</div>
    </div>
  );
}
