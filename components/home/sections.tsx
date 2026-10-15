"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowDown, BellRing, Check, ChartNoAxesColumn, Link2, MessageCircle, Plus, Puzzle, UserRound } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { formatVND } from "@/lib/formatting";
import { Bezel, PillButton } from "@/components/ui/Bezel";
import { StruckPrice, WrittenPrice } from "@/components/PriceTag";
import { Chip, ExampleLabel, PLATFORM_CHIP, ProductThumb, StepChart } from "@/components/home/fragments";

/* Illustration data for the bento (labelled on every card that shows it). */
const HEADPHONE_HISTORY = [1590000, 1590000, 1550000, 1550000, 1490000, 1490000, 1450000, 1390000, 1390000, 1290000];
const RANGES = { d7: 3, d30: 6, d90: HEADPHONE_HISTORY.length } as const;

function CardHead({ icon: Icon, title, text, dark }: { icon: typeof Link2; title: string; text: string; dark?: boolean }) {
  return (
    <div className="flex items-start gap-3.5">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          dark ? "bg-white/10 text-teal-300" : "bg-teal-200/60 text-pine-900"
        }`}
      >
        <Icon className="h-5 w-5" strokeWidth={1.5} />
      </span>
      <div>
        <h3 className="text-[19px] font-bold leading-snug tracking-[-0.01em]">{title}</h3>
        <p className={`mt-1 text-[15px] leading-relaxed ${dark ? "text-chalk/80" : "text-pine-700"}`}>{text}</p>
      </div>
    </div>
  );
}

/* ── Bento: each capability as a working piece of the product ────────────────────────────── */
function HistoryCard() {
  const { t } = useLanguage();
  const [range, setRange] = useState<keyof typeof RANGES>("d90");
  const checks = HEADPHONE_HISTORY.slice(-RANGES[range]);
  const now = checks[checks.length - 1];
  const tabs: [keyof typeof RANGES, string][] = [
    ["d7", t.detail.range7d],
    ["d30", t.detail.range30d],
    ["d90", t.detail.range90d],
  ];
  return (
    <Bezel className="md:col-span-2 lg:col-span-7 lg:row-span-2" coreClassName="flex flex-col p-6 sm:p-8">
      <CardHead icon={ChartNoAxesColumn} title={t.landing.b1Title} text={t.landing.b1Text} />
      <div className="mt-7 flex flex-1 flex-col rounded-[1.4rem] bg-paper p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <ProductThumb src="/products/headphones.webp" alt={t.landing.prodHeadphones} size={72} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-bold">{t.landing.prodHeadphones}</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-2.5">
              <WrittenPrice className="text-[28px]">{formatVND(now)}</WrittenPrice>
              <StruckPrice className="text-[15px]">{formatVND(checks[0])}</StruckPrice>
            </div>
          </div>
          <ExampleLabel className="hidden sm:inline-flex" />
        </div>
        <div className="mt-5 inline-flex w-fit rounded-full bg-white p-1 shadow-soft" role="tablist">
          {tabs.map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={range === k}
              onClick={() => setRange(k)}
              className={`min-h-[36px] whitespace-nowrap rounded-full px-3 text-[14px] font-semibold transition-colors duration-300 ease-spring sm:px-4 ${
                range === k ? "bg-pine-900 text-chalk" : "text-pine-700 hover:text-pine-950"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <StepChart checks={checks} draw className="mt-4 flex-1" height={190} />
        <div className="mt-4 grid grid-cols-2 gap-3 text-[14px]">
          <div className="rounded-2xl bg-white px-4 py-3">
            <p className="text-pine-700">{t.landing.b1Low}</p>
            <p className="mt-0.5 text-[17px] font-bold tabular-nums">{formatVND(Math.min(...checks))}</p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3">
            <p className="text-pine-700">{t.landing.b1High}</p>
            <p className="mt-0.5 text-[17px] font-bold tabular-nums">{formatVND(Math.max(...checks))}</p>
          </div>
        </div>
      </div>
    </Bezel>
  );
}

