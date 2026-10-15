"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowRight, ClipboardPaste, Link2 } from "lucide-react";
import { trackProduct } from "@/lib/api";
import { useAuth, useTrackings } from "@/lib/hooks";
import { useLanguage } from "@/lib/i18n";
import { detectPlatform, formatVND, isKnownPrice } from "@/lib/formatting";
import { LoginModal } from "@/components/auth/LoginModal";
import { WrittenPrice } from "@/components/PriceTag";
import { PlatformBadge } from "@/components/ui/Badge";
import { TryResult, TryTarget } from "@/components/home/TryResult";
import { Reveal } from "@/components/home/Reveal";
import { PriceCardFragment } from "@/components/home/fragments";
import { Closing, Faq, FeatureBento, SiteFooter, Steps } from "@/components/home/sections";
import { Bezel, PillButton } from "@/components/ui/Bezel";
import { ProductImage } from "@/components/ui/ProductImage";

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
  const stageRef = useRef<HTMLDivElement>(null);

  const trimmed = url.trim();
  const platform = trimmed ? detectPlatform(trimmed) : null;
  const looksLikeLink = /^https?:\/\/\S+\.\S+/i.test(trimmed);
  // The visitor's own most recent product with a real price
  const latest = trackings.find((p) => p.Title && isKnownPrice(p.LastPrice));

  const reduceMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const check = async (value: string) => {
    const clean = value.trim();
    if (!clean) return;
    setLoading(true);
    setError(null);
    try {
      const res = await trackProduct(clean);
      qc.invalidateQueries({ queryKey: ["trackings"] });
      setTarget({ id: res.id, productSourceId: res.product_source_id, url: clean });
      // Below the wide layout the card sits under the form: bring it into view
      if (window.innerWidth < 960) {
        window.setTimeout(() => stageRef.current?.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" }), 60);
      }
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

  const checkFromClosing = (value: string) => {
    setUrl(value);
    heroRef.current?.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
    check(value);
  };

  return (
    <>
      <Reveal />

      {/* ── Hero: the statement and the paste field; the product card floats on a teal stage ── */}
      <section ref={heroRef} aria-labelledby="hero-title" className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-40 right-[-10%] h-[620px] w-[620px] rounded-full bg-teal-200/50 blur-3xl" />
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-4 pb-8 pt-10 md:px-8 md:pt-16 min-[960px]:grid-cols-[1.05fr_1fr] min-[960px]:gap-10 min-[960px]:pb-12 min-[960px]:pt-16">
          <div>
            <h1
              id="hero-title"
              className="text-[clamp(40px,10vw,60px)] font-extrabold leading-[1.02] tracking-[-0.04em] text-pine-950 min-[960px]:text-[clamp(52px,5.4vw,78px)]"
            >
              <span className="block overflow-hidden pb-[0.06em]">
                <span className="block animate-line-rise">{t.landing.boardLine1}</span>
              </span>
              <span className="block overflow-hidden pb-[0.06em]">
                <span className="block animate-line-rise text-teal-600 [animation-delay:110ms]">{t.landing.boardLine2}</span>
              </span>
            </h1>
            <p className="mt-6 max-w-[44ch] animate-rise-in text-[17px] leading-relaxed text-pine-800 [animation-delay:400ms] md:text-lg">
              {t.landing.heroSentence}
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                check(url);
              }}
              className="relative z-10 mt-8 max-w-[560px] animate-rise-in [animation-delay:500ms]"
            >
              <label htmlFor="dh-try-url" className="sr-only">
                {t.landing.inputLabel}
              </label>
              <div className="flex flex-col gap-2 rounded-[2rem] bg-white p-2 shadow-float ring-1 ring-pine-900/[0.06] sm:flex-row sm:items-center sm:rounded-full">
                <div className="relative flex min-w-0 flex-1 items-center">
                  <Link2 className="pointer-events-none absolute left-4 h-[18px] w-[18px] text-pine-700" strokeWidth={1.75} />
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
                    className="h-12 w-full rounded-full bg-transparent pl-11 pr-20 text-[16px] text-pine-950 placeholder:text-pine-700 focus:outline-none"
                  />
                  {!trimmed && (
                    <button
                      type="button"
                      onClick={pasteFromClipboard}
                      className="absolute right-1 inline-flex h-9 items-center gap-1.5 rounded-full bg-pine-50 px-3 text-[13px] font-semibold text-pine-900 transition-colors duration-300 hover:bg-pine-100"
                    >
                      <ClipboardPaste className="h-4 w-4" strokeWidth={1.75} />
                      {t.landing.pasteBtn}
                    </button>
                  )}
                </div>
                <PillButton
                  type="submit"
                  disabled={loading}
                  icon={
                    loading ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <ArrowRight className="h-[18px] w-[18px]" strokeWidth={1.75} />
                    )
                  }
                >
                  {loading ? t.landing.checkingBtn : t.landing.checkBtn}
                </PillButton>
              </div>
              {/* One line under the field, always the same height: the platform, a hint, or the error */}
              <div className="mt-3 min-h-[1.6rem] px-4 text-[15px]" aria-live="polite">
                {error ? (
                  <p className="flex items-start gap-2 font-semibold text-marker-deep">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
                    {error}
                  </p>
                ) : platform && platform.id !== "other" ? (
                  <p className="font-semibold text-teal-600">{formatText(t.landing.detected, { platform: platform.name })}</p>
                ) : trimmed && looksLikeLink ? (
                  <p className="text-pine-700">{t.landing.notProductLink}</p>
                ) : (
                  <p className="text-pine-700">{t.landing.heroNote}</p>
                )}
              </div>
            </form>
          </div>

          {/* The stage: a teal panel; the product card (an example until the visitor pastes) floats on it */}
          <div ref={stageRef} className="relative scroll-mt-24 animate-rise-in [animation-delay:250ms]">
            <div className="relative rounded-[2.5rem] bg-teal-400 p-4 shadow-glow sm:p-8 lg:p-10">
              <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2.5rem]">
                <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-teal-200/70 blur-3xl" />
                <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-pine-700/30 blur-3xl" />
              </div>
              <Bezel className="relative bg-white/30 ring-white/40" coreClassName="shadow-float">
                {target ? (
                  <div className="p-1">
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
                      <p className="m-2 rounded-2xl bg-pine-50 p-4 text-[15px] leading-relaxed text-pine-900">
                        {t.landing.guestNote}{" "}
                        <button type="button" onClick={() => setShowLogin(true)} className="font-bold text-teal-600 hover:underline">
                          {t.landing.signIn}
                        </button>
                      </p>
                    )}
                  </div>
                ) : latest ? (
                  <Link
                    href={`/tracking/${latest.ProductSourceID || latest.ID}`}
                    className="block rounded-[1.6rem] p-6 transition-colors duration-500 ease-spring hover:bg-pine-50/60 sm:p-7"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <PlatformBadge platformOrUrl={latest.Platform || latest.CanonicalURL} />
                      <span className="text-sm font-medium text-pine-700">{t.landing.yourLatest}</span>
                    </div>
                    <div className="mt-4 flex items-center gap-4">
                      {latest.ImageURL && <ProductImage src={latest.ImageURL} alt={latest.Title || ""} size={72} />}
                      <p className="line-clamp-2 text-[18px] font-bold leading-snug">{latest.Title}</p>
                    </div>
                    <p className="mt-5 text-sm font-medium text-pine-700">{t.landing.priceNow}</p>
                    <WrittenPrice className="mt-1 block text-[clamp(38px,4vw,52px)]">{formatVND(latest.LastPrice)}</WrittenPrice>
                  </Link>
                ) : (
                  <PriceCardFragment draw />
                )}
              </Bezel>
            </div>
          </div>
        </div>
      </section>

      <FeatureBento />
      <Steps />
      <Faq />
      <Closing onSubmit={checkFromClosing} />
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
