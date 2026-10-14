"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { getTracking } from "@/lib/api";
import { detectPlatform, formatVND, isKnownPrice } from "@/lib/formatting";
import { useLanguage } from "@/lib/i18n";
import { PriceTag, WrittenPrice } from "@/components/PriceTag";
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
 * The visitor's own product, read for real: polls the new tracking until the server has the
 * title and the current price. Nothing appears on the card that the server did not return.
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
  // The owner's affiliate link when the server has one; the plain product link otherwise
  const buyHref = data?.AffiliateURL || data?.CanonicalURL || target.url;

  if (!ready) {
    const steps = [
      { label: t.landing.stepLink, done: true },
      { label: formatText(t.landing.stepPrice, { platform }), done: false },
      { label: t.landing.stepHistory, done: false },
    ];
    return (
      <div aria-live="polite" className="animate-rise-in">
        <PriceTag>
          <p className="text-sm font-semibold text-pine-700">{t.landing.readingTitle}</p>
          <div className="mt-4 space-y-2">
            <div className="chalk-skeleton h-5 w-4/5 bg-pine-100" />
            <div className="chalk-skeleton h-5 w-3/5 bg-pine-100" />
            <div className="chalk-skeleton mt-4 h-12 w-1/2 bg-pine-100" />
          </div>
          <ol className="mt-6 space-y-2.5">
            {steps.map((s, i) => {
              const active = !s.done && steps.slice(0, i).every((x) => x.done);
              return (
                <li key={s.label} className="flex items-center gap-2.5 text-[15px]">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center ${
                      s.done ? "bg-pine-900 text-chalk" : active ? "bg-teal-200" : "bg-pine-50"
                    }`}
                  >
                    {s.done ? (
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    ) : active ? (
                      <span className="chalk-skeleton h-2 w-2 bg-pine-900" />
                    ) : null}
                  </span>
                  <span className={s.done || active ? "" : "text-pine-700"}>{s.label}</span>
                </li>
              );
            })}
          </ol>
        </PriceTag>
        {slow && (
          <div className="mt-3 bg-pine-950 p-4 text-[15px] leading-relaxed text-chalk">
            {formatText(t.landing.slowNote, { platform })}
            <Link href={detailHref} className="mt-2 flex items-center gap-1 font-semibold text-teal-300 hover:underline">
              {t.landing.openProduct}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div aria-live="polite" className="animate-rise-in">
      <PriceTag>
        <div className="flex items-center justify-between gap-3">
          <PlatformBadge platformOrUrl={data?.Platform || data?.CanonicalURL || target.url} />
          {data?.LastInStock !== undefined && (
            <span
              className={`px-2 py-0.5 text-[13px] font-bold ${
                data.LastInStock ? "bg-teal-200 text-pine-950" : "bg-[#FBE3E4] text-marker-deep"
              }`}
            >
              {data.LastInStock ? t.landing.inStock : t.landing.outOfStock}
            </span>
          )}
        </div>
        <h2 className="mt-3 line-clamp-2 text-[19px] font-bold leading-snug">{data?.Title}</h2>
        <p className="mt-4 text-sm font-semibold text-pine-700">
          {t.landing.priceNow} · {t.landing.justChecked}
        </p>
        <WrittenPrice className="mt-1 block text-[clamp(44px,5vw,60px)]">{formatVND(data?.LastPrice)}</WrittenPrice>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Link
            href={detailHref}
            className="cut inline-flex min-h-[48px] items-center justify-center gap-2 bg-pine-900 px-5 text-[15px] font-bold text-chalk transition-colors hover:bg-pine-800"
          >
            {t.landing.viewHistoryBtn}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href={buyHref}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="cut inline-flex min-h-[48px] items-center justify-center gap-2 bg-teal-400 px-5 text-[15px] font-bold text-pine-950 transition-colors hover:bg-teal-300"
          >
            {formatText(t.landing.buyOn, { platform })}
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="mt-3 inline-flex min-h-[44px] items-center text-[15px] font-semibold text-pine-700 underline-offset-4 hover:text-pine-950 hover:underline"
        >
          {t.landing.tryAnother}
        </button>
      </PriceTag>
    </div>
  );
}
