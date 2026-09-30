"use client";

import React from "react";
import Link from "next/link";
import { Radar, ArrowRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  actionHref?: string;
  onSampleClick?: (url: string) => void;
}

export function EmptyState({
  title,
  description,
  actionText,
  actionHref = "/",
  onSampleClick,
}: EmptyStateProps) {
  const { t } = useLanguage();

  const finalTitle = title || t.tracking.emptyTitle;
  const finalDesc = description || t.tracking.emptyDesc;
  const finalAction = actionText || t.tracking.trackPriceBtn;

  const sampleProducts = [
    {
      name: "Tai nghe Sony WH-1000XM6",
      url: "https://mock.dealhunter.vn/product/sony-wh-1000xm6",
      platform: "Shopee",
    },
    {
      name: "MacBook Pro 14 M3 18GB",
      url: "https://mock.dealhunter.vn/product/macbook-pro-m3",
      platform: "Lazada",
    },
    {
      name: "iPhone 16 Pro Max 256GB",
      url: "https://mock.dealhunter.vn/product/iphone-16-pro-max",
      platform: "TikTok",
    },
  ];

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

      <div className="mt-8 pt-6 border-t border-slate-100">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{t.home.orChooseSample}</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          {sampleProducts.map((sample) => (
            <Link
              key={sample.name}
              href={`/?sample=${encodeURIComponent(sample.url)}`}
              onClick={() => onSampleClick && onSampleClick(sample.url)}
              className="text-xs px-3 py-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-xl transition-colors border border-slate-200/80 font-medium"
            >
              {sample.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
