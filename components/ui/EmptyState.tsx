"use client";

import React from "react";
import Link from "next/link";
import { Radar, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  actionHref?: string;
}

export function EmptyState({
  title,
  description,
  actionText,
  actionHref = "/",
}: EmptyStateProps) {
  const { t } = useLanguage();

  const finalTitle = title || t.tracking.emptyTitle;
  const finalDesc = description || t.tracking.emptyDesc;
  const finalAction = actionText || t.tracking.trackPriceBtn;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-sm">
      <div className="w-16 h-16 bg-pine-50 border border-pine-100 text-pine-900 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-2xs">
        <Radar className="w-8 h-8 text-pine-900" />
      </div>

      <h3 className="text-xl font-bold text-pine-900 mb-2">{finalTitle}</h3>
      <p className="text-sm text-slate-500 mb-6 leading-relaxed">{finalDesc}</p>

      <Link
        href={actionHref}
        className="inline-flex items-center gap-2 px-6 py-3 bg-pine-900 hover:bg-pine-950 text-white rounded-full text-xs sm:text-sm font-semibold shadow-2xs transition-all"
      >
        <span>{finalAction}</span>
        <ArrowRight className="w-4 h-4" />
      </Link>

      <p className="mt-8 pt-6 border-t border-slate-100 text-xs text-slate-500">
        {t.home.supportedPlatformsNote}
      </p>
    </div>
  );
}
