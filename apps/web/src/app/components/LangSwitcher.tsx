import { LANGS, type Lang } from "@weare/core";
import { useI18n } from "../i18n/LangContext";

const LABELS: Record<Lang, string> = { en: "EN", fr: "FR", ar: "ع" };

export function LangSwitcher({ className = "" }: { className?: string }) {
  const { lang, setLang } = useI18n();

  return (
    <div
      className={`inline-flex bg-white rounded-[14px] p-1 shadow-[0_8px_22px_-14px_rgba(11,36,50,0.5)] border ${className}`}
      style={{ borderColor: "rgba(11,36,50,0.06)" }}
    >
      {LANGS.map((l) => {
        const active = l === lang;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            // A fixed height with the label centred in it: at its own line
            // height, the Arabic letter sat lower than EN and FR.
            className="cursor-pointer border-none h-[30px] min-w-[38px] px-3 rounded-[10px] text-[12.5px] font-bold leading-none flex items-center justify-center"
            style={{
              background: active ? "#0B2432" : "transparent",
              color: active ? "#fff" : "#5A6B75",
              fontFamily: l === "ar" ? "'Cairo', sans-serif" : undefined,
            }}
          >
            {LABELS[l]}
          </button>
        );
      })}
    </div>
  );
}
