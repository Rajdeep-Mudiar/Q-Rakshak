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

export function normalizeLanguage(lang) {
  if (!lang || typeof lang !== "string") return "en";
  const lower = lang.toLowerCase().trim();
  if (lower.startsWith("hi")) return "hi";
  if (lower.startsWith("as")) return "as";
  return "en";
}

export function getLocaleTag(lang) {
  switch (normalizeLanguage(lang)) {
    case "hi":
      return "hi-IN";
    case "as":
      return "as-IN";
    default:
      return "en-IN";
  }
}

const LanguageContext = createContext({
  language: "en",
  setLanguage: () => {},
  t: (key, fallback) => fallback || key,
  formatDate: (date) => String(date || ""),
  formatNumber: (num) => String(num || 0),
  formatCurrency: (amount) => `₹${amount || 0}`,
  availableLanguages: AVAILABLE_LANGUAGES,
});

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    if (typeof window === "undefined") return "en";
    const saved = localStorage.getItem("qmed_language");
    return normalizeLanguage(saved);
  });

  const setLanguage = (nextLang) => {
    const normalized = normalizeLanguage(nextLang);
    setLanguageState(normalized);
    try {
      localStorage.setItem("qmed_language", normalized);
      if (typeof document !== "undefined") {
        document.documentElement.lang = normalized;
      }
      window.dispatchEvent(
        new CustomEvent("qmed:language_changed", { detail: { language: normalized } })
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
      if (e.key === "qmed_language" && e.newValue) {
        setLanguageState(normalizeLanguage(e.newValue));
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

  const formatDate = useMemo(() => {
    const locale = getLocaleTag(language);
    return (date, options) => {
      if (!date) return "";
      try {
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return String(date);
        return new Intl.DateTimeFormat(locale, options || {
          year: "numeric",
          month: "short",
          day: "numeric",
        }).format(d);
      } catch {
        return String(date);
      }
    };
  }, [language]);

  const formatNumber = useMemo(() => {
    const locale = getLocaleTag(language);
    return (num, options) => {
      if (num === null || num === undefined || isNaN(Number(num))) return "—";
      try {
        return new Intl.NumberFormat(locale, options).format(Number(num));
      } catch {
        return String(num);
      }
    };
  }, [language]);

  const formatCurrency = useMemo(() => {
    const locale = getLocaleTag(language);
    return (amount, currency = "INR") => {
      if (amount === null || amount === undefined || isNaN(Number(amount))) return "₹0";
      try {
        return new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
          maximumFractionDigits: 0,
        }).format(Number(amount));
      } catch {
        return `₹${amount}`;
      }
    };
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      formatDate,
      formatNumber,
      formatCurrency,
      availableLanguages: AVAILABLE_LANGUAGES,
    }),
    [language, t, formatDate, formatNumber, formatCurrency]
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
