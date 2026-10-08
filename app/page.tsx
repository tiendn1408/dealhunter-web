"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { trackProduct } from "@/lib/api";
import { useTrackings } from "@/lib/hooks";
import { useLanguage } from "@/lib/i18n";
import { useQueryClient } from "@tanstack/react-query";
import { detectPlatform, formatVND } from "@/lib/formatting";
import { PlatformBadge } from "@/components/ui/Badge";
import {
  Link2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Search,
  X,
  Target,
  TrendingDown,
} from "lucide-react";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const { t, formatText } = useLanguage();

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    data: userTrackings = [],
    isLoading: trackingsLoading,
    error: trackingsError,
    refetch: refetchTrackings,
  } = useTrackings();
  const [showInputModal, setShowInputModal] = useState(false);

  // Success state matching Screen 4
  const [successData, setSuccessData] = useState<{
    id: string;
    productSourceId: string;
    url: string;
    pollingIntervalSeconds?: number;
  } | null>(null);

  // Check URL query parameters
  useEffect(() => {
    const urlParam = searchParams.get("url");
    if (urlParam) {
      setUrl(urlParam);
      setShowInputModal(true);
    }
  }, [searchParams]);

  const detected = url.trim() ? detectPlatform(url) : null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = url.trim();
    if (!cleanUrl) return;

    setLoading(true);
    setError(null);

    try {
      const res = await trackProduct(cleanUrl);
      qc.invalidateQueries({ queryKey: ["trackings"] });
      setSuccessData({
        id: res.id,
        productSourceId: res.product_source_id,
        url: cleanUrl,
        pollingIntervalSeconds: res.polling_interval_seconds,
      });
      setShowInputModal(false);
    } catch (err: any) {
      setError(err.message || t.home.defaultError);
    } finally {
      setLoading(false);
    }
  };

  // Hero card shows the visitor's own most recent tracked product with its real price, never sample data
  const latestTracked = userTrackings.find((p) => p.Title && (p.LastPrice ?? 0) > 0);

  return (
    <div className="space-y-12 sm:space-y-16 py-4 sm:py-8 max-w-6xl mx-auto">
      {/* 1. HERO SECTION matching web-dashboard.png & mobile.png */}
      {!successData ? (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-pine-50/70 via-white to-white border border-pine-100/80 p-6 sm:p-10 lg:p-14 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              {/* Tagline Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pine-100/90 text-pine-900 border border-pine-200/80 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-pine-800" />
                <span>{t.home.taglinePill}</span>
              </div>

              {/* Headline */}
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-5xl font-black text-pine-900 tracking-tight leading-tight">
                  {t.home.heroTitle}
                </h1>
                <p className="text-base sm:text-xl text-slate-600 font-normal leading-relaxed max-w-lg">
                  {t.home.heroSubtitle}
                </p>
              </div>

              {/* Main Paste Input Box */}
              <div className="bg-white border border-slate-200 rounded-2xl p-2 sm:p-2.5 shadow-sm space-y-2">
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col sm:flex-row gap-2"
                >
                  <div className="relative flex-1 flex items-center">
                    <Link2 className="w-4 h-4 text-slate-400 absolute left-3.5" />
                    <input
                      type="url"
                      required
                      value={url}
                      disabled={loading}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder={t.home.pastePlaceholder}
                      className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm rounded-xl focus:outline-none text-slate-800 placeholder-slate-400 bg-transparent font-medium"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !url.trim()}
                    className="px-6 py-3 bg-pine-900 hover:bg-pine-950 active:bg-black disabled:opacity-50 text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 shrink-0"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        <span>{t.home.analyzingBtn}</span>
                      </>
                    ) : (
                      <>
                        <span>{t.home.trackBtn}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Real in-progress state: the request is reading the product from the marketplace */}
                {loading && (
                  <div className="pt-2 px-2 text-[11px] text-pine-900 font-semibold border-t border-slate-100 flex items-center gap-2">
                    <span className="inline-block w-3 h-3 border-2 border-pine-800 border-t-transparent rounded-full animate-spin" />
                    <span>
                      {formatText(t.home.stepReadingFrom, { platform: detected?.name || t.common.appName })}
                    </span>
                  </div>
                )}
              </div>

              {/* Sub-action: "Hoặc: Tìm sản phẩm bạn muốn mua" */}
              <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                <span>{t.home.orPasteLink}</span>
                <button
                  type="button"
                  onClick={() => setShowInputModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium transition-all shadow-2xs"
                >
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.home.pasteLinkBtn}</span>
                </button>
              </div>

              {/* Error display */}
              {error && (
                <div className="p-3.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Right Graphic: Floating Signature Card matching web-dashboard.png */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              {/* Curved annotation text */}
              <div className="hidden lg:block absolute -top-8 right-6 text-pine-800 font-bold text-xs tracking-wide">
                <span className="block transform rotate-6">{t.home.dontMissTitle1}</span>
                <span className="block transform rotate-6 text-sm text-pine-900">{t.home.dontMissTitle2}</span>
                <svg className="w-8 h-8 text-pine-700 mt-1 ml-4" viewBox="0 0 40 40" fill="none">
                  <path d="M10 5 C 25 15, 30 25, 20 35" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
                  <polygon points="17,35 24,35 20,38" fill="currentColor" />
                </svg>
              </div>

              {/* Signature card: latest real tracked product */}
              <div className="w-full max-w-sm bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl relative z-10 transition-transform hover:-translate-y-1 duration-300">
                {latestTracked && (
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                      {t.home.latestTrackedBadge}
                    </span>
                  </div>
                )}

                {/* Product icon */}
                <div className="w-full h-36 bg-gradient-to-tr from-slate-100 to-slate-50 rounded-2xl flex items-center justify-center mb-4 relative overflow-hidden">
                  <svg className="w-20 h-20 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
                  </svg>
                </div>

                {latestTracked ? (
                  <Link href={`/tracking/${latestTracked.ID}`} className="block">
                    <div className="mb-1">
                      <PlatformBadge platformOrUrl={latestTracked.Platform || latestTracked.CanonicalURL || ""} />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm mb-2 line-clamp-2">{latestTracked.Title}</h3>
                    <span className="text-2xl font-black text-pine-900">{formatVND(latestTracked.LastPrice ?? 0)}</span>
                    <p className="text-[11px] text-slate-500 font-medium mt-2">{t.home.latestTrackedHint}</p>
                  </Link>
                ) : trackingsLoading ? (
                  <p className="text-[11px] text-slate-500 font-medium">{t.common.loading}</p>
                ) : trackingsError ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-rose-700 font-medium flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
                      <span>{(trackingsError as Error).message}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => refetchTrackings()}
                      className="text-[11px] font-bold text-pine-900 hover:underline"
                    >
                      {t.common.retry}
                    </button>
                  </div>
                ) : userTrackings.length > 0 ? (
                  /* Products exist but none has a fetched price yet: say so instead of "no products" */
                  <Link href="/tracking" className="block">
                    <h3 className="font-bold text-slate-900 text-sm mb-1">{t.tracking.checking}</h3>
                    <p className="text-[11px] text-pine-900 font-semibold">{t.home.viewTrackedBtn}</p>
                  </Link>
                ) : (
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm mb-1">{t.home.noTrackedTitle}</h3>
                    <p className="text-[11px] text-slate-500 font-medium">{t.home.noTrackedHint}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* SCREEN 4: SUCCESS CONFIRMATION matching mobile.png Screen 4 */
        <div className="max-w-lg mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md text-center space-y-6 animate-fadeIn">
          {/* Green checkmark circle */}
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-pine-900 mb-1">
              {t.home.addedSuccessTitle}
            </h2>
            <p className="text-xs text-slate-500">
              {t.home.addedSuccessDesc}
            </p>
          </div>

          {/* Product Preview Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-3">
            <div className="flex items-center gap-2">
              <PlatformBadge platformOrUrl={successData.url} />
              <span className="text-[11px] text-slate-500 truncate max-w-[200px]">
                {successData.url}
              </span>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {t.home.newTrackingProduct}
              </h3>
              {/* Only the interval the server actually returned; omitted when unknown */}
              {successData.pollingIntervalSeconds && successData.pollingIntervalSeconds > 0 ? (
                <p className="text-xs text-slate-500">
                  {formatText(t.home.scanIntervalDesc, {
                    minutes: Math.round(successData.pollingIntervalSeconds / 60),
                  })}
                </p>
              ) : null}
            </div>
          </div>

          {/* Notice banner */}
          <div className="bg-pine-50/80 border border-pine-100 rounded-xl p-3 text-xs text-pine-900 leading-relaxed text-left flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-pine-700 mt-0.5 shrink-0" />
            <span>
              {t.home.noticeBanner}
            </span>
          </div>

          {/* CTAs matching Screen 4 */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => router.push(`/tracking/${successData.productSourceId || successData.id}`)}
              className="w-full py-3 bg-pine-900 hover:bg-pine-950 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-xs transition-all"
            >
              {t.home.viewProductBtn}
            </button>
            <button
              type="button"
              onClick={() => {
                setSuccessData(null);
                setUrl("");
              }}
              className="w-full py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm border border-slate-200 transition-colors"
            >
              {t.home.backHomeBtn}
            </button>
          </div>
        </div>
      )}

      {/* 2. SECTION: CÁCH DEALHUNTER HOẠT ĐỘNG matching web-dashboard.png & mobile.png */}
      <div className="space-y-6">
        <h2 className="text-xl sm:text-2xl font-black text-pine-900 tracking-tight">
          {t.home.howItWorks}
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* 3 Step Cards (left 8 cols) */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Step 1 */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="w-9 h-9 rounded-full bg-pine-50 border border-pine-200 text-pine-900 flex items-center justify-center font-black text-sm">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                {t.home.step1Title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t.home.step1Desc}
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="w-9 h-9 rounded-full bg-pine-50 border border-pine-200 text-pine-900 flex items-center justify-center font-black text-sm">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                {t.home.step2Title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t.home.step2Desc}
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="w-9 h-9 rounded-full bg-pine-50 border border-pine-200 text-pine-900 flex items-center justify-center font-black text-sm">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                {t.home.step3Title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t.home.step3Desc}
              </p>
            </div>
          </div>

          {/* Right Highlight Box: "Bạn hoàn toàn chủ động" */}
          <div className="lg:col-span-4 bg-gradient-to-br from-pine-50/80 to-emerald-50/40 border border-pine-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-2xs">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-full bg-pine-900 text-white flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-pine-900 text-sm">
                {t.home.empowerTitle}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t.home.empowerDesc}
              </p>
            </div>

            <Link
              href="/tracking"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-pine-900 hover:text-pine-950 mt-4 group"
            >
              <span>{t.home.viewTrackedBtn}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. SECTION: NỀN TẢNG ĐƯỢC HỖ TRỢ matching web-dashboard.png */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            {t.home.supportedPlatformsTitle}
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{t.home.supportedPlatformsBadge}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-black text-xs border border-orange-200">
              S
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 block">Shopee</span>
              <span className="text-[11px] text-slate-400 block">{t.home.fullSupport}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs border border-blue-200">
              L
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 block">Lazada</span>
              <span className="text-[11px] text-slate-400 block">{t.home.fullSupport}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs">
              T
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 block">TikTok Shop</span>
              <span className="text-[11px] text-slate-400 block">{t.home.fullSupport}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. SECTION: BẠN CÓ THỂ BẮT ĐẦU BẰNG CÁCH... matching web-dashboard.png */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          {t.home.startByTitle}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { platform: "shopee", howTo: t.home.howToShopee },
            { platform: "lazada", howTo: t.home.howToLazada },
            { platform: "tiktok", howTo: t.home.howToTikTok },
          ].map((item) => (
            <div key={item.platform} className="bg-white border border-slate-200/90 rounded-2xl p-4 text-left space-y-2">
              <PlatformBadge platformOrUrl={item.platform} />
              <p className="text-xs text-slate-600 leading-relaxed">{item.howTo}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SCREEN 3: DÁN LINK SẢN PHẨM MODAL matching Screen 3 in mobile.png */}
      {showInputModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-scaleUp relative">
            <button
              type="button"
              onClick={() => setShowInputModal(false)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-700 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-black text-pine-900">
                {t.home.modalTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.home.modalSubtitle}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={t.comparison.urlPlaceholder}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-pine-900/10 focus:border-pine-900 pr-10"
                />
                {url && (
                  <button
                    type="button"
                    onClick={() => setUrl("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="w-full py-3 bg-pine-900 hover:bg-pine-950 disabled:opacity-50 text-white font-semibold rounded-2xl text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>{t.home.modalChecking}</span>
                  </>
                ) : (
                  <span>{t.home.modalContinue}</span>
                )}
              </button>
            </form>

            <p className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              {t.home.supportedPlatformsNote}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const { t } = useLanguage();
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto py-14 text-center text-slate-400 text-xs">
          {t.home.loadingUI}
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
