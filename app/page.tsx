"use client";

import { useEffect, useRef, useState, Suspense } from "react";
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
import { PlatformBadge } from "@/components/ui/Badge";
import { TryResult, TryTarget } from "@/components/home/TryResult";
import { Reveal } from "@/components/home/Reveal";
import { PriceCardFragment } from "@/components/home/fragments";
import { Closing, ExtensionShowcase, Faq, FeatureParagraph, HowItWorks, SiteFooter } from "@/components/home/sections";

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
      if (window.innerWidth < 900) {
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

  const backToInput = () => {
    heroRef.current?.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
    window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 450);
  };

  const checkFromClosing = (value: string) => {
    setUrl(value);
    heroRef.current?.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
    check(value);
  };

  return (
    <>
      <Reveal />

      {/* ── Hero: the statement, the paste field, and the product on the tag-shaped stage ── */}
      <section ref={heroRef} aria-labelledby="hero-title" className="relative overflow-hidden bg-paper">
        {/* Two columns from 900px up: the words on the left, the stage on the right bleeding off the edge */}
        <div className="mx-auto grid max-w-[1440px] min-[900px]:min-h-[calc(100svh-64px)] min-[900px]:grid-cols-2">
        <div className="px-5 pb-4 pt-10 md:px-10 min-[900px]:self-center min-[900px]:pb-24 min-[900px]:pt-12">
          <h1
            id="hero-title"
            className="text-[10vw] font-extrabold leading-[1.02] tracking-[-0.04em] text-pine-950 md:text-[64px] min-[900px]:text-[clamp(44px,5.6vw,92px)]"
          >
            <span className="block overflow-hidden pb-[0.05em]">
              <span className="block animate-line-rise">{t.landing.boardLine1}</span>
            </span>
            <span className="block overflow-hidden pb-[0.05em]">
              <span className="block animate-line-rise text-teal-600 [animation-delay:110ms]">{t.landing.boardLine2}</span>
            </span>
          </h1>
          <p className="mt-6 max-w-[40ch] animate-rise-in text-[17px] leading-relaxed text-pine-800 [animation-delay:450ms] md:text-lg">
            {t.landing.heroSentence}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              check(url);
            }}
            className="relative z-10 mt-8 max-w-[560px] animate-rise-in [animation-delay:550ms]"
          >
            <label htmlFor="dh-try-url" className="sr-only">
              {t.landing.inputLabel}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-0">
              <div className="relative flex flex-1 items-center bg-white">
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
                  className="h-14 w-full bg-transparent pl-4 pr-24 text-[16px] font-medium text-pine-950 placeholder:text-pine-700 focus:outline-none"
                />
                {!trimmed && (
                  <button
                    type="button"
                    onClick={pasteFromClipboard}
                    className="absolute right-2 inline-flex h-10 items-center gap-1.5 bg-pine-50 px-3 text-sm font-semibold text-pine-900 transition-colors hover:bg-pine-100"
                  >
                    <ClipboardPaste className="h-4 w-4" />
                    {t.landing.pasteBtn}
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="cut inline-flex h-14 shrink-0 items-center justify-center gap-2 bg-pine-900 px-6 text-[16px] font-bold text-chalk transition-colors hover:bg-pine-800 disabled:opacity-70"
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
            {/* One line under the field, always the same height: the platform, a hint, or the error */}
            <div className="mt-3 min-h-[1.6rem] text-[15px]" aria-live="polite">
              {error ? (
                <p className="flex items-start gap-2 font-semibold text-marker-deep">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
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

        {/* The stage: the logo's tag at poster size, opening from its edge; the product stands on it */}
        <div
          ref={stageRef}
          className="relative mt-10 scroll-mt-20 animate-shutter min-[900px]:mr-[min(0px,calc((1440px-100vw)/2))] min-[900px]:mt-[16vh]"
        >
          <div className="h-full bg-teal-400 px-4 pb-10 pt-[88px] [clip-path:polygon(72px_0,100%_0,100%_100%,0_100%,0_72px)] sm:px-10 min-[900px]:pb-0 min-[900px]:pl-[clamp(56px,7vw,120px)] min-[900px]:pr-10 min-[900px]:pt-[clamp(48px,6vw,88px)] min-[900px]:[clip-path:polygon(clamp(96px,11vw,200px)_0,100%_0,100%_100%,0_100%,0_clamp(96px,11vw,200px))]">
            <div className="w-full max-w-[580px] animate-settle [animation-delay:350ms]">
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
                    <p className="mt-3 bg-pine-950 p-4 text-[15px] leading-relaxed text-chalk">
                      {t.landing.guestNote}{" "}
                      <button type="button" onClick={() => setShowLogin(true)} className="font-bold text-teal-300 hover:underline">
                        {t.landing.signIn}
                      </button>
                    </p>
                  )}
                </>
              ) : latest ? (
                <Link href={`/tracking/${latest.ProductSourceID || latest.ID}`} className="block transition-transform duration-200 hover:-translate-y-1">
                  <PriceTag>
                    <div className="flex items-center justify-between gap-3">
                      <PlatformBadge platformOrUrl={latest.Platform || latest.CanonicalURL} />
                      <span className="text-sm font-semibold text-pine-700">{t.landing.yourLatest}</span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-[19px] font-bold leading-snug">{latest.Title}</p>
                    <p className="mt-4 text-sm font-semibold text-pine-700">{t.landing.priceNow}</p>
                    <WrittenPrice className="mt-1 block text-[clamp(40px,4.4vw,56px)]">{formatVND(latest.LastPrice)}</WrittenPrice>
                  </PriceTag>
                </Link>
              ) : (
                <PriceCardFragment stage="full" draw />
              )}
            </div>
          </div>
        </div>
        </div>
      </section>

      <HowItWorks />
      <FeatureParagraph onStart={backToInput} />
      <ExtensionShowcase />
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
