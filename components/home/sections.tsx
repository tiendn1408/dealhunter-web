"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { formatVND } from "@/lib/formatting";
import { PriceTag, StruckPrice, WrittenPrice } from "@/components/PriceTag";

/* ── How it works: one tag, four writings ──────────────────────────────────────────────────
   The same price tag four times across the board, further along each time. The product and
   prices are an illustration, labelled as such on the page. */
export function HowItWorks() {
  const { t, formatText } = useLanguage();
  const fields = [
    {
      ground: "bg-paper text-pine-900",
      clause: t.landing.how1,
      tag: (
        <>
          <p className="font-marker text-[30px] font-semibold opacity-60">{t.landing.sampleWaiting}</p>
          <p className="mt-4 text-[15px] font-bold leading-snug">{t.landing.sampleName}</p>
        </>
      ),
    },
    {
      ground: "bg-teal-200 text-pine-950",
      clause: t.landing.how2,
      tag: (
        <>
          <WrittenPrice className="block text-[32px]">{formatVND(1590000)}</WrittenPrice>
          <p className="mt-4 text-[15px] font-bold leading-snug">{t.landing.sampleName}</p>
        </>
      ),
    },
    {
      ground: "bg-kraft-light text-kraft-ink",
      clause: t.landing.how3,
      tag: (
        <>
          <StruckPrice className="text-[24px]">{formatVND(1590000)}</StruckPrice>
          <WrittenPrice className="mt-1 block text-[32px]">{formatVND(1390000)}</WrittenPrice>
          <p className="mt-4 text-[15px] font-bold leading-snug">{t.landing.sampleName}</p>
        </>
      ),
    },
    {
      ground: "bg-pine-900 text-chalk",
      clause: t.landing.how4,
      tag: (
        <>
          <StruckPrice className="text-[24px]">{formatVND(1390000)}</StruckPrice>
          <WrittenPrice className="mt-1 block text-[32px]">{formatVND(1290000)}</WrittenPrice>
          <p className="mt-4 text-[15px] font-bold leading-snug">{t.landing.sampleName}</p>
          <p className="mt-3 bg-pine-900 px-2 py-1 text-[15px] font-bold text-teal-300">{t.landing.sampleReached}</p>
          <p className="mt-2 text-[15px]">{formatText(t.landing.sampleTarget, { price: formatVND(1300000) })}</p>
        </>
      ),
    },
  ];

  return (
    <section aria-labelledby="how-title" className="grid sm:grid-cols-2 lg:grid-cols-4">
      {fields.map((f, i) => (
        <div key={i} className={`relative flex min-h-[64svh] min-w-0 flex-col px-5 pb-8 pt-8 lg:min-h-[84svh] md:px-7 ${f.ground}`}>
          {i === 0 && (
            <div data-reveal className="mb-8">
              <h2 id="how-title" className="font-marker text-[32px] font-extrabold leading-[1.05] lg:text-[clamp(28px,2.4vw,36px)] tracking-tight">
                {t.landing.howTitle}
              </h2>
              <p className="mt-2 text-sm">{t.landing.howNote}</p>
            </div>
          )}
          <div className="flex flex-1 items-center justify-center lg:items-start lg:pt-[18svh]">
            <div data-reveal data-reveal-delay={i * 90} className="w-full max-w-[260px] transition-transform duration-150 hover:-translate-y-1.5">
              <PriceTag tilt={i % 2 === 0 ? -2 : 2}>{f.tag}</PriceTag>
            </div>
          </div>
          <p data-reveal data-reveal-delay={i * 90 + 60} className="mt-8 max-w-[22ch] text-[20px] font-bold leading-snug lg:text-[clamp(20px,1.6vw,24px)]">
            {f.clause}
          </p>
        </div>
      ))}
    </section>
  );
}

/* ── Features: sentences with switches ──────────────────────────────────────────────────────
   Each capability is a sentence with a working switch that shows what it does. These preview the
   real options found on each product's page. */
