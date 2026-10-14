"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowRight, ClipboardPaste } from "lucide-react";
import { trackProduct } from "@/lib/api";
import { useAuth, useTrackings } from "@/lib/hooks";
import { useLanguage } from "@/lib/i18n";
import { detectPlatform, formatVND, isKnownPrice } from "@/lib/formatting";
import { LoginModal } from "@/components/auth/LoginModal";
import { PriceTag, WrittenPrice } from "@/components/PriceTag";
import { TryResult, TryTarget } from "@/components/home/TryResult";
import { Reveal } from "@/components/home/Reveal";
import { Closing, Faq, FeatureSwitches, HowItWorks, HunterShowcase, SiteFooter } from "@/components/home/sections";

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
  // The visitor's own most recent product with a real price, never sample data
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

  // A link handed over as ?url=... is checked right away
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
      if (text) setUrl(text.trim());
    } catch {
      // permission refused: the visitor pastes by hand
    }
    inputRef.current?.focus();
  };

  const backToInput = () => {
    heroRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 450);
  };

  return (
    <>
      <Reveal />

      {/* ── The board: the question, the paste slot, the visitor's own tag ───────────── */}
      <section ref={heroRef} aria-labelledby="board-title" className="relative overflow-hidden bg-pine-900 text-chalk">
        <div className="mx-auto grid min-h-[calc(100svh-64px)] max-w-[1440px] items-center gap-12 px-5 pb-14 pt-10 md:px-7 lg:grid-cols-12 lg:gap-8 lg:pb-16">
          <div className="lg:col-span-7">
            <h1 id="board-title" className="whitespace-nowrap font-marker text-[clamp(38px,11.4vw,64px)] font-extrabold leading-[0.95] tracking-[-0.03em] md:text-[clamp(60px,7.6vw,112px)] lg:text-[clamp(56px,6.4vw,104px)]">
              <span className="block overflow-hidden pb-[0.06em]">
                <span className="block animate-line-rise">{t.landing.boardLine1}</span>
              </span>
              <span className="block overflow-hidden pb-[0.06em]">
                <span className="block animate-line-rise text-teal-300 [animation-delay:110ms]">{t.landing.boardLine2}</span>
              </span>
            </h1>
            <p className="mt-6 max-w-[54ch] text-lg leading-relaxed text-chalk/90 animate-rise-in [animation-delay:500ms] md:text-xl">
              {t.landing.heroSentence}
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                check(url);
              }}
              className="mt-8 max-w-[640px] animate-rise-in [animation-delay:600ms]"
            >
              <label htmlFor="dh-try-url" className="sr-only">
                {t.landing.inputLabel}
              </label>
              <div className="flex flex-col sm:flex-row">
                <div className="relative flex flex-1 items-center bg-chalk">
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
                    className="h-14 w-full bg-transparent pl-5 pr-24 text-[17px] font-medium text-pine-950 placeholder:text-pine-700 focus:outline-none"
                  />
                  {!trimmed && (
                    <button
                      type="button"
                      onClick={pasteFromClipboard}
                      className="absolute right-2 inline-flex h-10 items-center gap-1.5 bg-pine-100 px-3 text-sm font-semibold text-pine-900 transition-colors hover:bg-pine-200"
                    >
                      <ClipboardPaste className="h-4 w-4" />
                      {t.landing.pasteBtn}
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-14 shrink-0 items-center justify-center gap-2 bg-teal-400 px-6 text-[17px] font-bold text-pine-950 transition-colors hover:bg-teal-300 disabled:bg-pine-700 disabled:text-chalk/80"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      {t.landing.checkingBtn}
                    </>
                  ) : (
                    <>
                      {t.landing.checkBtn}
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
              {/* One line under the slot, always the same height: platform, a hint, or the error */}
              <div className="mt-3 min-h-[1.6rem] text-[15px]" aria-live="polite">
                {error ? (
                  <p className="flex items-start gap-2 font-semibold text-kraft-light">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {error}
                  </p>
                ) : platform && platform.id !== "other" ? (
                  <p className="font-semibold text-teal-300">{formatText(t.landing.detected, { platform: platform.name })}</p>
                ) : trimmed && looksLikeLink ? (
                  <p className="text-chalk/80">{t.landing.notProductLink}</p>
                ) : (
                  <p className="text-chalk/80">{t.landing.heroNote}</p>
                )}
              </div>
            </form>
          </div>

          {/* Right: a real market price sign, and on it the visitor's own tag */}
          <div className="relative min-h-[460px] lg:col-span-5 lg:min-h-[620px]">
            <div className="absolute inset-y-0 right-[-12%] w-[88%] rotate-[4deg] overflow-hidden lg:right-[-18%]">
              <Image
                src="/market/fresh-mangosteen-display.jpg"
                alt="Bảng giá viết tay bằng bút lông trên thùng carton ở một sạp trái cây"
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 90vw"
                className="object-cover object-[30%_40%]"
              />
            </div>
            <div className="relative z-10 max-w-[420px] pt-16 lg:pt-24">
              {target ? (
                <>
                  <TryResult
                    key={target.id}
                    target={target}
                    onReset={() => {
                      setTarget(null);
                      setUrl("");
                      window.setTimeout(() => inputRef.current?.focus(), 0);
                    }}
                  />
                  {!isAuthenticated && (
                    <p className="mt-4 bg-pine-950 p-3 text-sm leading-relaxed text-chalk/90">
                      {t.landing.guestNote}{" "}
                      <button type="button" onClick={() => setShowLogin(true)} className="font-semibold text-teal-300 hover:underline">
                        {t.landing.signIn}
                      </button>
                    </p>
                  )}
                </>
              ) : latest ? (
                <Link href={`/tracking/${latest.ID}`} className="block transition-transform duration-200 hover:-translate-y-1">
                  <PriceTag tilt={-2}>
                    <p className="text-sm font-semibold">{t.landing.yourLatest}</p>
                    <p className="mt-2 line-clamp-2 text-lg font-bold leading-snug">{latest.Title}</p>
                    <WrittenPrice className="mt-5 block text-[clamp(40px,4.4vw,56px)]">{formatVND(latest.LastPrice)}</WrittenPrice>
                  </PriceTag>
                </Link>
              ) : (
                <PriceTag tilt={-2}>
                  <p className="font-marker text-3xl font-extrabold">{t.landing.emptyTagTitle}</p>
                  <p className="mt-3 max-w-[30ch] text-[15px] leading-relaxed">{t.landing.emptyTagHint}</p>
                  <WrittenPrice className="mt-6 block text-[56px] opacity-30">… đ</WrittenPrice>
                </PriceTag>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── The market itself: why the board ─────────────────────────────────────────── */}
      <section aria-label={t.landing.introCaption} className="relative bg-pine-950">
        <div className="relative h-[62svh] overflow-hidden md:h-[88svh]">
          <Image
            src="/market/fruit-vendor-at-ben-thanh-market.jpg"
            alt="Người bán trái cây sắp hàng ở chợ Bến Thành"
            fill
            sizes="100vw"
            className="object-cover object-[50%_45%] animate-slow-drift"
          />
        </div>
        <div className="relative -mt-24 bg-kraft px-5 py-8 text-kraft-ink md:absolute md:bottom-0 md:left-0 md:mt-0 md:w-[58%] md:px-7 md:py-10">
          <p data-reveal className="max-w-[34ch] text-[clamp(20px,2.2vw,32px)] font-bold leading-snug">
            {t.landing.introCaption}
          </p>
        </div>
      </section>

      <HowItWorks />
      <FeatureSwitches />
      <HunterShowcase />
      <Faq />
      <Closing onPaste={backToInput} />
      <SiteFooter />

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}

export default function HomePage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={<div className="py-14 text-center text-sm text-pine-700">{t.home.loadingUI}</div>}>
      <HomeContent />
    </Suspense>
  );
}
