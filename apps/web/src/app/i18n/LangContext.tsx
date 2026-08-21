import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { rememberLanguage } from "@weare/core";
import { I18N, dir, fontStack, type Lang } from "@weare/core";

const STORAGE_KEY = "qatra-lang";

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LangContext = createContext<LangContextValue | null>(null);

function readStoredLang(): Lang {
  const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
  if (stored === "en" || stored === "fr" || stored === "ar") return stored;
  // First launch: match the device language. Most Algerian phones are set to
  // Arabic or French -- defaulting those users to English reads as foreign.
  const device = typeof navigator !== "undefined" ? navigator.language.toLowerCase() : "";
  if (device.startsWith("ar")) return "ar";
  if (device.startsWith("fr")) return "fr";
  return "en";
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  const setLang = (next: Lang) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    /*
     * Tell the server too, so a push notification arrives in this language.
     * localStorage is invisible to the worker composing the message, and
     * best-effort because switching language must not fail on a bad
     * connection.
     */
    void rememberLanguage(next).catch(() => {});
  };

  // Also on first load: someone who picked Arabic before this existed, or who
  // signs in on a new device, has a profile that still says nothing.
  useEffect(() => {
    void rememberLanguage(lang).catch(() => {});
  }, [lang]);

  useEffect(() => {
    document.documentElement.dir = dir(lang);
    document.documentElement.lang = lang;
  }, [lang]);

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useI18n() must be used within a LangProvider");
  return { lang: ctx.lang, setLang: ctx.setLang, t: I18N[ctx.lang], dir: dir(ctx.lang), font: fontStack(ctx.lang) };
}
