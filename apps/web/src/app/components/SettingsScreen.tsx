import { useEffect, useState } from "react";
import { ArrowLeft, Check, ChevronDown, ChevronRight, ShieldCheck } from "lucide-react";
import { LANGS, WILAYAS, hasCurrentConsent, recordConsent, withdrawConsent, type Lang, errorMessage} from "@weare/core";
import { useI18n } from "../i18n/LangContext";
import { useToast } from "./Toast";
import { PushSettings } from "./PushSettings";
import { getBoolPref, setBoolPref, getDefaultWilaya, setDefaultWilaya, isRamadanNow } from "../prefs";

interface SettingsScreenProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
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

/**
 * The donor's own switch for letting verified associations see their phone
 * number and call them.
 *
 * Unlike the neighbouring toggles this is not a device preference — it is a
 * consent record in the database, because it governs who may process personal
 * data. Turning it off stamps the existing record as withdrawn rather than
 * deleting it, so the period during which contact was permitted stays on the
 * record.
 */
function ContactSharingRow() {
  const { t } = useI18n();
  const toast = useToast();
  const [on, setOn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    hasCurrentConsent("contact_sharing")
      .then((v) => {
        if (!cancelled) setOn(v);
      })
      .catch(() => {
        if (!cancelled) setOn(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = async () => {
    if (on === null || busy) return;
    setBusy(true);
    const next = !on;
    try {
      if (next) await recordConsent("contact_sharing");
      else await withdrawConsent("contact_sharing");
      setOn(next);
      toast("success", next ? t.contactConsentOn : t.contactConsentOff);
    } catch (err) {
      toast("error", errorMessage(err, t.genericError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-[15px] py-[15px]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold" style={{ color: "#0B2432", textAlign: "start" }}>
          {t.contactConsentToggle}
        </span>
        <button
          onClick={toggle}
          disabled={on === null || busy}
          aria-pressed={on === true}
          className="cursor-pointer disabled:opacity-50 w-11 h-[26px] rounded-full relative transition-colors shrink-0 border-none"
          style={{ background: on ? "#12B76A" : "#D6DEE2" }}
        >
          <span
            className="absolute top-[3px] w-5 h-5 rounded-full bg-white transition-all"
            style={on ? { insetInlineEnd: "3px" } : { insetInlineStart: "3px" }}
          />
        </button>
      </div>
      <div className="mt-1.5 text-xs leading-relaxed" style={{ color: "#8496A0", textAlign: "start" }}>
        {t.contactConsentBody}
      </div>
    </div>
  );
}

export function SettingsScreen({ onBack, onNavigate }: SettingsScreenProps) {
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

      {/* First, above language: it is the only setting here that changes
          whether the app can reach you when it matters. */}
      <PushSettings />

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

      <SectionTitle>{t.contactConsentTitle}</SectionTitle>
      <div className="bg-white border rounded-2xl overflow-hidden" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
        <ContactSharingRow />
      </div>

      <SectionTitle>{t.dataRightsTitle}</SectionTitle>
      <button
        onClick={() => onNavigate("data-rights")}
        className="cursor-pointer w-full bg-white border rounded-2xl px-[15px] py-[15px] flex items-center gap-3"
        style={{ borderColor: "rgba(11,36,50,0.06)", textAlign: "start" }}
      >
        <span className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "#EAF6EF" }}>
          <ShieldCheck className="w-[17px] h-[17px]" style={{ color: "#0E7A4B" }} />
        </span>
        <span className="flex-1 text-sm font-semibold" style={{ color: "#0B2432" }}>{t.dataRightsSub}</span>
        <ChevronRight className="w-[19px] h-[19px] shrink-0" style={{ color: "#C0CCD2", transform: chevronFlip }} />
      </button>

      <SectionTitle>{t.aboutLabel}</SectionTitle>
      <div className="bg-white border rounded-2xl overflow-hidden px-[15px] py-[15px] flex items-center justify-between" style={{ borderColor: "rgba(11,36,50,0.06)" }}>
        <span className="text-sm font-semibold" style={{ color: "#0B2432" }}>{t.versionLabel}</span>
        <span className="text-sm" style={{ color: "#8496A0" }}>Qatra · قطرة 1.0.0</span>
      </div>
    </div>
  );
}
