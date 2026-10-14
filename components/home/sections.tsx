"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowDown, ArrowRight, ArrowUp, MessageCircle, Target } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { formatVND } from "@/lib/formatting";
import { AlertFragment, Chip, ExampleLabel, LinkFragment, PriceCardFragment } from "@/components/home/fragments";

/* ── How it works: drag through the stages ─────────────────────────────────────────────────
   One real range input drives both halves: the clause on the left, the product's own interface in
   the matching state on the right. */
export function HowItWorks() {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const stages = [
    { name: t.landing.howStage1, clause: t.landing.howClause1, desc: t.landing.howDesc1, fragment: <LinkFragment /> },
    { name: t.landing.howStage2, clause: t.landing.howClause2, desc: t.landing.howDesc2, fragment: <PriceCardFragment stage="price" /> },
    { name: t.landing.howStage3, clause: t.landing.howClause3, desc: t.landing.howDesc3, fragment: <PriceCardFragment stage="history" /> },
    { name: t.landing.howStage4, clause: t.landing.howClause4, desc: t.landing.howDesc4, fragment: <AlertFragment /> },
  ];
  const fill = (step / (stages.length - 1)) * 100;

  return (
    <section aria-labelledby="how-title" className="relative grid md:grid-cols-2">
      <h2 id="how-title" className="sr-only">
        {t.landing.howTitle}
      </h2>

      {/* The product, in the state of the current stage */}
      <div className="relative flex min-h-[46svh] items-center justify-center overflow-hidden bg-teal-400 px-5 py-12 md:order-2 md:min-h-[76svh] md:px-10">
        <div className="grid w-full max-w-[480px] [grid-template-areas:'s'] [grid-template-columns:minmax(0,1fr)] *:min-w-0 *:[grid-area:s]">
          {stages.map((s, i) => (
            <div
              key={i}
              aria-hidden={i !== step}
              className={`self-center transition-[opacity,transform,visibility] duration-200 ${
                i === step ? "visible opacity-100" : "invisible pointer-events-none translate-y-2 opacity-0"
              }`}
            >
              {s.fragment}
            </div>
          ))}
        </div>
      </div>

      {/* The slider sits on the seam on a phone and crosses both fields on a desktop */}
      <div className="bg-pine-950 px-5 pb-3 pt-6 md:order-3 md:col-span-2 md:px-10 md:pb-6 md:pt-8">
        <label htmlFor="how-range" className="sr-only">
          {t.landing.howSlider}
        </label>
        <div className="relative">
          <div aria-hidden className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 bg-pine-200">
            <div className="h-full bg-teal-400 transition-[width] duration-200" style={{ width: `${fill}%` }} />
          </div>
          <input
            id="how-range"
            type="range"
            min={0}
            max={stages.length - 1}
            step={1}
            value={step}
            onChange={(e) => setStep(Number(e.target.value))}
            aria-valuetext={stages[step].name}
            className="stage-range relative w-full"
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-y-1 md:grid-cols-4">
          {stages.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStep(i)}
              className={`min-h-[44px] text-left text-[15px] font-semibold transition-colors md:text-base ${
                i === step ? "text-chalk" : "text-chalk/70 hover:text-chalk"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* The clause: the heading of the current stage */}
      <div className="bg-pine-900 px-5 pb-14 pt-10 text-chalk md:order-1 md:px-10 md:pb-16 md:pt-24">
        <div className="grid [grid-template-areas:'s'] [grid-template-columns:minmax(0,1fr)] *:min-w-0 *:[grid-area:s]">
          {stages.map((s, i) => (
            <div
              key={i}
              aria-hidden={i !== step}
              className={`transition-[opacity,visibility] duration-200 ${i === step ? "visible opacity-100" : "invisible pointer-events-none opacity-0"}`}
            >
              <p className="max-w-[13ch] text-[9vw] font-extrabold leading-[1.02] tracking-[-0.035em] md:text-[clamp(40px,4.6vw,72px)]">
                {s.clause}
              </p>
              <p className="mt-6 max-w-[40ch] text-[17px] leading-relaxed text-chalk/90 md:text-lg">{s.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-[15px] text-chalk/75">{t.landing.howNote}</p>
      </div>
    </section>
  );
}

/* ── Features: one paragraph, the capabilities' own controls set inline ──────────────────── */
function Slot({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      aria-hidden
      className={`cut mx-[0.08em] inline-flex h-[2em] items-center gap-[0.3em] px-[0.6em] align-[-0.3em] text-[max(13px,0.5em)] font-bold leading-none tracking-normal [--cut:0.5em] [&_svg]:h-[1.1em] [&_svg]:w-[1.1em] ${className}`}
    >
      {children}
    </span>
  );
}

export function FeatureParagraph({ onStart }: { onStart: () => void }) {
  const { t } = useLanguage();
  return (
    <section aria-labelledby="feat-title" className="bg-paper py-24 md:pb-16 md:pt-36">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <h2 id="feat-title" className="sr-only">
          {t.landing.featuresTitle}
        </h2>
        <p
          data-reveal
          className="max-w-[30ch] text-[24px] font-semibold leading-[1.32] tracking-[-0.015em] text-pine-900 md:max-w-[52ch] md:text-[clamp(26px,2.5vw,36px)]"
        >
          {t.landing.featA}
          <Slot className="bg-teal-200 text-pine-950">
            <ArrowDown className="h-3.5 w-3.5" strokeWidth={3} />
            12%
          </Slot>
          {t.landing.featB}
          <Slot className="bg-pine-900 text-chalk">
            <Target className="h-3.5 w-3.5" />
            {formatVND(1300000)}
          </Slot>
          {t.landing.featC}
          <Slot className="bg-teal-600 text-white">
            <MessageCircle className="h-3.5 w-3.5" />
            Zalo
          </Slot>
          {t.landing.featD}
          <Slot className="bg-white text-pine-900">
            <span className="bg-[#F6DCCB] px-1 py-0.5 text-[#8A3510]">Shopee</span>
            <span className="bg-[#DCE3F5] px-1 py-0.5 text-[#22357A]">Lazada</span>
          </Slot>
          {t.landing.featE}
        </p>
        <div data-reveal data-reveal-delay={90} className="mt-[72px] md:ml-[50%]">
          <p className="max-w-[40ch] text-lg leading-relaxed text-pine-800">{t.landing.featuresNote}</p>
          <button
            type="button"
            onClick={onStart}
            className="cut mt-6 inline-flex min-h-[52px] items-center gap-2 bg-pine-900 px-6 text-[16px] font-bold text-chalk transition-colors hover:bg-pine-800"
          >
            {t.landing.featuresBtn}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ── Showcase: the Chrome extension, one capability at a time on the tag shape ───────────── */
function ExtensionFragment({ item }: { item: number }) {
  const { t } = useLanguage();
  if (item === 0) {
    // On the marketplace product page: the selling price, and DealHunter's badge beside it
    return (
      <div data-ui className="tag-shape w-full bg-white p-6 text-pine-900">
        <div className="flex items-center justify-between">
          <Chip className="bg-[#F6DCCB] text-[#8A3510]">shopee.vn</Chip>
          <ExampleLabel />
        </div>
        <p className="mt-3 text-[17px] font-bold">{t.landing.sampleName}</p>
        <p className="mt-3 text-[34px] font-extrabold tracking-tight text-[#C2410C]">₫1.290.000</p>
        <div className="mt-4 flex items-center gap-3 bg-pine-900 p-3 text-chalk">
          <Image src="/icon.png" alt="" width={28} height={28} />
          <div className="text-[14px] leading-snug">
            <p className="font-bold">DealHunter</p>
            <p className="text-teal-300">{t.detail.lowest90dBadge}</p>
          </div>
        </div>
      </div>
    );
  }
  const rows = [
    { name: t.landing.ext2, time: "00:00:00" },
    { name: t.landing.ext3, time: "12:00:00" },
    { name: t.landing.ext4, time: "08:00:00" },
  ];
  return (
    <div data-ui className="tag-shape w-full bg-white p-5 text-pine-900">
      <div className="flex items-center justify-between gap-3 pb-3">
        <div className="flex items-center gap-2">
          <Image src="/icon.png" alt="" width={24} height={24} />
          <span className="text-[15px] font-bold">DealHunter Assistant</span>
        </div>
        <ExampleLabel />
      </div>
      <ul className="space-y-1.5">
        {rows.map((r, i) => {
          const on = i === item - 1;
          return (
            <li key={r.name} className={`flex items-center justify-between gap-3 p-3 transition-colors ${on ? "bg-teal-200" : "bg-pine-50"}`}>
              <div>
                <p className="text-[15px] font-bold">{r.name}</p>
                <p className="text-[14px] tabular-nums text-pine-700">{r.time}</p>
              </div>
              <span className={`relative h-7 w-12 shrink-0 rounded-full ${on ? "bg-pine-900" : "bg-pine-200"}`}>
                <span
                  className={`absolute left-0 top-1 h-5 w-5 rounded-full bg-white transition-transform ${on ? "translate-x-6" : "translate-x-1"}`}
                />
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ExtensionShowcase() {
  const { t } = useLanguage();
  const items = [
    { name: t.landing.ext1, fact: t.landing.ext1Fact, ground: "bg-teal-400" },
    { name: t.landing.ext2, fact: t.landing.ext2Fact, ground: "bg-pine-900" },
    { name: t.landing.ext3, fact: t.landing.ext3Fact, ground: "bg-teal-200" },
    { name: t.landing.ext4, fact: t.landing.ext4Fact, ground: "bg-pine-700" },
  ];
  const [sel, setSel] = useState(0);

  return (
    <section aria-labelledby="ext-title" className="relative overflow-hidden bg-paper py-16 md:min-h-[100svh] md:py-0">
      <div className="mx-auto max-w-[1440px] px-5 md:min-h-[100svh] md:px-10">
        {/* The tag shape at stage size, the extension's own interface standing in front of it */}
        <div className="relative mx-auto mt-10 aspect-square w-[86vw] md:absolute md:left-[58%] md:top-1/2 md:mt-0 md:w-[60vh] md:-translate-x-1/2 md:-translate-y-[46%]">
          <div
            className={`absolute inset-0 transition-colors duration-300 [clip-path:polygon(22%_0,100%_0,100%_100%,0_100%,0_22%)] ${items[sel].ground}`}
          />
          <div className="absolute inset-x-[5%] -top-[10%] grid [grid-template-areas:'s'] [grid-template-columns:minmax(0,1fr)] *:min-w-0 *:[grid-area:s]">
            {items.map((_, i) => (
              <div
                key={i}
                aria-hidden={i !== sel}
                className={`transition-[opacity,transform,visibility] duration-300 ${i === sel ? "visible opacity-100" : "invisible pointer-events-none translate-y-3 opacity-0"}`}
              >
                <ExtensionFragment item={i} />
              </div>
            ))}
          </div>
          <p className="absolute left-[104%] top-[62%] hidden w-[260px] text-[17px] leading-relaxed text-pine-800 md:block">{items[sel].fact}</p>
        </div>

        <div className="mt-8 md:absolute md:bottom-[12vh] md:left-10 md:mt-0">
          <h2 id="ext-title" className="text-[26px] font-bold leading-[1.15] tracking-tight text-pine-600 md:text-[clamp(28px,2.6vw,40px)]">
            {t.landing.extTitle}
          </h2>
          <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1 md:block" role="tablist">
            {items.map((it, i) => (
              <li key={i} className="shrink-0">
                <button
                  type="button"
                  role="tab"
                  aria-selected={i === sel}
                  onClick={() => setSel(i)}
                  className={`flex min-h-[44px] items-center gap-3 py-1 text-left text-[24px] font-bold leading-[1.15] tracking-tight transition-colors md:text-[clamp(28px,2.6vw,40px)] ${
                    i === sel ? "text-pine-950" : "text-pine-500 hover:text-pine-800"
                  }`}
                >
                  <span aria-hidden className={`cut h-[0.42em] w-[0.42em] shrink-0 [--cut:0.14em] ${i === sel ? "bg-teal-400" : "bg-pine-200"}`} />
                  {it.name}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-base leading-relaxed text-pine-800 md:hidden">{items[sel].fact}</p>
        </div>
      </div>
    </section>
  );
}

/* ── FAQ: index cards filed in a drawer, each with its own tab ───────────────────────────── */
export function Faq() {
  const { t } = useLanguage();
  const items = [
    [t.landing.faqTab1, t.landing.q1, t.landing.a1],
    [t.landing.faqTab2, t.landing.q2, t.landing.a2],
    [t.landing.faqTab3, t.landing.q3, t.landing.a3],
    [t.landing.faqTab4, t.landing.q4, t.landing.a4],
    [t.landing.faqTab5, t.landing.q5, t.landing.a5],
    [t.landing.faqTab6, t.landing.q6, t.landing.a6],
    [t.landing.faqTab7, t.landing.q7, t.landing.a7],
  ];
  const tones = ["bg-pine-900 text-chalk", "bg-teal-400 text-pine-950", "bg-pine-100 text-pine-950"];
  const [open, setOpen] = useState(0);
  const last = items.length - 1;

  return (
    <section aria-labelledby="faq-title" className="faq-drawer bg-white py-24 md:py-36">
      <div className="mx-auto max-w-[960px] px-5 md:px-10">
        <h2
          id="faq-title"
          data-reveal
          className="text-[9vw] font-extrabold leading-none tracking-[-0.035em] text-pine-900 md:text-[clamp(40px,4vw,60px)]"
        >
          {t.landing.faqTitle}
        </h2>
        <div className="mt-12">
          {items.map(([tab, q, a], i) => {
            const isOpen = open === i;
            const tone = tones[i % tones.length];
            return (
              <div key={i} data-reveal data-reveal-delay={i * 50}>
                {/* the tab steps right card by card, like index cards filed in a drawer */}
                <div
                  className={`cut flex h-10 w-[var(--tab-w)] items-center px-4 text-[15px] font-bold [--cut:12px] md:text-base ${tone}`}
                  style={{ marginLeft: `calc(${i} * (100% - var(--tab-w)) / ${last})` }}
                >
                  <span className="truncate">{tab}</span>
                </div>
                <div className={tone}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-a-${i}`}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="flex min-h-[56px] w-full items-center justify-between gap-4 px-5 py-3 text-left text-[17px] font-semibold md:px-7 md:text-xl"
                  >
                    {q}
                    <span aria-hidden className={`text-2xl font-light transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}>
                      +
                    </span>
                  </button>
                  <div id={`faq-a-${i}`} hidden={!isOpen} className="px-5 pb-7 md:px-7">
                    <p className="max-w-[50ch] text-base leading-relaxed md:text-[17px]">{a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Close: a sentence with a blank, and the blank is the paste field ────────────────────── */
export function Closing({ onSubmit }: { onSubmit: (url: string) => void }) {
  const { t } = useLanguage();
  const [value, setValue] = useState("");
  return (
    <section aria-labelledby="close-title" className="bg-pine-950 pb-8 pt-24 text-chalk md:pb-12 md:pt-40">
      <form
        className="mx-auto max-w-[1440px] px-5 md:px-10"
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) onSubmit(value.trim());
        }}
      >
        <h2 id="close-title" className="text-[9vw] font-extrabold leading-[1.05] tracking-[-0.035em] md:text-[clamp(44px,5.6vw,88px)]">
          {t.landing.ctaLead}
        </h2>
        <div className="mt-6 flex flex-col gap-2 text-[9vw] font-extrabold leading-none tracking-[-0.035em] md:flex-row md:text-[clamp(44px,5.6vw,88px)]">
          <label htmlFor="close-url" className="sr-only">
            {t.landing.inputLabel}
          </label>
          <input
            id="close-url"
            type="url"
            inputMode="url"
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t.landing.inputPlaceholder}
            className="cut h-14 w-full bg-pine-800 px-5 text-[17px] font-semibold tracking-normal text-chalk placeholder:text-chalk/70 focus:outline-none md:h-[1.2em] md:w-[min(640px,52vw)] md:text-[max(17px,0.3em)] [--cut:16px]"
          />
          <button
            type="submit"
            className="cut h-[1.2em] bg-teal-400 px-[0.35em] text-left text-pine-950 transition-colors hover:bg-teal-300 [--cut:0.25em]"
          >
            {t.landing.ctaBtn}
          </button>
        </div>
        <p className="mt-6 text-base text-chalk/75">{t.landing.ctaSentence}</p>
      </form>
    </section>
  );
}

/* ── Footer: the name built from tag-shaped blocks ───────────────────────────────────────── */
export function SiteFooter() {
  const { t } = useLanguage();
  const letters = "DEALHUNTER".split("");
  const heights = [100, 72, 86, 64, 94, 78, 100, 68, 88, 74];
  const grounds = ["bg-teal-400", "bg-teal-300", "bg-teal-500", "bg-teal-200", "bg-teal-400"];
  const menu = [
    { href: "/", label: t.nav.home },
    { href: "/tracking", label: t.nav.tracking },
    { href: "/notifications", label: t.nav.notifications },
    { href: "/settings", label: t.nav.settings },
  ];
  return (
    <footer className="bg-pine-950 pb-28 pt-16 text-chalk md:pb-10 md:pt-24">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <div aria-label="DealHunter" role="img" className="flex h-[22svh] items-end gap-1 md:h-[34svh]">
          {letters.map((l, i) => (
            <div
              key={i}
              data-reveal
              data-reveal-delay={i * 40}
              className={`cut flex flex-1 items-end justify-center pb-[0.4vw] text-[8.4vw] font-extrabold leading-[0.8] text-pine-950 [--cut:1.4vw] ${grounds[i % grounds.length]}`}
              style={{ height: `${heights[i]}%` }}
            >
              <span aria-hidden>{l}</span>
            </div>
          ))}
        </div>

        <div className="mt-14 grid gap-10 md:grid-cols-12">
          <nav aria-label="Chân trang" className="grid grid-cols-2 gap-x-6 gap-y-3 md:col-span-8 md:grid-cols-4">
            {menu.map((m) => (
              <Link key={m.href} href={m.href} className="w-fit text-[15px] font-semibold text-chalk/85 transition-colors hover:text-teal-300">
                {m.label}
              </Link>
            ))}
          </nav>
          <div className="space-y-1 text-[15px] text-chalk/85 md:col-span-4">
            <p className="font-semibold text-chalk">{t.landing.footerTagline}</p>
            <p>dealhunter.io.vn</p>
          </div>
        </div>

        <div className="mt-14 flex items-center justify-between gap-4 text-[14px] text-chalk/70">
          <p>© {new Date().getFullYear()} DealHunter</p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Lên đầu trang"
            className="cut inline-flex h-11 w-11 items-center justify-center bg-teal-400 text-pine-950 transition-colors hover:bg-teal-300 [--cut:10px]"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
