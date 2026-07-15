import { useState } from "react";
import { ArrowLeft, Check, ChevronDown } from "lucide-react";
import { LANGS, WILAYAS, type Lang } from "@weare/core";
import { useI18n } from "../i18n/LangContext";
import { getBoolPref, setBoolPref, getDefaultWilaya, setDefaultWilaya, isRamadanNow } from "../prefs";

interface SettingsScreenProps {
  onBack: () => void;
}

const LANG_LABEL: Record<Lang, string> = { en: "English", fr: "Français", ar: "العربية" };

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-5 text-[15px] font-extrabold mb-[11px]" style={{ color: "#0B2432", textAlign: "start" }}>
      {children}
    </div>
  );
}

function PrefToggleRow({
  label,
  prefKey,
  defaultOn,
  divider,
}: {
  label: string;
  prefKey: "ramadan" | "notifUrgent" | "notifRamadan" | "notifNearby";
  defaultOn: boolean;
  divider?: boolean;
}) {
  const { dir } = useI18n();
  const [on, setOn] = useState(() => getBoolPref(prefKey, defaultOn));
  const knobSide = (on && dir !== "rtl") || (!on && dir === "rtl") ? "right" : "left";
  return (
    <div
      className="flex items-center justify-between px-[15px] py-[15px]"
      style={divider ? { borderBottom: "1px solid rgba(11,36,50,0.05)" } : undefined}
    >
      <span className="text-sm font-semibold" style={{ color: "#0B2432", textAlign: "start" }}>{label}</span>
      <button
        onClick={() => {
          const next = !on;
          setOn(next);
          setBoolPref(prefKey, next);
        }}
        className="cursor-pointer w-11 h-[26px] rounded-full relative transition-colors shrink-0"
        style={{ background: on ? "#12B76A" : "#D6DEE2" }}
      >
        <span
          className="absolute top-[3px] w-5 h-5 rounded-full bg-white transition-all"
          style={{ [knobSide]: "3px" } as React.CSSProperties}
        />
      </button>
    </div>
  );
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const { t, lang, setLang, dir } = useI18n();
  const chevronFlip = dir === "rtl" ? "scaleX(-1)" : undefined;
  const [wilaya, setWilaya] = useState<string>(() => getDefaultWilaya() ?? "");

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

      <SectionTitle>{t.languageLabel}</SectionTitle>
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

      <SectionTitle>{t.notifications}</SectionTitle>
      <div className="bg-white border rounded-2xl overflow-hidden" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
        <PrefToggleRow label={t.notifUrgent} prefKey="notifUrgent" defaultOn divider />
        <PrefToggleRow label={t.notifRamadan} prefKey="notifRamadan" defaultOn divider />
        <PrefToggleRow label={t.notifNearby} prefKey="notifNearby" defaultOn={false} />
      </div>

      <SectionTitle>{t.preferencesLabel}</SectionTitle>
      <div className="bg-white border rounded-2xl overflow-hidden" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
        <PrefToggleRow label={t.ramadanToggle} prefKey="ramadan" defaultOn={isRamadanNow()} divider />
        <div className="px-[15px] py-[15px]">
          <label className="block text-sm font-semibold mb-2" style={{ color: "#0B2432", textAlign: "start" }}>
            {t.defaultWilayaLabel}
          </label>
          <div className="relative">
            <select
              value={wilaya}
              onChange={(e) => {
                setWilaya(e.target.value);
                setDefaultWilaya(e.target.value || null);
              }}
              className="w-full h-11 rounded-[13px] border-[1.5px] px-3.5 text-[14px] outline-none appearance-none"
              style={{ borderColor: "rgba(11,36,50,0.1)", background: "#F7FAFB", color: "#0B2432", textAlign: "start" }}
            >
              <option value="">{t.allWilayas}</option>
              {WILAYAS.map((w) => (
                <option key={w.code} value={w.fr}>
                  {w.code} — {w[lang]}
                </option>
              ))}
            </select>
            <ChevronDown
              className="w-4 h-4 absolute top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ insetInlineEnd: "14px", color: "#8496A0" }}
            />
          </div>
        </div>
      </div>

      <SectionTitle>{t.aboutLabel}</SectionTitle>
      <div className="bg-white border rounded-2xl overflow-hidden px-[15px] py-[15px] flex items-center justify-between" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
        <span className="text-sm font-semibold" style={{ color: "#0B2432" }}>{t.versionLabel}</span>
        <span className="text-sm" style={{ color: "#8496A0" }}>Qatra · قطرة 1.0.0</span>
      </div>
    </div>
  );
}
