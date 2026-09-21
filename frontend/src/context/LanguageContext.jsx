import { createContext, useContext, useState, useEffect, useMemo } from "react";
import en from "../lang/en.json";
import hi from "../lang/hi.json";
import as from "../lang/as.json";

const translations = {
  en,
  hi,
  as,
};

export const AVAILABLE_LANGUAGES = [
  { code: "en", label: "English", nativeName: "English", shortBadge: "EN", flag: "🇬🇧" },
  { code: "hi", label: "Hindi", nativeName: "हिंदी", shortBadge: "हिं", flag: "🇮🇳" },
  { code: "as", label: "Assamese", nativeName: "অসমীয়া", shortBadge: "অ", flag: "🇮🇳" },
];

const LanguageContext = createContext({
  language: "en",
  setLanguage: () => {},
  t: (key, fallback) => fallback || key,
  availableLanguages: AVAILABLE_LANGUAGES,
});

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    if (typeof window === "undefined") return "en";
    const saved = localStorage.getItem("qmed_language");
    return saved && translations[saved] ? saved : "en";
  });

  const setLanguage = (nextLang) => {
    if (!translations[nextLang]) return;
    setLanguageState(nextLang);
    try {
      localStorage.setItem("qmed_language", nextLang);
      document.documentElement.lang = nextLang;
      window.dispatchEvent(
        new CustomEvent("qmed:language_changed", { detail: { language: nextLang } })
      );
    } catch (e) {
      console.warn("Could not save language to localStorage:", e);
    }
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }

    const handleStorage = (e) => {
      if (e.key === "qmed_language" && e.newValue && translations[e.newValue]) {
        setLanguageState(e.newValue);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [language]);

  /**
   * Translates a dot-notated key e.g. "actions.start_checkup"
   */
  const t = useMemo(() => {
    const dict = translations[language] || translations.en;
    const fallbackDict = translations.en;

    return (path, fallback, vars) => {
      if (!path) return "";
      const keys = path.split(".");

      let current = dict;
      for (const k of keys) {
        if (current && typeof current === "object" && k in current) {
          current = current[k];
        } else {
          current = undefined;
          break;
        }
      }

      if (current === undefined) {
        // Fallback to English dictionary
        let fallbackCurrent = fallbackDict;
        for (const k of keys) {
          if (fallbackCurrent && typeof fallbackCurrent === "object" && k in fallbackCurrent) {
            fallbackCurrent = fallbackCurrent[k];
          } else {
            fallbackCurrent = undefined;
            break;
          }
        }
        current = fallbackCurrent;
      }

      if (current !== undefined) {
        if (typeof current === "string" && vars && typeof vars === "object") {
          let str = current;
          for (const [vKey, vVal] of Object.entries(vars)) {
            str = str.replaceAll(`{${vKey}}`, vVal);
          }
          return str;
        }
        return current;
      }

      let res = fallback !== undefined ? fallback : keys[keys.length - 1];
      if (typeof res === "string" && vars && typeof vars === "object") {
        let str = res;
        for (const [vKey, vVal] of Object.entries(vars)) {
          str = str.replaceAll(`{${vKey}}`, vVal);
        }
        return str;
      }
      return res;
    };
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      availableLanguages: AVAILABLE_LANGUAGES,
    }),
    [language, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}

export default LanguageContext;