function TargetCard() {
  const { t, formatText } = useLanguage();
  const price = 1090000;
  const [target, setTarget] = useState(950000);
  const reached = price <= target;
  const fill = ((target - 800000) / (1300000 - 800000)) * 100;
  return (
    <Bezel className="lg:col-span-5" coreClassName="flex flex-col p-6 sm:p-8">
      <CardHead icon={BellRing} title={t.landing.b2Title} text={t.landing.b2Text} />
      <div className="mt-6 flex items-center gap-4">
        <ProductThumb src="/products/sneaker.jpg" alt={t.landing.prodSneaker} size={60} />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold">{t.landing.prodSneaker}</p>
          <p className="text-[14px] text-pine-700">
            {t.landing.priceNow}: <span className="font-bold tabular-nums text-pine-900">{formatVND(price)}</span>
          </p>
        </div>
      </div>
      <div className="mt-6">
        <div className="flex items-baseline justify-between">
          <label htmlFor="bento-target" className="text-[14px] font-medium text-pine-700">
            {t.landing.b2Your}
          </label>
          <WrittenPrice className="text-[24px]">{formatVND(target)}</WrittenPrice>
        </div>
        <div className="relative mt-3 h-8">
          <div aria-hidden className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-pine-100">
            <div className="h-full rounded-full bg-teal-400" style={{ width: `${fill}%` }} />
          </div>
          <input
            id="bento-target"
            type="range"
            min={800000}
            max={1300000}
            step={10000}
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            className="soft-range relative w-full"
          />
        </div>
        <div
          aria-live="polite"
          className={`mt-4 flex items-center gap-2 rounded-2xl px-4 py-3 text-[15px] font-semibold transition-colors duration-500 ease-spring ${
            reached ? "bg-teal-400 text-pine-950" : "bg-paper text-pine-800"
          }`}
        >
          {reached ? <Check className="h-4 w-4" strokeWidth={2.25} /> : <ArrowDown className="h-4 w-4" strokeWidth={1.75} />}
          {reached ? t.landing.b2Reached : formatText(t.landing.b2Gap, { gap: formatVND(price - target) })}
        </div>
      </div>
    </Bezel>
  );
}

function ZaloCard() {
  const { t, formatText } = useLanguage();
  return (
    <Bezel className="lg:col-span-5" tone="pine" coreClassName="relative flex flex-col overflow-hidden p-6 sm:p-8">
      <CardHead icon={MessageCircle} title={t.landing.b3Title} text={t.landing.b3Text} dark />
      {/* A phone notification arriving, again and again */}
      <div className="relative mt-6 flex-1">
        <div className="mx-auto max-w-[360px] animate-toast-in rounded-[1.4rem] bg-white/95 p-4 text-pine-900 shadow-float">
          <div className="flex items-center gap-2 text-[13px] text-pine-700">
            <Image src="/icon.png" alt="" width={20} height={20} className="rounded-md" />
            <span className="font-semibold text-pine-900">Zalo · DealHunter</span>
            <span className="ml-auto">{t.landing.b3Now}</span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <ProductThumb src="/products/sunglasses.webp" alt={t.landing.prodSunglasses} size={52} />
            <div className="min-w-0">
              <p className="text-[15px] font-bold">{formatText(t.landing.sampleAlert, { price: formatVND(349000) })}</p>
              <p className="truncate text-[14px] text-pine-700">{t.landing.prodSunglasses}</p>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-2 h-3 max-w-[320px] rounded-b-[1.2rem] bg-white/15" aria-hidden />
        <p className="mt-4 text-center text-[13px] text-chalk/60">{t.landing.exampleLabel}</p>
      </div>
    </Bezel>
  );
}

