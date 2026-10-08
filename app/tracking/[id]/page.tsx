"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  replaceTargetPriceRule,
  pickActiveTargetRule,
  TargetCleanupError,
  AlertRule,
  PriceSnapshot,
  TrackedProduct,
} from "@/lib/api";
import { useTracking, usePriceHistory, useAlerts } from "@/lib/hooks";
import { useLanguage } from "@/lib/i18n";
import { CreateAlertModal } from "@/components/alerts/CreateAlertModal";
import { ActiveAlertCard } from "@/components/alerts/ActiveAlertCard";
import { SourceComparisonSection } from "@/components/comparison/SourceComparisonSection";
import { LinkSourceModal } from "@/components/comparison/LinkSourceModal";
import { VoucherBox } from "@/components/voucher/VoucherBox";
import {
  formatVND,
  formatCompactVND,
  formatDateTime,
  formatRelativeTime,
  calculatePriceStats,
} from "@/lib/formatting";
import { PlatformBadge } from "@/components/ui/Badge";
import { DetailSkeleton } from "@/components/ui/LoadingSkeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  ArrowLeft,
  Share2,
  ExternalLink,
  Target,
  X,
  TrendingDown,
  Calendar,
  AlertCircle,
  PackageCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  BellRing,
  Plus,
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const idOrSourceId = params.id as string;
  const { t, formatText } = useLanguage();

  const { data: tracking, isLoading: trackingLoading, error: trackingError } = useTracking(idOrSourceId);
  const { data: snapshots = [], isLoading: priceLoading, error: priceError } = usePriceHistory(idOrSourceId);
  // No `= []` default: a new array every render would re-run the effect below forever.
  const { data: alertsData, error: alertsError, refetch: refetchAlerts } = useAlerts(idOrSourceId);

  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("90d");
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showCreateAlertModal, setShowCreateAlertModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [targetInput, setTargetInput] = useState<number>(0);
  const [targetError, setTargetError] = useState<string | null>(null);
  const [savingTarget, setSavingTarget] = useState(false);
  const [copyNotice, setCopyNotice] = useState(false);

  const loading = trackingLoading || priceLoading;
  const error = trackingError
    ? (trackingError as Error).message
    : priceError
    ? (priceError as Error).message
    : null;

  useEffect(() => {
    if (alertsData) setAlerts(alertsData);
  }, [alertsData]);

  // The target price is the user's newest active, non-expired target_price rule on the server
  // (same rule as the tracking list); nothing else
  const savedTarget: number | null = pickActiveTargetRule(alerts)?.threshold_value ?? null;
  const alertsErrorMessage = alertsError ? (alertsError as Error).message : null;

  const stats = useMemo(() => {
    return calculatePriceStats(snapshots);
  }, [snapshots]);

  const currentPrice =
    tracking?.LastEffectivePrice ||
    tracking?.LastPrice ||
    (stats ? stats.current : undefined);

  const oldPrice =
    stats && currentPrice && stats.highest > currentPrice
      ? stats.highest
      : undefined;

  const changePercent = stats ? stats.changePercent : undefined;

  const openTargetModal = () => {
    // Pre-fill only the saved target; otherwise the user types it (or picks a quick discount)
    setTargetInput(savedTarget ?? 0);
    setTargetError(null);
    setShowTargetModal(true);
  };

  // Handle saving target price (Screen 8): only reported as saved once the server has stored it
  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInput || targetInput <= 0) return;

    setSavingTarget(true);
    setTargetError(null);
    try {
      // Creates the new rule and deletes the previous target rules, so only one target exists
      const newRule = await replaceTargetPriceRule(idOrSourceId, {
        rule_type: "target_price",
        threshold_value: targetInput,
        expires_in_days: 60,
      });
      setAlerts((prev) => [newRule, ...prev.filter((r) => r.rule_type !== "target_price")]);
      refetchAlerts();
      setShowTargetModal(false);
    } catch (err: any) {
      if (err instanceof TargetCleanupError) {
        // The new target was saved; show the server's real rule list (old targets may remain)
        setAlerts((prev) => [err.rule, ...prev]);
        refetchAlerts();
      }
      setTargetError(err?.message || "Không lưu được giá mục tiêu. Vui lòng thử lại.");
    } finally {
      setSavingTarget(false);
    }
  };

  // Quick discount buttons (-5%, -10%, -15%, -20%)
  const handleQuickPercent = (percent: number) => {
    if (!currentPrice) return;
    const computed = Math.round(currentPrice * (1 - percent / 100));
    setTargetInput(computed);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: tracking?.Title || t.common.appName,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopyNotice(true);
      setTimeout(() => setCopyNotice(false), 2000);
    }
  };

  // Filter snapshots by time range
  const filteredSnapshots = useMemo(() => {
    if (!snapshots || snapshots.length === 0) return [];
    if (timeRange === "all") return snapshots;

    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const filtered = snapshots.filter((s) => new Date(s.CapturedAt).getTime() >= cutoff);
    return filtered.length > 0 ? filtered : snapshots;
  }, [snapshots, timeRange]);

  const chartData = useMemo(() => {
    return filteredSnapshots.map((s) => ({
      time: new Date(s.CapturedAt).toLocaleDateString("vi-VN", {
        month: "numeric",
        day: "numeric",
      }),
      rawDate: s.CapturedAt,
      effectivePrice: s.EffectivePrice || s.Price,
      rawPrice: s.Price,
      shipping: s.ShippingFee,
      inStock: s.InStock,
    }));
  }, [filteredSnapshots]);

  // Unknown (undefined) without a target or a current price; never a made-up 0
  const diffFromTarget =
    savedTarget && currentPrice ? Math.max(0, currentPrice - savedTarget) : undefined;
  const targetProgress = useMemo(() => {
    if (!savedTarget || !currentPrice || !oldPrice || oldPrice <= savedTarget) return 0;
    const drop = oldPrice - currentPrice;
    const total = oldPrice - savedTarget;
    return Math.min(100, Math.max(0, Math.round((drop / total) * 100)));
  }, [savedTarget, currentPrice, oldPrice]);

  if (loading) {
    return (
      <div className="py-6">
        <DetailSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-8 space-y-6">
      {/* 1. TOP HEADER matching Screen 6 in mobile.png */}
      <div className="flex items-center justify-between">
        <Link
          href="/tracking"
          className="p-2 -ml-2 text-slate-600 hover:text-pine-900 rounded-full hover:bg-slate-100 transition-colors"
          title={t.detail.backToList}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="flex items-center gap-2">
          {copyNotice && (
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
              {t.detail.copiedLink}
            </span>
          )}
          <button
            type="button"
            onClick={handleShare}
            className="p-2 text-slate-500 hover:text-pine-900 hover:bg-slate-100 rounded-full transition-colors"
            title={t.detail.shareProduct}
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. PRODUCT HERO SECTION matching Screen 6 in mobile.png */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
        {/* Large Product Image */}
        <div className="w-full h-56 sm:h-72 bg-gradient-to-b from-slate-50 to-slate-100/60 rounded-3xl flex items-center justify-center relative overflow-hidden">
          <svg className="w-32 h-32 sm:w-40 sm:h-40 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
          </svg>
        </div>

        {/* Title, Platform & Subtitle */}
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-black text-pine-900 tracking-tight leading-snug">
            {tracking?.Title || (tracking?.CanonicalURL ? decodeURIComponent(tracking.CanonicalURL.split("/").filter(Boolean).pop() || "") : t.notifications.productFallback)}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal">
            {tracking?.SellerName ? formatText(t.detail.shopLabel, { name: tracking.SellerName }) : t.detail.officialStore}
          </p>
          <div className="pt-1 flex items-center gap-2 flex-wrap">
            <PlatformBadge platformOrUrl={tracking?.Platform || tracking?.CanonicalURL} />
            {tracking?.CanonicalURL && (
              <a
                href={tracking.AffiliateURL || tracking.CanonicalURL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-pine-900 hover:underline"
              >
                <span>{t.detail.openOriginal}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Price Row matching Screen 6 */}
        <div className="pt-2 border-t border-slate-100 flex items-baseline gap-3">
          <span className="text-3xl sm:text-4xl font-black text-pine-900">
            {currentPrice ? formatVND(currentPrice) : t.common.unknown}
          </span>
          {oldPrice && (
            <span className="text-sm text-slate-400 line-through">
              {formatVND(oldPrice)}
            </span>
          )}
          {changePercent !== undefined && (
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
              ↓ {Math.abs(changePercent)}%
            </span>
          )}
        </div>

        {/* Badges matching Screen 6 */}
        {(Boolean(changePercent && changePercent < 0) || Boolean(stats && currentPrice && currentPrice <= stats.lowest)) && (
          <div className="flex items-center gap-2 flex-wrap">
            {changePercent !== undefined && changePercent < 0 && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                {t.detail.justDropped}
              </span>
            )}
            {stats && currentPrice && currentPrice <= stats.lowest && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {t.detail.lowest90dBadge}
              </span>
            )}
          </div>
        )}

        {/* Target Price Card matching Screen 6 */}
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                {t.detail.targetPrice}
              </span>
              <span className="text-sm sm:text-base font-black text-slate-800">
                {alertsErrorMessage ? t.common.unknown : savedTarget ? formatVND(savedTarget) : t.detail.notSet}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                {t.detail.distanceFromTarget}
              </span>
              <span className="text-sm sm:text-base font-black text-pine-900">
                {alertsErrorMessage
                  ? t.common.unknown
                  : !savedTarget
                  ? t.detail.noTarget
                  : diffFromTarget !== undefined
                  ? formatVND(diffFromTarget)
                  : t.common.unknown}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${targetProgress}%` }}
            />
          </div>

          <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>{t.detail.targetProgress}</span>
            <button
              type="button"
              onClick={() => openTargetModal()}
              className="font-bold text-pine-900 hover:underline"
            >
              {t.detail.editTarget}
            </button>
          </div>
        </div>

        {/* 2-Column Stats matching Screen 6 */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider mb-1">
              {t.detail.lowest90d}
            </span>
            <span className="text-base font-extrabold text-slate-900 block">
              {stats ? formatVND(stats.lowest) : t.common.unknown}
            </span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider mb-1">
              {t.detail.average90d}
            </span>
            <span className="text-base font-extrabold text-slate-900 block">
              {stats ? formatVND(stats.average) : t.common.unknown}
            </span>
          </div>
        </div>
      </div>

      {/* 2.2 HỘP BÍ KÍP SĂN SALE 2 BƯỚC & VOUCHER INTELLIGENCE (Phase 3.5.2) */}
      <VoucherBox
        trackingId={idOrSourceId}
        canonicalUrl={tracking?.CanonicalURL}
        affiliateUrl={tracking?.AffiliateURL}
      />

      {/* 2.5 CẢNH BÁO GIÁ THÔNG MINH (Phase 2) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-pine-50 text-pine-900 flex items-center justify-center shrink-0">
              <BellRing className="w-5 h-5 text-pine-900" />
            </div>
            <div>
              <h2 className="text-lg font-black text-pine-900 tracking-tight">
                {t.detail.smartAlertsTitle}
              </h2>
              <p className="text-xs text-slate-500">
                {t.detail.smartAlertsDesc}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateAlertModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-pine-900 hover:bg-pine-950 text-white rounded-full text-xs font-semibold shadow-2xs transition-all self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.detail.addAlertBtn}</span>
          </button>
        </div>

        {alertsErrorMessage && alerts.length === 0 ? (
          <div className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-2xl text-xs flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{alertsErrorMessage}</span>
            </span>
            <button
              type="button"
              onClick={() => refetchAlerts()}
              className="font-semibold underline shrink-0"
            >
              {t.common.retry}
            </button>
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
            <p className="text-xs text-slate-600 font-medium">
              {t.detail.noAlertsTitle}
            </p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              {t.detail.noAlertsDesc}
            </p>
            <button
              type="button"
              onClick={() => setShowCreateAlertModal(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-pine-900 bg-white border border-slate-200 rounded-full hover:bg-pine-50 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>{t.detail.createFirstRuleBtn}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {alerts.map((rule) => (
              <ActiveAlertCard
                key={rule.id}
                rule={rule}
                onRuleDeleted={(deletedId) => {
                  setAlerts((prev) => prev.filter((r) => r.id !== deletedId));
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* 2.6 SECTION SO SANH GIA DA SAN (Phase 3) */}
      <SourceComparisonSection
        trackingId={idOrSourceId}
        productId={tracking?.ProductID || idOrSourceId}
        onLinkSource={() => setShowLinkModal(true)}
      />

      {/* 3. SECTION LỊCH SỬ GIÁ & BIỂU ĐỒ matching Screen 7 in mobile.png */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-pine-900">
              {t.detail.priceHistoryTitle}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.detail.priceHistorySubtitle}
            </p>
          </div>

          {/* Time range tabs matching Screen 7 */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full w-fit">
            {[
              { id: "7d", label: t.detail.range7d },
              { id: "30d", label: t.detail.range30d },
              { id: "90d", label: t.detail.range90d },
              { id: "all", label: t.detail.rangeAll },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTimeRange(tab.id as any)}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                  timeRange === tab.id
                    ? "bg-pine-900 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recharts AreaChart with Current Price & Target Price Reference lines */}
        <div className="h-64 sm:h-72 w-full pt-2">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              {t.detail.accumulatingData}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="pineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickFormatter={(val) => formatCompactVND(val)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-pine-950 text-white rounded-2xl p-3 shadow-xl text-xs space-y-1 border border-pine-800">
                          <p className="text-pine-300 text-[10px]">
                            {formatDateTime(data.rawDate)}
                          </p>
                          <p className="text-base font-black text-white">
                            {formatVND(data.effectivePrice)}
                          </p>
                          <p className="text-[11px] text-slate-300">
                            {t.detail.listedPriceLabel} {formatVND(data.rawPrice)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {savedTarget && (
                  <ReferenceLine
                    y={savedTarget}
                    stroke="#e11d48"
                    strokeDasharray="4 4"
                    label={{
                      value: formatText(t.detail.targetPriceLabel, {
                        price: formatCompactVND(savedTarget),
                      }),
                      fill: "#e11d48",
                      fontSize: 10,
                      position: "insideBottomRight",
                    }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="effectivePrice"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#pineGradient)"
                  dot={{ r: 3, fill: "#059669" }}
                  activeDot={{ r: 6, fill: "#0A3832", stroke: "#ffffff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 3 Stats: Thấp nhất, Trung bình, Cao nhất matching Screen 7 */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
          <div className="p-2.5 rounded-xl bg-slate-50">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase">
              {t.detail.lowest90d}
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 block mt-0.5">
              {stats ? formatVND(stats.lowest) : t.common.unknown}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase">
              {t.detail.average90d}
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 block mt-0.5">
              {stats ? formatVND(stats.average) : t.common.unknown}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase">
              {t.detail.highest90d}
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 block mt-0.5">
              {stats ? formatVND(stats.highest) : t.common.unknown}
            </span>
          </div>
        </div>

        {/* Các mốc giá quan trọng matching Screen 7 */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {t.detail.keyPriceMilestones}
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="font-semibold text-slate-800">{t.detail.milestoneJustDropped}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-pine-900">{currentPrice ? formatVND(currentPrice) : t.common.unknown}</span>
                <span className="text-[10px] text-slate-400">{t.detail.milestoneRecent}</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-slate-800">{t.detail.milestoneLowest}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-pine-900">
                  {stats ? formatVND(stats.lowest) : t.common.unknown}
                </span>
                <span className="text-[10px] text-slate-400">{t.detail.milestoneRecordedLow}</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="font-semibold text-slate-800">{t.detail.milestoneAverage}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-700">
                  {stats ? formatVND(stats.average) : t.common.unknown}
                </span>
                <span className="text-[10px] text-slate-400">{t.detail.milestoneMedian}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. STICKY BOTTOM BUTTON matching Screen 6 in mobile.png */}
      <div className="fixed bottom-14 md:bottom-6 left-0 right-0 p-4 max-w-md mx-auto pointer-events-none z-30">
        <button
          type="button"
          onClick={() => openTargetModal()}
          className="w-full py-3.5 bg-pine-900 hover:bg-pine-950 text-white font-bold rounded-full text-sm shadow-xl pointer-events-auto transition-all flex items-center justify-center gap-2"
        >
          <Target className="w-4 h-4" />
          <span>{savedTarget ? t.detail.updateTargetButton : t.detail.setTargetButton}</span>
        </button>
      </div>

      {/* 5. SCREEN 8: ĐẶT GIÁ MỤC TIÊU MODAL matching Screen 8 in mobile.png */}
      {showTargetModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-scaleUp relative">
            <button
              type="button"
              onClick={() => setShowTargetModal(false)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-700 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-black text-pine-900">
                {t.detail.targetModalTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {t.detail.targetModalDesc}
              </p>
            </div>

            <form onSubmit={handleSaveTarget} className="space-y-4">
              <div className="relative">
                <input
                  type="number"
                  step="10000"
                  required
                  value={targetInput > 0 ? targetInput : ""}
                  onChange={(e) => setTargetInput(Number(e.target.value))}
                  placeholder="6.000.000"
                  className="w-full px-4 py-3.5 text-2xl font-black rounded-2xl border border-slate-200 bg-slate-50 text-pine-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pine-900/10 focus:border-pine-900 text-center"
                />
                {targetInput > 0 && (
                  <span className="text-xs font-semibold text-slate-400 block text-center mt-1">
                    {formatText(t.detail.displayPrice, { price: formatVND(targetInput) })}
                  </span>
                )}
              </div>

              {/* Quick discount pills (-5%, -10%, -15%, -20%) matching Screen 8 */}
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleQuickPercent(pct)}
                    disabled={!currentPrice}
                    className="disabled:opacity-40 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-pine-50 hover:border-pine-300 text-xs font-bold text-slate-700 hover:text-pine-900 transition-colors"
                  >
                    -{pct}%
                  </button>
                ))}
              </div>

              {targetError && (
                <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">{targetError}</p>
              )}

              <button
                type="submit"
                disabled={savingTarget}
                className="w-full py-3.5 bg-pine-900 hover:bg-pine-950 disabled:opacity-50 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-xs transition-all"
              >
                {savingTarget ? t.common.loading : t.detail.startTrackingBtn}
              </button>
            </form>

            {/* Gợi ý card matching Screen 8 */}
            <div className="bg-pine-50/80 border border-pine-100 rounded-2xl p-3.5 text-xs text-pine-900 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-pine-800 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">{t.detail.tipTitle}</span>
                <span className="text-slate-600 leading-relaxed block">
                  {t.detail.tipDesc}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE ALERT MODAL (Phase 2) */}
      <CreateAlertModal
        isOpen={showCreateAlertModal}
        onClose={() => setShowCreateAlertModal(false)}
        productId={idOrSourceId}
        currentPrice={currentPrice || undefined}
        onAlertCreated={(newRule) => {
          // savedTarget is derived from alerts, so a new target_price rule shows up immediately;
          // the refetch drops target rules the modal replaced on the server
          setAlerts((prev) => [newRule, ...prev]);
          refetchAlerts();
        }}
      />

      {/* LINK SOURCE MODAL (Phase 3) */}
      <LinkSourceModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        productId={tracking?.ProductID || idOrSourceId}
        trackingId={idOrSourceId}
      />
    </div>
  );
}
