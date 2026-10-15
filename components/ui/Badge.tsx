"use client";

import React from "react";
import { detectPlatform } from "@/lib/formatting";
import { useLanguage } from "@/lib/i18n";

interface PlatformBadgeProps {
  platformOrUrl?: string;
  className?: string;
}

// The marketplace written plainly on the board: a filled square chip, no outline
const PLATFORM_FILL: Record<string, string> = {
  shopee: "bg-[#F6DCCB] text-[#8A3510]",
  lazada: "bg-[#DCE3F5] text-[#22357A]",
  tiktok: "bg-pine-950 text-chalk",
  tiki: "bg-[#D9ECF6] text-[#174F6E]",
  other: "bg-pine-50 text-pine-900",
};

export function PlatformBadge({ platformOrUrl, className = "" }: PlatformBadgeProps) {
  const { id, name } = detectPlatform(platformOrUrl);

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[13px] font-bold ${PLATFORM_FILL[id] || PLATFORM_FILL.other} ${className}`}>
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
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-semibold ${
        active ? "bg-teal-200 text-pine-950" : "bg-pine-50 text-pine-700"
      } ${className}`}
    >
      <span className={`h-2 w-2 rounded-full ${active ? "bg-teal-500" : "bg-pine-300"}`} />
      {active ? t.tracking.statusTracking : t.tracking.statusPaused}
    </span>
  );
}
