import { createContext, useContext, useMemo, useState } from "react";
import { interpolate, translations } from "../i18n/translations";

const I18nContext = createContext(null);

function getInitialLang() {
  try {
    const saved = localStorage.getItem("gk-lang");
    if (saved && translations[saved]) return saved;
  } catch {
    /* ignore */
  }
  return "en";
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLang);

  const setLang = (next) => {
    setLangState(next);
    try {
      localStorage.setItem("gk-lang", next);
    } catch {
      /* ignore */
    }
  };

  const t = useMemo(() => {
    const dict = translations[lang] || translations.en;
    const read = (path, vars) => {
      const value = path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), dict);
      const fallback = path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), translations.en);
      return interpolate(value ?? fallback ?? path, vars);
    };
    return read;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// Context consumers intentionally share this provider module.
// eslint-disable-next-line react/only-export-components
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
