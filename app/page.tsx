"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  BellRing,
  ClipboardPaste,
  LineChart,
  Link2,
  MousePointerClick,
  Scale,
  ShieldCheck,
  Sparkles,
  Timer,
  UserRound,
  Zap,
} from "lucide-react";
import { trackProduct } from "@/lib/api";
import { useAuth, useTrackings } from "@/lib/hooks";
import { useLanguage } from "@/lib/i18n";
import { detectPlatform, isKnownPrice } from "@/lib/formatting";
import { PlatformBadge } from "@/components/ui/Badge";
import { LoginModal } from "@/components/auth/LoginModal";
import { TryResult, TryTarget } from "@/components/home/TryResult";
import { HeroVisual } from "@/components/home/HeroVisual";

function HomeContent() {
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const { t, formatText } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { data: trackings = [] } = useTrackings();

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<TryTarget | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  const trimmed = url.trim();
  const platform = trimmed ? detectPlatform(trimmed) : null;
  const looksLikeLink = /^https?:\/\/\S+\.\S+/i.test(trimmed);
  const latest = trackings.find((p) => p.Title && isKnownPrice(p.LastPrice));

  const check = async (value: string) => {
    const clean = value.trim();
    if (!clean) return;
    setLoading(true);
    setError(null);
    try {
      const res = await trackProduct(clean);
      qc.invalidateQueries({ queryKey: ["trackings"] });
      setTarget({ id: res.id, productSourceId: res.product_source_id, url: clean });
    } catch (err: unknown) {
      setError((err as Error)?.message || t.home.defaultError);
    } finally {
      setLoading(false);
    }
  };

  // A link typed in the top search bar lands here as ?url=...: check it right away
  useEffect(() => {
    const fromSearch = searchParams.get("url");
    if (fromSearch) {
      setUrl(fromSearch);
      check(fromSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        inputRef.current?.focus();
      }
    } catch {
      inputRef.current?.focus(); // permission refused: the visitor pastes by hand
    }
  };

  const backToInput = () => {
    heroRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 400);
  };

  const steps = [
    { icon: Link2, title: t.landing.how1Title, desc: t.landing.how1Desc },
    { icon: LineChart, title: t.landing.how2Title, desc: t.landing.how2Desc },
    { icon: BellRing, title: t.landing.how3Title, desc: t.landing.how3Desc },
  ];

  return (
    <div className="space-y-20 pb-6 sm:space-y-28">
      {/* ── Hero: the product itself, usable right away ─────────────────────────── */}
      <section
        ref={heroRef}
        className="relative -mx-4 overflow-hidden rounded-none bg-pine-950 px-5 pb-14 pt-12 text-white sm:mx-0 sm:rounded-[2rem] sm:px-10 sm:pb-16 sm:pt-16 lg:px-14"
      >
        <div className="pointer-events-none absolute inset-0 bg-grain" />
        <div className="pointer-events-none absolute -left-32 -top-40 h-[28rem] w-[28rem] rounded-full bg-teal-500/30 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-48 right-[-10rem] h-[30rem] w-[30rem] rounded-full bg-pine-600/40 blur-[120px]" />

        <div className="relative grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3.5 py-1.5 text-xs font-semibold text-teal-300 ring-1 ring-white/10">
              <span className="h-1.5 w-1.5 rounded-full bg-honey-400" />
              {t.landing.freePill}
            </span>

            <h1 className="mt-6 text-balance text-[2.4rem] font-extrabold leading-[1.08] tracking-tight sm:text-[3.4rem]">
              {t.landing.heroLine1}
              <br />
              <span className="bg-gradient-to-r from-teal-300 via-teal-400 to-honey-300 bg-clip-text text-transparent">
                {t.landing.heroLine2}
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">{t.landing.heroSubtitle}</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                check(url);
              }}
              className="mt-8 max-w-xl"
            >
              <label htmlFor="dh-try-url" className="sr-only">
                {t.landing.inputLabel}
              </label>
              <div className="flex flex-col gap-2 rounded-[1.4rem] bg-white p-2 shadow-2xl shadow-black/30 ring-4 ring-teal-400/15 sm:flex-row">
                <div className="relative flex flex-1 items-center">
                  <Link2 className="pointer-events-none absolute left-4 h-4 w-4 text-slate-400" />
                  <input
                    ref={inputRef}
                    id="dh-try-url"
                    type="url"
                    inputMode="url"
                    required
                    value={url}
                    disabled={loading}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={t.landing.inputPlaceholder}
                    className="w-full rounded-2xl bg-transparent py-3.5 pl-11 pr-20 text-[15px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                  {!trimmed && (
                    <button
                      type="button"
                      onClick={pasteFromClipboard}
                      className="absolute right-2 inline-flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
                    >
                      <ClipboardPaste className="h-3.5 w-3.5" />
                      {t.landing.pasteBtn}
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading || !trimmed}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-teal-400 px-6 py-3.5 text-[15px] font-bold text-pine-950 transition hover:bg-teal-300 disabled:bg-pine-900 disabled:text-white/80"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {t.landing.checkingBtn}
                    </>
                  ) : (
                    <>
                      {t.landing.checkBtn}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>

              {/* One line under the box, always the same height: detected platform, a hint or the error */}
              <div className="mt-3 min-h-[1.5rem] text-sm">
                {error ? (
                  <p className="flex items-start gap-2 text-rose-300">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {error}
                  </p>
                ) : platform && platform.id !== "other" ? (
                  <p className="flex items-center gap-2 text-teal-300">
                    <ShieldCheck className="h-4 w-4" />
                    {formatText(t.landing.detected, { platform: platform.name })}
                  </p>
                ) : trimmed && looksLikeLink ? (
                  <p className="text-white/60">{t.landing.notProductLink}</p>
                ) : null}
              </div>
            </form>

            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/60">
              {[t.landing.trust1, t.landing.trust2, t.landing.trust3].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-teal-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-5">
            {target ? (
              <div className="space-y-3">
                <TryResult
                  key={target.id}
                  target={target}
                  onReset={() => {
                    setTarget(null);
                    setUrl("");
                    setTimeout(() => inputRef.current?.focus(), 0);
                  }}
                />
                {!isAuthenticated && (
                  <p className="flex items-start gap-2 px-1 text-xs leading-relaxed text-white/60">
                    <UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      {t.landing.guestNote}{" "}
                      <button type="button" onClick={() => setShowLogin(true)} className="font-semibold text-teal-300 hover:underline">
                        {t.landing.signIn}
                      </button>
                    </span>
                  </p>
                )}
              </div>
            ) : (
              <HeroVisual latest={latest} />
            )}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-2xl font-extrabold tracking-tight text-pine-900 sm:text-3xl">{t.landing.howTitle}</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-3">
          {steps.map(({ icon: Icon, title, desc }, i) => (
            <li key={title} className="relative rounded-3xl bg-white p-6 ring-1 ring-slate-200/80">
              <span className="absolute right-5 top-4 text-5xl font-extrabold text-pine-50">{i + 1}</span>
              <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-pine-900 text-teal-300">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="relative mt-5 text-lg font-bold text-slate-900">{title}</h3>
              <p className="relative mt-1.5 text-sm leading-relaxed text-slate-600">{desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Features (bento) ─────────────────────────────────────────────────── */}
      <section>
        <div className="max-w-2xl">
          <h2 className="text-2xl font-extrabold tracking-tight text-pine-900 sm:text-3xl">{t.landing.featuresTitle}</h2>
          <p className="mt-2 text-base text-slate-600">{t.landing.featuresSubtitle}</p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-6">
          <div className="relative overflow-hidden rounded-3xl bg-pine-900 p-7 text-white md:col-span-4">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-500/25 blur-3xl" />
            <LineChart className="relative h-6 w-6 text-teal-300" />
            <h3 className="relative mt-4 text-xl font-bold">{t.landing.f1Title}</h3>
            <p className="relative mt-2 max-w-md text-sm leading-relaxed text-white/70">{t.landing.f1Desc}</p>
            <svg viewBox="0 0 400 90" className="relative mt-6 h-20 w-full" fill="none" aria-hidden>
              <path
                d="M0 30 C 40 28, 60 50, 95 46 S 150 18, 190 24 S 250 60, 290 66 S 360 72, 400 74"
                stroke="#3CCFB0"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="rounded-3xl bg-white p-7 ring-1 ring-slate-200/80 md:col-span-2">
            <Scale className="h-6 w-6 text-pine-700" />
            <h3 className="mt-4 text-lg font-bold text-slate-900">{t.landing.f2Title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{t.landing.f2Desc}</p>
          </div>
          <div className="rounded-3xl bg-white p-7 ring-1 ring-slate-200/80 md:col-span-3">
            <Bell className="h-6 w-6 text-pine-700" />
            <h3 className="mt-4 text-lg font-bold text-slate-900">{t.landing.f3Title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{t.landing.f3Desc}</p>
          </div>
          <div className="rounded-3xl bg-honey-100 p-7 ring-1 ring-honey-300/60 md:col-span-3">
            <div className="flex items-center gap-2 text-pine-900">
              <Timer className="h-6 w-6" />
              <MousePointerClick className="h-5 w-5 opacity-60" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">{t.landing.f4Title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{t.landing.f4Desc}</p>
          </div>
        </div>
      </section>

      {/* ── Marketplaces + where to find the link ────────────────────────────── */}
      <section className="grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">{t.landing.platformsTitle}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {["shopee", "lazada", "tiktok"].map((p) => (
              <PlatformBadge key={p} platformOrUrl={p} className="px-3 py-1.5 text-sm" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">{t.landing.howToTitle}</h2>
          <div className="mt-4 divide-y divide-slate-200/80 rounded-3xl bg-white ring-1 ring-slate-200/80">
            {[
              { p: "shopee", text: t.home.howToShopee },
              { p: "lazada", text: t.home.howToLazada },
              { p: "tiktok", text: t.home.howToTikTok },
            ].map(({ p, text }) => (
              <div key={p} className="flex flex-col gap-2 p-5 sm:flex-row sm:items-start sm:gap-4">
                <PlatformBadge platformOrUrl={p} className="w-fit shrink-0" />
                <p className="text-sm leading-relaxed text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing call to action ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-pine-900 to-pine-950 px-6 py-12 text-center text-white sm:px-12 sm:py-16">
        <div className="pointer-events-none absolute inset-0 bg-grain" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-56 w-[36rem] -translate-x-1/2 rounded-full bg-teal-500/25 blur-3xl" />
        <Sparkles className="relative mx-auto h-7 w-7 text-honey-300" />
        <h2 className="relative mx-auto mt-4 max-w-2xl text-2xl font-extrabold tracking-tight sm:text-4xl">{t.landing.ctaTitle}</h2>
        <p className="relative mt-3 text-white/70">{t.landing.ctaDesc}</p>
        <button
          type="button"
          onClick={backToInput}
          className="relative mt-7 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-[15px] font-semibold text-pine-900 transition hover:bg-teal-300"
        >
          <Zap className="h-4 w-4" />
          {t.landing.ctaBtn}
        </button>
      </section>

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
}

export default function HomePage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={<div className="py-14 text-center text-xs text-slate-400">{t.home.loadingUI}</div>}>
      <HomeContent />
    </Suspense>
  );
}
