"use client";

import React from "react";
import { detectPlatform } from "@/lib/formatting";
import { useLanguage } from "@/lib/i18n";

interface PlatformBadgeProps {
  platformOrUrl?: string;
  className?: string;
}

export function PlatformBadge({ platformOrUrl, className = "" }: PlatformBadgeProps) {
  const { name, badgeBg, badgeText, badgeBorder } = detectPlatform(platformOrUrl);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${badgeBg} ${badgeText} ${badgeBorder} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {name}
    </span>
  );
}

interface StatusBadgeProps {
  active: boolean;
  className?: string;
}

export function StatusBadge({ active, className = "" }: StatusBadgeProps) {
  const { t } = useLanguage();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
        active
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-slate-100 text-slate-600 border border-slate-200"
      } ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          active ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
        }`}
      />
      {active ? t.tracking.statusTracking : t.tracking.statusPaused}
    </span>
  );
}
