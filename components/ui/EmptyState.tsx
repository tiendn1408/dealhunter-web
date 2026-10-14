"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { PriceTag } from "@/components/PriceTag";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  actionHref?: string;
}

/** An empty board: one blank tag waiting for its first price, one action. */
export function EmptyState({ title, description, actionText, actionHref = "/" }: EmptyStateProps) {
  const { t } = useLanguage();

  const finalTitle = title || t.tracking.emptyTitle;
  const finalDesc = description || t.tracking.emptyDesc;
  const finalAction = actionText || t.tracking.trackPriceBtn;

  return (
    <div className="grid items-center gap-10 bg-pine-900 p-8 text-chalk sm:p-12 md:grid-cols-[1fr_auto]">
      <div>
        <h3 className="text-[clamp(28px,3.2vw,40px)] font-extrabold leading-tight">{finalTitle}</h3>
        <p className="mt-3 max-w-[46ch] text-[17px] leading-relaxed text-chalk/90">{finalDesc}</p>
        <Link
          href={actionHref}
          className="mt-7 inline-flex min-h-[48px] items-center gap-2 bg-teal-400 px-6 text-[15px] font-bold text-pine-950 transition-colors hover:bg-teal-300"
        >
          {finalAction}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="mt-6 text-[15px] text-chalk/75">{t.home.supportedPlatformsNote}</p>
      </div>
      <div aria-hidden className="mx-auto w-[220px]">
        <PriceTag>
          <span className="block text-[48px] font-extrabold leading-none opacity-30">… đ</span>
        </PriceTag>
      </div>
    </div>
  );
}