function CompareCard() {
  const { t } = useLanguage();
  const rows = [
    { p: "Shopee", price: 1450000 },
    { p: "Lazada", price: 1390000, best: true },
    { p: "TikTok Shop", price: 1520000 },
  ];
  return (
    <Bezel className="lg:col-span-4" coreClassName="flex flex-col p-6 sm:p-7">
      <CardHead icon={ChartNoAxesColumn} title={t.landing.b4Title} text={t.landing.b4Text} />
      <div className="mt-5 flex items-center gap-3">
        <ProductThumb src="/products/keyboard.jpg" alt={t.landing.prodKeyboard} size={52} />
        <p className="min-w-0 truncate text-[15px] font-bold">{t.landing.prodKeyboard}</p>
      </div>
      <ul className="mt-4 space-y-2">
        {rows.map((r) => (
          <li
            key={r.p}
            className={`flex items-center justify-between rounded-2xl px-3.5 py-2.5 ${r.best ? "bg-teal-200/60" : "bg-paper"}`}
          >
            <span className="flex items-center gap-2">
              <Chip className={PLATFORM_CHIP[r.p]}>{r.p}</Chip>
              {r.best && <span className="text-[13px] font-semibold text-pine-900">{t.landing.b4Best}</span>}
            </span>
            <span className="text-[16px] font-bold tabular-nums">{formatVND(r.price)}</span>
          </li>
        ))}
      </ul>
      <ExampleLabel className="mt-4 self-start" />
    </Bezel>
  );
}

function GuestCard() {
  const { t } = useLanguage();
  return (
    <Bezel className="lg:col-span-4" tone="teal" coreClassName="flex flex-col justify-between p-6 sm:p-7">
      <div className="flex items-start gap-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pine-950/10">
          <UserRound className="h-5 w-5" strokeWidth={1.5} />
        </span>
        <div>
          <h3 className="text-[19px] font-bold leading-snug tracking-[-0.01em]">{t.landing.b5Title}</h3>
          <p className="mt-1 text-[15px] leading-relaxed text-pine-900">{t.landing.b5Text}</p>
        </div>
      </div>
      {/* What a guest gets: paste, and the answer right under it */}
      <div className="mt-6 space-y-2" aria-hidden>
        <div className="flex items-center gap-2 rounded-full bg-white/80 p-1.5 pl-4 text-[14px] text-pine-800 shadow-inner">
          <Link2 className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          <span className="truncate">shopee.vn/…</span>
          <span className="ml-auto rounded-full bg-pine-900 px-4 py-2 font-bold text-chalk">{t.landing.checkBtn}</span>
        </div>
        <div className="flex items-center gap-3 rounded-[1.25rem] bg-white p-3 shadow-soft">
          <ProductThumb src="/products/headphones.webp" alt="" size={44} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold">{t.landing.prodHeadphones}</p>
            <p className="text-[13px] text-pine-700">
              {t.landing.priceNow} · {t.landing.justChecked}
            </p>
          </div>
          <span className="text-[16px] font-extrabold tabular-nums">{formatVND(1290000)}</span>
        </div>
      </div>
    </Bezel>
  );
}

function ExtensionCard() {
  const { t } = useLanguage();
  const rows = [
    { name: t.landing.ext2, time: "00:00:00" },
    { name: t.landing.ext3, time: "12:00:00" },
    { name: t.landing.ext4, time: "08:00:00" },
  ];
  return (
    <Bezel className="lg:col-span-4" coreClassName="flex flex-col p-6 sm:p-7">
      <CardHead icon={Puzzle} title={t.landing.b6Title} text={t.landing.b6Text} />
      <ul className="mt-5 space-y-2">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center justify-between rounded-2xl bg-paper px-3.5 py-2.5">
            <span className="text-[15px] font-semibold">
              {r.name} <span className="ml-1 font-normal tabular-nums text-pine-700">{r.time}</span>
            </span>
            <span aria-hidden className="relative h-6 w-10 rounded-full bg-pine-900">
              <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-teal-300" />
            </span>
          </li>
        ))}
      </ul>
    </Bezel>
  );
}

