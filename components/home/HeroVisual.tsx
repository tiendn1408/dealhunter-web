"use client";

import Link from "next/link";
import { ArrowRight, Bell, Scale, TrendingDown } from "lucide-react";
import type { TrackedProduct } from "@/lib/api";
import { formatVND } from "@/lib/formatting";
import { useLanguage } from "@/lib/i18n";
import { PlatformBadge } from "@/components/ui/Badge";

/**
 * Right side of the hero before anything is checked. Illustrates what DealHunter shows (a price
 * line over time and what it tells you) without inventing a product or a price. When the visitor
 * already tracks something with a known price, that real product is shown on top.
 */
export function HeroVisual({ latest }: { latest?: TrackedProduct }) {
  const { t } = useLanguage();
  const chips = [
    { icon: TrendingDown, label: t.landing.visualChip1, className: "-left-4 top-10 sm:-left-8" },
    { icon: Scale, label: t.landing.visualChip2, className: "-right-3 top-1/2 sm:-right-6" },
    { icon: Bell, label: t.landing.visualChip3, className: "left-6 -bottom-4" },
  ];

  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden={!latest}>
      <div className="relative rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/10 backdrop-blur-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-300">{t.landing.visualTitle}</p>

        {/* Illustrative price line: a shape, not data (no axis, no numbers) */}
        <svg viewBox="0 0 320 150" className="mt-5 h-40 w-full" fill="none">
          <defs>
            <linearGradient id="dh-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3CCFB0" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#3CCFB0" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[30, 70, 110].map((y) => (
            <line key={y} x1="0" x2="320" y1={y} y2={y} stroke="white" strokeOpacity="0.06" />
          ))}
          <path
            d="M0 52 C 30 48, 45 30, 70 38 S 110 70, 135 62 S 170 34, 195 46 S 235 96, 260 104 S 300 112, 320 116 L 320 150 L 0 150 Z"
            fill="url(#dh-area)"
          />
          <path
            d="M0 52 C 30 48, 45 30, 70 38 S 110 70, 135 62 S 170 34, 195 46 S 235 96, 260 104 S 300 112, 320 116"
            stroke="#3CCFB0"
            strokeWidth="3"
            strokeLinecap="round"
            style={{ strokeDasharray: 600, ["--dash" as string]: 600 }}
            className="animate-draw-line"
          />
          <circle cx="320" cy="116" r="6" fill="#FFC24D" className="animate-rise-in" style={{ animationDelay: "2.2s" }} />
          <circle cx="320" cy="116" r="12" fill="#FFC24D" fillOpacity="0.2" className="animate-rise-in" style={{ animationDelay: "2.2s" }} />
        </svg>

        {latest ? (
          <Link
            href={`/tracking/${latest.ID}`}
            className="mt-4 block rounded-2xl bg-white p-4 text-slate-900 transition hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t.landing.yourLatest}</span>
              <PlatformBadge platformOrUrl={latest.Platform || latest.CanonicalURL || ""} />
            </div>
            <p className="mt-2 line-clamp-1 text-sm font-semibold">{latest.Title}</p>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xl font-extrabold text-pine-900">{formatVND(latest.LastPrice)}</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </div>
          </Link>
        ) : null}
      </div>

      {chips.map(({ icon: Icon, label, className }, i) => (
        <div
          key={label}
          className={`absolute hidden items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-pine-900 shadow-xl shadow-black/25 sm:flex animate-float-y ${className}`}
          style={{ animationDelay: `${i * 1.2}s` }}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-pine-50 text-pine-700">
            <Icon className="h-3.5 w-3.5" />
          </span>
          {label}
        </div>
      ))}
    </div>
  );
}