export function FeatureSwitches() {
  const { t } = useLanguage();
  const rows = [
    { text: t.landing.f1, more: t.landing.f1More, on: "bg-teal-400 text-pine-950" },
    { text: t.landing.f2, more: t.landing.f2More, on: "bg-kraft text-kraft-ink" },
    { text: t.landing.f3, more: t.landing.f3More, on: "bg-pine-800 text-chalk" },
    { text: t.landing.f4, more: t.landing.f4More, on: "bg-teal-200 text-pine-950" },
  ];
  const [on, setOn] = useState<boolean[]>([true, false, true, false]);

  return (
    <section aria-label={t.landing.featuresNote}>
      {rows.map((r, i) => {
        const active = on[i];
        return (
          <div
            key={i}
            className={`flex min-h-[132px] items-center transition-colors duration-300 md:min-h-[20vh] ${active ? r.on : "bg-paper text-pine-900/60"}`}
          >
            <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-6 px-5 py-6 md:px-7">
              <div data-reveal data-reveal-delay={i * 70} className="max-w-[60ch]">
                <p className="text-[clamp(22px,2.6vw,36px)] font-bold leading-tight">{r.text}</p>
                {active && <p className="mt-2 text-base leading-relaxed animate-rise-in md:text-[17px]">{r.more}</p>}
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={active}
                aria-label={r.text}
                onClick={() => setOn((s) => s.map((v, j) => (j === i ? !v : v)))}
                className={`relative h-11 w-[76px] shrink-0 rounded-full transition-colors duration-200 ${
                  active ? "bg-pine-950" : "bg-pine-900/20"
                }`}
              >
                <span
                  className={`absolute left-0 top-1.5 h-8 w-8 rounded-full bg-chalk transition-transform duration-200 ${
                    active ? "translate-x-[38px]" : "translate-x-1.5"
                  }`}
                />
              </button>
            </div>
          </div>
        );
      })}
      <p className="mx-auto max-w-[1440px] bg-paper px-5 py-5 text-[15px] text-pine-800 md:px-7">{t.landing.featuresNote}</p>
    </section>
  );
}

function untilMidnight(): string {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  const s = Math.max(0, Math.floor((next.getTime() - now.getTime()) / 1000));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}

