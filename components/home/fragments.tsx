"use client";

import { ArrowDown, ArrowUpRight, BellRing, Check, MessageCircle, Target } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { formatVND } from "@/lib/formatting";
import { StruckPrice, WrittenPrice } from "@/components/PriceTag";

/*
 * Fragments of DealHunter's own interface, built in HTML at true size. They are the page's pictures.
 * The product and prices in them are an illustration, and every fragment says so.
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
}: {
  checks: number[];
  target?: number;
  draw?: boolean;
  className?: string;
}) {
  const W = 520;
  const H = 150;
  const pad = 10;
  const values = target ? [...checks, target] : checks;
  const min = Math.min(...values) * 0.97;
  const max = Math.max(...values) * 1.02;
  const x = (i: number) => pad + (i * (W - pad * 2)) / (checks.length - 1);
  const y = (v: number) => pad + ((max - v) / (max - min)) * (H - pad * 2);
  let d = `M ${x(0)} ${y(checks[0])}`;
  for (let i = 1; i < checks.length; i++) d += ` H ${x(i)} V ${y(checks[i])}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={`h-auto w-full ${className}`} aria-hidden>
      {target && (
        <line x1={0} x2={W} y1={y(target)} y2={y(target)} stroke="#E5484D" strokeWidth={2} strokeDasharray="7 5" />
      )}
      <path
        d={d}
        fill="none"
        stroke="#1A9988"
        strokeWidth={4}
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={draw ? 1 : undefined}
        className={draw ? "animate-draw-line [animation-delay:700ms]" : ""}
      />
      {checks.map((v, i) => (
        <rect key={i} x={x(i) - 4} y={y(v) - 4} width={8} height={8} fill="#0A3832" />
      ))}
    </svg>
  );
}

/** Small filled chip, square, used across the fragments. */
export function Chip({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-bold ${className}`}>{children}</span>;
}

/** The example label every illustrated fragment carries. */
export function ExampleLabel({ className = "" }: { className?: string }) {
  const { t } = useLanguage();
  return <Chip className={`bg-pine-50 text-pine-700 ${className}`}>{t.landing.exampleLabel}</Chip>;
}

/** Stage 1: the paste box with a link in it. */
export function LinkFragment() {
  const { t, formatText } = useLanguage();
  return (
    <div data-ui className="tag-shape w-full bg-white p-6 text-pine-900">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-pine-700">{t.landing.inputLabel}</span>
        <ExampleLabel />
      </div>
      <div className="mt-3 flex">
        <div className="flex h-12 min-w-0 flex-1 items-center bg-pine-50 px-4 text-[15px] font-medium">
          <span className="truncate">https://{t.landing.sampleLink}</span>
          <span className="ml-0.5 inline-block h-5 w-[2px] shrink-0 bg-teal-500" />
        </div>
        <span className="cut inline-flex h-12 items-center bg-teal-400 px-4 text-[15px] font-bold text-pine-950">{t.landing.checkBtn}</span>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[15px] font-semibold text-teal-600">
        <Check className="h-4 w-4" strokeWidth={3} />
        {formatText(t.landing.detected, { platform: "Shopee" })}
      </p>
    </div>
  );
}

/** Stages 2 and 3, and the hero: the product's price card. */
export function PriceCardFragment({ stage, draw = false }: { stage: "price" | "history" | "full"; draw?: boolean }) {
  const { t, formatText } = useLanguage();
  const checks = stage === "price" ? SAMPLE_CHECKS.slice(0, 1) : stage === "history" ? SAMPLE_CHECKS.slice(0, 5) : SAMPLE_CHECKS;
  const now = checks[checks.length - 1];
  const before = checks.length > 1 ? checks[0] : undefined;
  const drop = before ? Math.round(((before - now) / before) * 100) : 0;

  return (
    <div data-ui className="tag-shape w-full bg-white p-6 text-pine-900">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Chip className="bg-[#F6DCCB] text-[#8A3510]">Shopee</Chip>
          <Chip className="bg-teal-200 text-pine-950">{t.landing.inStock}</Chip>
        </div>
        <ExampleLabel />
      </div>
      <p className="mt-3 text-[17px] font-bold">{t.landing.sampleName}</p>
      <p className="mt-4 text-sm font-semibold text-pine-700">
        {t.landing.priceNow} · {t.landing.justChecked}
      </p>
      <div className="mt-1 flex flex-wrap items-end gap-x-3 gap-y-1">
        <WrittenPrice className="text-[44px]">{formatVND(now)}</WrittenPrice>
        {before && <StruckPrice className="mb-1 text-lg">{formatVND(before)}</StruckPrice>}
        {drop > 0 && (
          <Chip className="mb-1.5 bg-teal-200 text-pine-950">
            <ArrowDown className="h-3.5 w-3.5" strokeWidth={3} />
            {drop}%
          </Chip>
        )}
      </div>
      {stage !== "price" && (
        <>
          <StepChart checks={checks} target={stage === "full" ? SAMPLE_TARGET : undefined} draw={draw} className="mt-5" />
          <div className="mt-2 flex items-center justify-between text-[13px] font-semibold text-pine-700">
            <span>{formatText(t.landing.sampleChecks, { count: checks.length })}</span>
            {stage === "full" && (
              <span className="inline-flex items-center gap-1 text-marker-deep">
                <Target className="h-3.5 w-3.5" />
                {formatText(t.landing.sampleTarget, { price: formatVND(SAMPLE_TARGET) })}
              </span>
            )}
          </div>
        </>
      )}
      {stage === "full" && (
        <div className="mt-5 grid grid-cols-2 gap-2" aria-hidden>
          <span className="cut flex h-11 items-center justify-center bg-pine-900 text-[15px] font-bold text-chalk">
            {t.landing.viewHistoryBtn}
          </span>
          <span className="cut flex h-11 items-center justify-center gap-1.5 bg-teal-400 text-[15px] font-bold text-pine-950">
            {formatText(t.landing.buyOn, { platform: "Shopee" })}
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      )}
    </div>
  );
}

/** Stage 4: the alert as it lands in Notifications and on Zalo. */
export function AlertFragment() {
  const { t, formatText } = useLanguage();
  return (
    <div data-ui className="w-full space-y-2">
      {[
        { channel: "Zalo", icon: MessageCircle, tone: "bg-white" },
        { channel: "Web", icon: BellRing, tone: "bg-white/70" },
      ].map(({ channel, icon: Icon, tone }, i) => (
        <div key={channel} className={`tag-shape p-5 text-pine-900 ${tone} ${i ? "translate-x-6" : ""}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 bg-marker" />
              <Chip className="bg-pine-900 text-chalk">
                <Icon className="h-3.5 w-3.5" />
                {channel}
              </Chip>
            </div>
            {i === 0 && <ExampleLabel />}
          </div>
          <p className="mt-2 text-[15px] font-bold">{formatText(t.landing.sampleAlert, { price: formatVND(1290000) })}</p>
          <p className="text-[15px] text-pine-700">{t.landing.sampleName}</p>
          {i === 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StruckPrice className="text-base">{formatVND(1390000)}</StruckPrice>
              <WrittenPrice className="text-[28px]">{formatVND(1290000)}</WrittenPrice>
              <Chip className="bg-teal-200 text-pine-950">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
                {t.landing.sampleReached}
              </Chip>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
