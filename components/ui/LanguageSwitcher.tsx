"use client";

import React from "react";
import { useLanguage } from "@/lib/i18n";
import { Globe } from "lucide-react";

interface LanguageSwitcherProps {
  variant?: "pill" | "button" | "select";
  className?: string;
}

export function LanguageSwitcher({
  variant = "pill",
  className = "",
}: LanguageSwitcherProps) {
  const { locale, setLocale, toggleLocale, t } = useLanguage();

  if (variant === "select") {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <Globe className="h-4 w-4 text-pine-700" />
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value as "vi" | "en")}
          className="h-10 bg-pine-50 px-3 text-sm font-semibold text-pine-900 hover:bg-pine-100"
          aria-label="Language selection"
        >
          <option value="vi">Tiếng Việt (VI)</option>
          <option value="en">English (EN)</option>
        </select>
      </div>
    );
  }

  // Two plain letters on the board strip; the current one is in full chalk
  return (
    <button
      type="button"
      onClick={toggleLocale}
      className={`inline-flex h-9 items-center gap-1 px-2 text-sm font-semibold text-chalk/70 transition-colors hover:text-chalk ${className}`}
      title={t.nav.languageToggle}
      aria-label={t.nav.languageToggle}
    >
      <Globe className="hidden h-4 w-4 sm:block" />
      <span className={locale === "vi" ? "text-chalk" : ""}>VI</span>
      <span aria-hidden className="text-chalk/40">/</span>
      <span className={locale === "en" ? "text-chalk" : ""}>EN</span>
    </button>
  );
}