/* ── Showcase: the extension's one control, blown up ─────────────────────────────────────── */
export function HunterShowcase() {
  const { t, formatText } = useLanguage();
  const [hunting, setHunting] = useState(false);
  const [left, setLeft] = useState<string>("");
  useEffect(() => {
    setLeft(untilMidnight());
    const id = window.setInterval(() => setLeft(untilMidnight()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section
      aria-labelledby="hunt-title"
      className={`relative min-h-[86svh] overflow-hidden transition-colors duration-500 md:min-h-[92svh] ${
        hunting ? "bg-pine-900 text-chalk" : "bg-teal-400 text-pine-950"
      }`}
    >
      <div className="mx-auto max-w-[1440px] px-5 pt-14 md:px-7 md:pt-20">
        <h2 id="hunt-title" data-reveal className="font-marker text-[clamp(30px,3vw,44px)] font-extrabold tracking-tight">
          {hunting ? t.landing.showcaseTitleHunt : t.landing.showcaseTitleWait}
        </h2>
        <p data-reveal data-reveal-delay={70} className="mt-3 max-w-[46ch] text-base leading-relaxed md:text-[17px]">
          {t.landing.showcaseSentence}
        </p>
      </div>
      {/* The extension's start button at poster size; it works, and the field answers it */}
      <button
        type="button"
        aria-pressed={hunting}
        onClick={() => setHunting((h) => !h)}
        className={`absolute inset-x-0 bottom-0 flex w-full flex-col items-start justify-center px-5 py-[0.35em] md:px-[0.6em] text-left text-[19vw] font-black leading-[0.95] tracking-[-0.04em] transition-colors duration-300 md:left-[38%] md:w-auto md:text-[10.5vw] ${
          hunting ? "bg-marker text-chalk hover:bg-marker-deep" : "bg-pine-950 text-chalk hover:bg-pine-900"
        }`}
      >
        <span className="mb-[0.1em] font-marker text-[0.22em] font-semibold tracking-tight opacity-80">
          {left ? formatText(t.landing.showcaseUntil, { left }) : "\u00a0"}
        </span>
        <span>{hunting ? t.landing.showcaseStop : t.landing.showcaseStart}</span>
      </button>
    </section>
  );
}

/* ── FAQ: accordion of filled tiles, heading sticky beside it ────────────────────────────── */
export function Faq() {
  const { t } = useLanguage();
  const items = [
    [t.landing.q1, t.landing.a1],
    [t.landing.q2, t.landing.a2],
    [t.landing.q3, t.landing.a3],
    [t.landing.q4, t.landing.a4],
    [t.landing.q5, t.landing.a5],
    [t.landing.q6, t.landing.a6],
    [t.landing.q7, t.landing.a7],
  ];
  return (
    <section aria-labelledby="faq-title" className="bg-paper py-24 md:py-40">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-5 md:grid-cols-12 md:px-7">
        <div className="md:col-span-4">
          <div className="md:sticky md:top-24">
            <h2 id="faq-title" data-reveal className="font-marker text-[clamp(36px,4vw,60px)] font-extrabold leading-none tracking-tight">
              {t.landing.faqTitle}
            </h2>
            <div data-reveal data-reveal-delay={80} className="relative mt-8 hidden aspect-[4/3] w-full overflow-hidden md:block">
              <Image
                src="/market/vietnamese-market-vendors-panoramio.jpg"
                alt="Người bán rau, cá và hoa ở một chợ vỉa hè Việt Nam"
                fill
                sizes="(min-width: 768px) 30vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
        <div className="space-y-2 md:col-span-8">
          {items.map(([q, a], i) => (
            <details
              key={i}
              name="faq"
              data-reveal
              data-reveal-delay={i * 50}
              className="group bg-pine-50 transition-colors open:bg-teal-400 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 text-lg font-semibold md:min-h-[72px] md:text-xl">
                {q}
                <span aria-hidden className="relative h-4 w-4 shrink-0">
                  <span className="absolute left-0 top-1/2 h-[3px] w-4 -translate-y-1/2 bg-pine-900" />
                  <span className="absolute left-1/2 top-0 h-4 w-[3px] -translate-x-1/2 bg-pine-900 transition-transform duration-200 group-open:rotate-90 group-open:opacity-0" />
                </span>
              </summary>
              <p className="max-w-[52ch] px-6 pb-6 text-base leading-relaxed text-pine-950 md:text-[17px]">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Close: the board question again, colours inverted ───────────────────────────────────── */
export function Closing({ onPaste }: { onPaste: () => void }) {
  const { t } = useLanguage();
  return (
    <section aria-labelledby="close-title" className="flex min-h-[64svh] flex-col justify-between bg-pine-900 text-chalk md:min-h-[90svh]">
      <div className="mx-auto w-full max-w-[1440px] px-5 pt-20 md:px-7 md:pt-28">
        <h2 id="close-title" className="whitespace-nowrap font-marker text-[clamp(28px,7.6vw,128px)] font-extrabold leading-[0.95] tracking-[-0.03em]">
          <span data-reveal className="block">{t.landing.ctaLine1}</span>
          <span data-reveal data-reveal-delay={110} className="block text-teal-300">
            {t.landing.ctaLine2}
          </span>
        </h2>
      </div>
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-5 pb-10 md:flex-row md:items-end md:justify-between md:px-7">
        <p className="max-w-[40ch] text-[17px] leading-relaxed md:text-xl">{t.landing.ctaSentence}</p>
        <button
          type="button"
          onClick={onPaste}
          className="min-h-[56px] w-full bg-teal-400 px-8 text-lg font-bold text-pine-950 transition-colors hover:bg-teal-300 md:w-auto"
        >
          {t.landing.ctaBtn}
        </button>
      </div>
    </section>
  );
}

const CREDITS = [
  { title: "Ben Thanh Market", by: "chee.hong", licence: "CC BY 2.0", href: "https://www.flickr.com/photos/40135642@N00/8237685396" },
  { title: "Fresh Mangosteen Display", by: "PAULIX04", licence: "CC BY-SA 4.0", href: "https://commons.wikimedia.org/wiki/File:Fresh_Mangosteen_Display.jpg" },
  { title: "Fruit vendor at Ben Thanh Market", by: "tuey", licence: "CC BY 2.0", href: "https://www.flickr.com/photos/21168473@N00/55106754" },
  { title: "Vietnamese market vendors", by: "multimolti", licence: "CC BY-SA 3.0", href: "https://commons.wikimedia.org/w/index.php?curid=49138177" },
];

/* ── Footer: a market photograph half, the menu half ─────────────────────────────────────── */
export function SiteFooter() {
  const { t } = useLanguage();
  const menu = [
    { href: "/", label: t.nav.home },
    { href: "/tracking", label: t.nav.tracking },
    { href: "/notifications", label: t.nav.notifications },
    { href: "/settings", label: t.nav.settings },
  ];
  return (
    <footer className="grid bg-pine-950 text-chalk md:min-h-[100svh] md:grid-cols-2">
      <div className="relative h-[50svh] overflow-hidden md:h-auto">
        <Image
          src="/market/ben-thanh-market.jpg"
          alt={t.landing.footerPhotoAlt}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover object-[50%_30%] scale-110"
        />
      </div>
      <div className="flex flex-col px-5 pb-28 pt-12 md:px-12 md:pb-10 md:pt-20">
        <div className="flex items-center gap-2.5">
          <Image src="/icon.png" alt="" width={32} height={32} />
          <span className="font-marker text-xl font-extrabold">DealHunter</span>
        </div>
        <nav aria-label="Chân trang" className="group/menu mt-10 flex flex-col gap-5 md:gap-7">
          {menu.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="w-fit text-[8vw] font-bold leading-none tracking-tight transition-[transform,color] duration-200 hover:translate-x-3 group-hover/menu:text-chalk/50 hover:!text-chalk md:text-[2.6vw]"
            >
              {m.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-16 text-[13px] leading-relaxed text-chalk/70">
          <p>
            {t.landing.footerCredits}:{" "}
            {CREDITS.map((c, i) => (
              <span key={c.href}>
                <a href={c.href} target="_blank" rel="noopener noreferrer" className="underline hover:text-chalk">
                  “{c.title}”
                </a>{" "}
                · {c.by} · {c.licence}
                {i < CREDITS.length - 1 ? "; " : "."}
              </span>
            ))}
          </p>
          <p className="mt-3">© {new Date().getFullYear()} DealHunter · dealhunter.io.vn</p>
        </div>
      </div>
    </footer>
  );
}
