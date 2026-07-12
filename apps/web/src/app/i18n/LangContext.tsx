import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { I18N, dir, fontStack, type Lang } from "@weare/core";

const STORAGE_KEY = "qatra-lang";

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LangContext = createContext<LangContextValue | null>(null);

function readStoredLang(): Lang {
  const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
  return stored === "en" || stored === "fr" || stored === "ar" ? stored : "en";
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  const setLang = (next: Lang) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

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
