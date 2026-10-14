"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowUpRight, Check, RotateCcw } from "lucide-react";
import { getTracking } from "@/lib/api";
import { detectPlatform, formatVND, isKnownPrice } from "@/lib/formatting";
import { useLanguage } from "@/lib/i18n";
import { PlatformBadge } from "@/components/ui/Badge";

/** After this long without a price the marketplace is slow: say so, keep polling in the background. */
const SLOW_AFTER_MS = 45_000;
const POLL_MS = 2_000;

export interface TryTarget {
  id: string;
  productSourceId: string;
  url: string;
}

/**
 * The visitor's first result, read for real: polls the new tracking until the server has the title
 * and the current price (the first fetch runs right after tracking starts). Nothing is shown that
 * the server did not return.
 */
export function TryResult({ target, onReset }: { target: TryTarget; onReset: () => void }) {
  const { t, formatText } = useLanguage();
  const [startedAt] = useState(() => Date.now());
  const [slow, setSlow] = useState(false);

  const { data } = useQuery({
    queryKey: ["tracking", target.id],
    queryFn: () => getTracking(target.id),
    refetchInterval: (q) => (isKnownPrice(q.state.data?.LastPrice) && q.state.data?.Title ? false : POLL_MS),
    staleTime: 0,
  });

  const ready = Boolean(data?.Title) && isKnownPrice(data?.LastPrice);
  useEffect(() => {
    if (ready) return;
    const timer = setTimeout(() => setSlow(true), Math.max(0, SLOW_AFTER_MS - (Date.now() - startedAt)));
    return () => clearTimeout(timer);
  }, [ready, startedAt]);

  const platform = detectPlatform(data?.Platform || data?.CanonicalURL || target.url).name;
  const detailHref = `/tracking/${target.productSourceId || target.id}`;
  const buyHref = data?.AffiliateURL || data?.CanonicalURL || target.url;

  if (!ready) {
    const steps = [
      { label: t.landing.stepLink, done: true },
      { label: formatText(t.landing.stepPrice, { platform }), done: false },
      { label: t.landing.stepHistory, done: false },
    ];
    return (
      <div className="w-full rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/10 backdrop-blur-sm animate-rise-in" aria-live="polite">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-300">{t.landing.readingTitle}</p>
        <div className="mt-4 space-y-2.5">
          <div className="h-4 w-4/5 rounded-full skeleton-shimmer animate-shimmer" />
          <div className="h-4 w-3/5 rounded-full skeleton-shimmer animate-shimmer" />
          <div className="mt-4 h-9 w-2/5 rounded-xl skeleton-shimmer animate-shimmer" />
        </div>
        <ol className="mt-6 space-y-2.5">
          {steps.map((s, i) => {
            const active = !s.done && steps.slice(0, i).every((x) => x.done);
            return (
              <li key={s.label} className="flex items-center gap-2.5 text-sm">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    s.done ? "bg-teal-400 text-pine-950" : active ? "ring-2 ring-teal-400/70" : "ring-1 ring-white/20"
                  }`}
                >
                  {s.done ? (
                    <Check className="h-3 w-3" strokeWidth={3} />
                  ) : active ? (
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-300" />
                  ) : null}
                </span>
                <span className={s.done || active ? "text-white" : "text-white/45"}>{s.label}</span>
              </li>
            );
          })}
        </ol>
        {slow && (
          <div className="mt-5 rounded-2xl bg-honey-400/10 p-3.5 text-xs leading-relaxed text-honey-100 ring-1 ring-honey-400/25">
            {formatText(t.landing.slowNote, { platform })}
            <Link href={detailHref} className="mt-2 flex items-center gap-1 font-semibold text-honey-300 hover:underline">
              {t.landing.openProduct}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full rounded-3xl bg-white p-6 text-slate-900 shadow-2xl shadow-black/30 animate-rise-in" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <PlatformBadge platformOrUrl={data?.Platform || data?.CanonicalURL || target.url} />
        {data?.LastInStock !== undefined && (
          <span className={`text-xs font-semibold ${data.LastInStock ? "text-emerald-600" : "text-rose-600"}`}>
            {data.LastInStock ? t.landing.inStock : t.landing.outOfStock}
          </span>
        )}
      </div>
      <h3 className="mt-3 line-clamp-2 text-base font-bold leading-snug text-slate-900">{data?.Title}</h3>
      {data?.SellerName && <p className="mt-1 truncate text-xs text-slate-500">{data.SellerName}</p>}

      <div className="mt-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">{t.landing.priceNow}</p>
          <p className="text-3xl font-extrabold tracking-tight text-pine-900">{formatVND(data?.LastPrice)}</p>
        </div>
        <span className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-pine-50 px-2.5 py-1 text-[11px] font-semibold text-pine-800">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
          {t.landing.justChecked}
        </span>
      </div>

      <div className="mt-6 space-y-2">
        <Link
          href={detailHref}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-pine-900 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-pine-950"
        >
          {t.landing.viewHistoryBtn}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <div className="grid grid-cols-2 gap-2">
          {/* Affiliate link when the server has one: buying through it supports DealHunter */}
          <a
            href={buyHref}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            {formatText(t.landing.buyOn, { platform })}
            <ArrowUpRight className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={onReset}
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" />
            {t.landing.tryAnother}
          </button>
        </div>
      </div>
    </div>
  );
}
