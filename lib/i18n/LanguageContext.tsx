"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { vi } from "./dictionaries/vi";
import { en } from "./dictionaries/en";
import type { Dictionary, Locale } from "./types";

const dictionaries: Record<Locale, Dictionary> = {
  vi,
  en,
};

const LOCALE_STORAGE_KEY = "dealhunter-locale";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: Dictionary;
  formatText: (template: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: "vi",
  setLocale: () => {},
  toggleLocale: () => {},
  t: vi,
  formatText: (t) => t,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("vi");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
      if (saved && (saved === "vi" || saved === "en")) {
        setLocaleState(saved);
      }
    } catch {}
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
      if (typeof document !== "undefined") {
        document.documentElement.lang = newLocale;
      }
    } catch {}
  };

  const toggleLocale = () => {
    const nextLocale: Locale = locale === "vi" ? "en" : "vi";
    setLocale(nextLocale);
  };

  const formatText = (template: string, vars?: Record<string, string | number>): string => {
    if (!vars) return template;
    return Object.entries(vars).reduce(
      (acc, [key, val]) => acc.replace(new RegExp(`\\{${key}\\}`, "g"), String(val)),
      template
    );
  };

  const t = dictionaries[locale];

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale,
        toggleLocale,
        t,
        formatText,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export const useTranslation = useLanguage;
