"use client";

import Image from "next/image";
import { ArrowDown, ArrowUpRight, Target } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { formatVND } from "@/lib/formatting";
import { StruckPrice, WrittenPrice } from "@/components/PriceTag";

/*
 * Fragments of DealHunter's own interface, built in HTML. The products and prices in them are an
 * illustration, and every fragment carrying them says so.
 */

/** Illustration only: the checks of one product, oldest first. */
export const SAMPLE_CHECKS = [1590000, 1590000, 1490000, 1490000, 1390000, 1390000, 1290000];
export const SAMPLE_TARGET = 1300000;

/**
 * Price history drawn as steps: the line only changes at a real check, never between two.
 * The target price is a dashed red line.
 */
export function StepChart({
  checks,
  target,
  draw = false,
  className = "",
  height = 150,
}: {
  checks: number[];
  target?: number;
  draw?: boolean;
  className?: string;
  height?: number;
}) {
  const W = 520;
  const H = height;
  const pad = 10;
  const values = target ? [...checks, target] : checks;
  const min = Math.min(...values) * 0.97;
  const max = Math.max(...values) * 1.02;
  const x = (i: number) => pad + (i * (W - pad * 2)) / Math.max(1, checks.length - 1);
  const y = (v: number) => pad + ((max - v) / (max - min)) * (H - pad * 2);
  let d = `M ${x(0)} ${y(checks[0])}`;
  for (let i = 1; i < checks.length; i++) d += ` H ${x(i)} V ${y(checks[i])}`;
  const area = `${d} V ${H} H ${x(0)} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={`h-auto w-full ${className}`} aria-hidden>
      <path d={area} fill="#3CCFB0" fillOpacity={0.1} />
      {target && (
        <line x1={0} x2={W} y1={y(target)} y2={y(target)} stroke="#E5484D" strokeWidth={1.5} strokeDasharray="6 5" />
      )}
      <path
        key={checks.join("-")}
        d={d}
        fill="none"
        stroke="#1A9988"
        strokeWidth={3}
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={draw ? 1 : undefined}
        className={draw ? "animate-draw-line [animation-delay:500ms]" : ""}
      />
      {checks.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={i === checks.length - 1 ? 6 : 3.5} fill={i === checks.length - 1 ? "#0A3832" : "#1A9988"} />
      ))}
    </svg>
  );
}

/** Small filled chip. */
export function Chip({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-semibold leading-none ${className}`}>
      {children}
    </span>
  );
}

/** The example label every illustrated fragment carries. */
export function ExampleLabel({ className = "" }: { className?: string }) {
  const { t } = useLanguage();
  return <Chip className={`bg-pine-50 text-pine-700 ${className}`}>{t.landing.exampleLabel}</Chip>;
}

/** A product photo on its own white tile, so the product's colours never set the page's tone. */
export function ProductThumb({ src, alt, size = 64, className = "" }: { src: string; alt: string; size?: number; className?: string }) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-2xl bg-white ring-1 ring-pine-900/[0.07] ${className}`}
      style={{ width: size, height: size }}
    >
      <Image src={src} alt={alt} fill sizes={`${size * 2}px`} className="scale-[1.35] object-contain" />
    </div>
  );
}

export const PLATFORM_CHIP: Record<string, string> = {
  Shopee: "bg-[#FDECE4] text-[#A53A12]",
  Lazada: "bg-[#E6EBFA] text-[#22357A]",
  "TikTok Shop": "bg-pine-950 text-chalk",
};

/** The hero's card: one product's price, its history and the two actions. */
export function PriceCardFragment({ draw = false }: { draw?: boolean }) {
  const { t, formatText } = useLanguage();
  const now = SAMPLE_CHECKS[SAMPLE_CHECKS.length - 1];
  const before = SAMPLE_CHECKS[0];
  const drop = Math.round(((before - now) / before) * 100);

  return (
    <div data-ui className="rounded-[1.6rem] bg-white p-6 text-pine-900 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Chip className={PLATFORM_CHIP.Shopee}>Shopee</Chip>
          <Chip className="hidden bg-teal-200/70 text-pine-950 sm:inline-flex">{t.landing.inStock}</Chip>
        </div>
        <ExampleLabel className="whitespace-nowrap" />
      </div>
      <p className="mt-4 text-[17px] font-bold">{t.landing.sampleName}</p>
      <p className="mt-4 text-sm font-medium text-pine-700">
        {t.landing.priceNow} · {t.landing.justChecked}
      </p>
      <div className="mt-1.5 flex flex-wrap items-end gap-x-3 gap-y-1">
        <WrittenPrice className="text-[clamp(36px,3.6vw,46px)]">{formatVND(now)}</WrittenPrice>
        <StruckPrice className="mb-1 text-[17px]">{formatVND(before)}</StruckPrice>
        <Chip className="mb-1.5 bg-teal-200/70 text-pine-950">
          <ArrowDown className="h-3.5 w-3.5" strokeWidth={2.25} />
          {drop}%
        </Chip>
      </div>
      <StepChart checks={SAMPLE_CHECKS} target={SAMPLE_TARGET} draw={draw} className="mt-5" />
      <div className="mt-2 flex items-center justify-between text-[13px] font-medium text-pine-700">
        <span>{formatText(t.landing.sampleChecks, { count: SAMPLE_CHECKS.length })}</span>
        <span className="inline-flex items-center gap-1 text-marker-deep">
          <Target className="h-3.5 w-3.5" strokeWidth={1.75} />
          {formatText(t.landing.sampleTarget, { price: formatVND(SAMPLE_TARGET) })}
        </span>
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2" aria-hidden>
        <span className="flex h-11 items-center justify-center rounded-full bg-pine-900 text-[14px] font-bold text-chalk">
          {t.landing.viewHistoryBtn}
        </span>
        <span className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-teal-400 text-[14px] font-bold text-pine-950">
          {formatText(t.landing.buyOn, { platform: "Shopee" })}
          <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
        </span>
      </div>
    </div>
  );
}
