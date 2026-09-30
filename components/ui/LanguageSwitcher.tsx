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
  const { locale, setLocale, toggleLocale } = useLanguage();

  if (variant === "select") {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <Globe className="w-4 h-4 text-slate-400" />
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value as "vi" | "en")}
          className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-pine-900/10 focus:border-pine-900"
          aria-label="Language selection"
        >
          <option value="vi">Tiếng Việt (VI)</option>
          <option value="en">English (EN)</option>
        </select>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleLocale}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs ${className}`}
      title={locale === "vi" ? "Switch to English" : "Chuyển sang Tiếng Việt"}
      aria-label="Toggle language"
    >
      <Globe className="w-3.5 h-3.5 text-slate-500" />
      <span className="uppercase font-mono text-[11px] tracking-wide">
        {locale}
      </span>
    </button>
  );
}