export function FeatureBento() {
  const { t } = useLanguage();
  return (
    <section aria-labelledby="bento-title" className="py-24 md:py-32">
      <div className="mx-auto max-w-[1240px] px-4 md:px-8">
        <div data-reveal className="max-w-[640px]">
          <h2 id="bento-title" className="text-[clamp(32px,4vw,52px)] font-extrabold leading-[1.05] tracking-[-0.035em] text-pine-950">
            {t.landing.benTitle}
          </h2>
          <p className="mt-4 text-[17px] leading-relaxed text-pine-800 md:text-lg">{t.landing.benSentence}</p>
        </div>
        <div data-reveal data-reveal-delay={120} className="mt-12 grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2 lg:grid-cols-12 lg:gap-5 [&>*]:min-w-0">
          <HistoryCard />
          <TargetCard />
          <ZaloCard />
          <CompareCard />
          <GuestCard />
          <ExtensionCard />
        </div>
      </div>
    </section>
  );
}

/* ── Three steps, on one dark panel ──────────────────────────────────────────────────────── */
export function Steps() {
  const { t } = useLanguage();
  const steps = [
    { icon: Link2, title: t.landing.step1, desc: t.landing.step1Desc },
    { icon: ChartNoAxesColumn, title: t.landing.step2, desc: t.landing.step2Desc },
    { icon: BellRing, title: t.landing.step3, desc: t.landing.step3Desc },
  ];
  return (
    <section aria-labelledby="steps-title" className="px-4 md:px-8">
      <div className="mx-auto max-w-[1240px] overflow-hidden rounded-[2.5rem] bg-pine-900 px-6 py-16 text-chalk md:px-14 md:py-20">
        <h2 id="steps-title" data-reveal className="text-[clamp(30px,3.4vw,44px)] font-extrabold tracking-[-0.03em]">
          {t.landing.howTitle}
        </h2>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <li
              key={s.title}
              data-reveal
              data-reveal-delay={i * 90}
              className="rounded-[1.75rem] bg-white/[0.06] p-6 ring-1 ring-white/10 transition-colors duration-500 ease-spring hover:bg-white/[0.09]"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-400 text-pine-950">
                  <s.icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <span className="text-[15px] font-semibold tabular-nums text-chalk/50">{i + 1}/3</span>
              </div>
              <h3 className="mt-6 text-[20px] font-bold">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-chalk/80">{s.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ── FAQ: heading on the left, answers open in place on the right ─────────────────────────── */
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
  const [open, setOpen] = useState(0);
  return (
    <section aria-labelledby="faq-title" className="py-24 md:py-32">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-4 md:px-8 lg:grid-cols-12">
        <h2
          id="faq-title"
          data-reveal
          className="text-[clamp(30px,3.4vw,44px)] font-extrabold leading-[1.1] tracking-[-0.03em] text-pine-950 lg:sticky lg:top-28 lg:col-span-4 lg:self-start"
        >
          {t.landing.faqTitle}
        </h2>
        <div className="space-y-3 lg:col-span-8">
          {items.map(([q, a], i) => {
            const isOpen = open === i;
            return (
              // The reveal class lives on a wrapper whose className never changes: React rewriting the
              // card's className on open would otherwise drop it and hide the card again.
              <div key={i} data-reveal data-reveal-delay={i * 40}>
              <div
                className={`rounded-[1.5rem] ring-1 transition-colors duration-500 ease-spring ${
                  isOpen ? "bg-white shadow-soft ring-pine-900/[0.06]" : "bg-white/60 ring-pine-900/[0.05] hover:bg-white"
                }`}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-a-${i}`}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex min-h-[64px] w-full items-center justify-between gap-4 px-6 py-4 text-left text-[17px] font-semibold text-pine-950"
                >
                  {q}
                  <span
                    aria-hidden
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-[transform,background-color] duration-500 ease-spring ${
                      isOpen ? "rotate-45 bg-pine-900 text-chalk" : "bg-pine-50 text-pine-900"
                    }`}
                  >
                    <Plus className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                </button>
                <div
                  id={`faq-a-${i}`}
                  className={`grid transition-[grid-template-rows] duration-500 ease-spring ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-[60ch] px-6 pb-6 text-[16px] leading-relaxed text-pine-800">{a}</p>
                  </div>
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

/* ── Closing: the question again, with the paste field ───────────────────────────────────── */
export function Closing({ onSubmit }: { onSubmit: (url: string) => void }) {
  const { t } = useLanguage();
  const [value, setValue] = useState("");
  return (
    <section aria-labelledby="close-title" className="px-4 pb-24 md:px-8 md:pb-32">
      <div className="relative mx-auto max-w-[1240px] overflow-hidden rounded-[2.5rem] bg-teal-400 px-6 py-16 text-pine-950 md:px-14 md:py-20">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-teal-200/60 blur-3xl" />
        <div className="relative grid items-end gap-8 lg:grid-cols-2">
          <div>
            <h2 id="close-title" data-reveal className="text-[clamp(30px,3.6vw,48px)] font-extrabold leading-[1.08] tracking-[-0.03em]">
              {t.landing.ctaTitle}
            </h2>
            <p data-reveal data-reveal-delay={80} className="mt-4 text-[17px] text-pine-900">
              {t.landing.ctaSentence}
            </p>
          </div>
          <form
            data-reveal
            data-reveal-delay={140}
            onSubmit={(e) => {
              e.preventDefault();
              if (value.trim()) onSubmit(value.trim());
            }}
            className="flex flex-col gap-2 rounded-[2rem] bg-white p-2 shadow-float sm:flex-row sm:items-center sm:rounded-full"
          >
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
              className="h-12 min-w-0 flex-1 rounded-full bg-transparent px-4 text-[16px] text-pine-950 placeholder:text-pine-700 focus:outline-none"
            />
            <PillButton type="submit" tone="pine">
              {t.landing.checkBtn}
            </PillButton>
          </form>
        </div>
      </div>
    </section>
  );
}

const CREDITS = [
  { title: "Isolated Headphones", by: "rawpixel", licence: "CC0", href: "https://www.rawpixel.com/image/5967923/isolated-headphones" },
  { title: "Michael Kors Colby Sneaker", by: "SPERA.de", licence: "CC BY 2.0", href: "https://commons.wikimedia.org/w/index.php?curid=39515465" },
  { title: "Keychron K4 mechanical keyboard", by: "iMoD Official", licence: "CC BY 3.0", href: "https://commons.wikimedia.org/w/index.php?curid=135813879" },
  { title: "Free sunglasses isolated white background", by: "rawpixel", licence: "CC0", href: "https://www.rawpixel.com/image/5914424/photo-image-white-background-public-domain-free" },
];

/* ── Footer ──────────────────────────────────────────────────────────────────────────────── */
export function SiteFooter() {
  const { t } = useLanguage();
  const menu = [
    { href: "/", label: t.nav.home },
    { href: "/tracking", label: t.nav.tracking },
    { href: "/notifications", label: t.nav.notifications },
    { href: "/settings", label: t.nav.settings },
  ];
  return (
    <footer className="bg-pine-950 pb-28 pt-16 text-chalk md:pb-12">
      <div className="mx-auto max-w-[1240px] px-4 md:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <Image src="/icon.png" alt="" width={36} height={36} />
              <span className="text-xl font-extrabold tracking-tight">DealHunter</span>
            </div>
            <p className="mt-3 text-[15px] text-chalk/75">{t.landing.footerTagline}</p>
          </div>
          <nav aria-label="Chân trang" className="grid grid-cols-2 gap-x-10 gap-y-3 sm:grid-cols-4">
            {menu.map((m) => (
              <Link key={m.href} href={m.href} className="text-[15px] font-medium text-chalk/80 transition-colors duration-300 hover:text-teal-300">
                {m.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-[13px] text-chalk/60 md:flex-row md:items-start md:justify-between">
          <p>© {new Date().getFullYear()} DealHunter · dealhunter.io.vn</p>
          <p className="max-w-[720px] md:text-right">
            {t.landing.footerCredits}:{" "}
            {CREDITS.map((c, i) => (
              <span key={c.href}>
                <a href={c.href} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:text-chalk hover:underline">
                  {c.title}
                </a>{" "}
                ({c.by}, {c.licence}){i < CREDITS.length - 1 ? " · " : ""}
              </span>
            ))}
          </p>
        </div>
      </div>
    </footer>
  );
}
