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
import { useTracking, usePriceHistory, useFullPriceHistory, useAlerts, PRICE_HISTORY_DAYS } from "@/lib/hooks";
import { useLanguage } from "@/lib/i18n";
import { CreateAlertModal } from "@/components/alerts/CreateAlertModal";
import { ActiveAlertCard } from "@/components/alerts/ActiveAlertCard";
import { SourceComparisonSection } from "@/components/comparison/SourceComparisonSection";
import { LinkSourceModal } from "@/components/comparison/LinkSourceModal";
import { VoucherBox } from "@/components/voucher/VoucherBox";
import {
  detectPlatform,
  formatVND,
  formatCompactVND,
  formatDateTime,
  formatRelativeTime,
  calculatePriceStats,
  computeTargetProgress,
  snapshotsWithinDays,
  snapshotsSince,
} from "@/lib/formatting";
import { PlatformBadge } from "@/components/ui/Badge";
import { DetailSkeleton } from "@/components/ui/LoadingSkeleton";
import { PriceTag, StruckPrice, WrittenPrice } from "@/components/PriceTag";
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
import { ArrowLeft, ArrowUpRight, Share2, Target, X, AlertCircle, Sparkles, BellRing, Plus } from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const idOrSourceId = params.id as string;
  const { t, formatText } = useLanguage();

  const { data: tracking, isLoading: trackingLoading, error: trackingError } = useTracking(idOrSourceId);
  // The last PRICE_HISTORY_DAYS (90) days: the stats, the badges and every range tab up to 90 days
  const { data: snapshots = [], isLoading: priceLoading, error: priceError } = usePriceHistory(idOrSourceId);
  // No `= []` default: a new array every render would re-run the effect below forever.
  const { data: alertsData, error: alertsError, refetch: refetchAlerts } = useAlerts(idOrSourceId);

  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("90d");
  // "Tất cả" = since the tracking was created. A tracking older than the 90-day window needs a second request
  // (fetched when that tab is opened; an unparseable CreatedAt is reported as an error there). A younger one
  // uses the 90-day history clipped to CreatedAt: the source may be shared, so that window can hold snapshots
  // from before this tracking existed.
  const createdAtMs = tracking ? new Date(tracking.CreatedAt).getTime() : NaN;
  const needsFullHistory =
    !!tracking && (isNaN(createdAtMs) || createdAtMs < Date.now() - PRICE_HISTORY_DAYS * 24 * 60 * 60 * 1000);
  const {
    data: fullSnapshots,
    isLoading: fullLoading,
    error: fullError,
  } = useFullPriceHistory(idOrSourceId, tracking?.CreatedAt, timeRange === "all" && needsFullHistory);
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

  // Latest snapshot and change over the 90-day window (the same window as the tracking list)
  const stats = useMemo(() => {
    return calculatePriceStats(snapshots);
  }, [snapshots]);
  // The "90 ngày" lowest/average/highest: only real snapshots captured in the last 90 days
  // (null = no snapshot in that window, shown as unknown)
  const stats90 = useMemo(() => {
    return calculatePriceStats(snapshotsWithinDays(snapshots, 90));
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

  // The "Tất cả" history: the full-history request, or the 90-day history from CreatedAt on
  const allSnapshots = useMemo(
    () => (needsFullHistory ? fullSnapshots ?? [] : snapshotsSince(snapshots, createdAtMs)),
    [needsFullHistory, fullSnapshots, snapshots, createdAtMs]
  );

  // Filter snapshots by time range
  const filteredSnapshots = useMemo(() => {
    if (timeRange === "all") return allSnapshots;
    if (!snapshots || snapshots.length === 0) return [];

    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    // No fallback to the full history: an empty range shows its own empty state
    return snapshotsWithinDays(snapshots, days);
  }, [snapshots, allSnapshots, timeRange]);
  // Loading/failure of the "Tất cả" history: shown in the chart, never as an empty history
  const rangeLoading = timeRange === "all" && needsFullHistory && fullLoading;
  const rangeError = timeRange === "all" && needsFullHistory && fullError ? (fullError as Error).message : null;

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
  // 100% once the current price is at or below the target; empty bar when unknown
  const targetProgress = computeTargetProgress(currentPrice, savedTarget, oldPrice) ?? 0;

  const title =
    tracking?.Title ||
    (tracking?.CanonicalURL
      ? decodeURIComponent(tracking.CanonicalURL.split("/").filter(Boolean).pop() || "")
      : t.notifications.productFallback);
  const platformName = detectPlatform(tracking?.Platform || tracking?.CanonicalURL).name;
  // The owner's affiliate link when the server has one; the plain product link otherwise
  const buyHref = tracking?.AffiliateURL || tracking?.CanonicalURL;
  const statTiles = [
    { label: t.detail.lowest90d, value: stats90 ? formatVND(stats90.lowest) : t.common.unknown },
    { label: t.detail.average90d, value: stats90 ? formatVND(stats90.average) : t.common.unknown },
    { label: t.detail.highest90d, value: stats90 ? formatVND(stats90.highest) : t.common.unknown },
  ];

  if (loading) {
    return (
      <div className="py-6">
        <DetailSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 pb-28 pt-4 sm:pt-8 md:pb-24">
      {/* Back and share */}
      <div className="flex items-center justify-between">
        <Link
          href="/tracking"
          className="-ml-2 inline-flex min-h-[44px] items-center gap-2 px-2 text-[15px] font-semibold text-pine-900 transition-colors hover:bg-white"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>{t.detail.backToList}</span>
        </Link>

        <div className="flex items-center gap-2">
          {copyNotice && (
            <span className="bg-teal-200 px-2 py-1 text-[13px] font-semibold text-pine-950">{t.detail.copiedLink}</span>
          )}
          <button
            type="button"
            onClick={handleShare}
            className="flex h-11 w-11 items-center justify-center text-pine-900 transition-colors hover:bg-white"
            title={t.detail.shareProduct}
            aria-label={t.detail.shareProduct}
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-[#F8E1DC] p-4 text-[15px] text-marker-deep">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* The product's own board: what it is on the left, its price tag on the right */}
      <section className="grid gap-8 bg-pine-900 px-5 py-8 text-chalk sm:px-8 sm:py-10 lg:grid-cols-12 lg:items-center">
        <div className="space-y-4 lg:col-span-7">
          <div className="flex flex-wrap items-center gap-2">
            <PlatformBadge platformOrUrl={tracking?.Platform || tracking?.CanonicalURL} />
            {tracking?.LastInStock !== undefined && (
              <span
                className={`px-2 py-0.5 text-[13px] font-semibold ${
                  tracking.LastInStock ? "bg-teal-200 text-pine-950" : "bg-marker text-chalk"
                }`}
              >
                {tracking.LastInStock ? t.landing.inStock : t.landing.outOfStock}
              </span>
            )}
            {changePercent !== undefined && changePercent < 0 && (
              <span className="bg-teal-200 px-2 py-0.5 text-[13px] font-semibold text-pine-950">{t.detail.justDropped}</span>
            )}
            {stats90 && currentPrice && currentPrice <= stats90.lowest && (
              <span className="bg-teal-400 px-2 py-0.5 text-[13px] font-semibold text-pine-950">{t.detail.lowest90dBadge}</span>
            )}
          </div>
          <h1 className="line-clamp-3 text-[clamp(22px,2.6vw,32px)] font-bold leading-snug">{title}</h1>
          <p className="text-[15px] text-chalk/80">
            {tracking?.SellerName ? formatText(t.detail.shopLabel, { name: tracking.SellerName }) : t.detail.officialStore}
          </p>
        </div>

        <div className="lg:col-span-5">
          <PriceTag tilt={-1.5} className="mx-auto max-w-[400px]">
            <p className="text-sm font-semibold">{t.landing.priceNow}</p>
            {oldPrice && <StruckPrice className="mt-2 text-2xl">{formatVND(oldPrice)}</StruckPrice>}
            <div className="mt-1 flex flex-wrap items-end gap-3">
              <WrittenPrice className="block whitespace-nowrap text-[clamp(34px,3.6vw,48px)]">
                {currentPrice ? formatVND(currentPrice) : t.common.unknown}
              </WrittenPrice>
              {changePercent !== undefined && changePercent !== 0 && (
                <span
                  className={`mb-1 px-2 py-0.5 text-[13px] font-bold ${
                    changePercent < 0 ? "bg-teal-200 text-pine-950" : "bg-[#F8E1DC] text-marker-deep"
                  }`}
                >
                  {changePercent < 0 ? "↓" : "↑"} {Math.abs(changePercent)}%
                </span>
              )}
            </div>
          </PriceTag>
          {buyHref && (
            <a
              href={buyHref}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className="mx-auto mt-5 flex min-h-[52px] max-w-[400px] items-center justify-center gap-2 bg-teal-400 px-5 text-[17px] font-bold text-pine-950 transition-colors hover:bg-teal-300"
            >
              {formatText(t.landing.buyOn, { platform: platformName })}
              <ArrowUpRight className="h-5 w-5" />
            </a>
          )}
        </div>
      </section>

      {/* Target price and the 90-day numbers */}
      <div className="grid gap-4 lg:grid-cols-12">
        <section className="space-y-4 bg-white p-5 sm:p-6 lg:col-span-7">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-sm font-semibold text-pine-700">{t.detail.targetPrice}</span>
              <WrittenPrice className="mt-1 block text-[22px] sm:text-[28px]">
                {alertsErrorMessage ? t.common.unknown : savedTarget ? formatVND(savedTarget) : t.detail.notSet}
              </WrittenPrice>
            </div>
            <div>
              <span className="block text-sm font-semibold text-pine-700">{t.detail.distanceFromTarget}</span>
              <span className="mt-1 block text-xl font-bold text-pine-900">
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

          <div className="h-3 w-full bg-pine-50">
            <div
              className="h-full origin-left bg-teal-400 transition-[width] duration-500"
              style={{ width: `${targetProgress}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-3 text-[15px] text-pine-700">
            <span>{t.detail.targetProgress}</span>
            <button
              type="button"
              onClick={() => openTargetModal()}
              className="min-h-[44px] px-2 font-bold text-pine-900 underline-offset-4 hover:underline"
            >
              {t.detail.editTarget}
            </button>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-px bg-paper lg:col-span-5 lg:grid-cols-1">
          {statTiles.map((s) => (
            <div key={s.label} className="flex flex-col justify-center bg-white p-4 sm:p-5">
              <span className="block text-sm font-semibold text-pine-700">{s.label}</span>
              <span className="mt-1 block text-base font-bold text-pine-900 sm:text-lg">{s.value}</span>
            </div>
          ))}
        </section>
      </div>

      {/* Price history */}
      <section className="space-y-6 bg-white p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-pine-900">{t.detail.priceHistoryTitle}</h2>
            <p className="mt-0.5 text-[15px] text-pine-700">{t.detail.priceHistorySubtitle}</p>
          </div>

          <div className="flex w-fit items-center">
            {[
              { id: "7d", label: t.detail.range7d },
              { id: "30d", label: t.detail.range30d },
              { id: "90d", label: t.detail.range90d },
              { id: "all", label: t.detail.rangeAll },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-pressed={timeRange === tab.id}
                onClick={() => setTimeRange(tab.id as any)}
                className={`min-h-[44px] px-4 text-[15px] font-semibold transition-colors ${
                  timeRange === tab.id ? "bg-pine-900 text-chalk" : "bg-pine-50 text-pine-900 hover:bg-pine-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-64 w-full sm:h-80">
          {rangeError ? (
            <div className="flex h-full items-center justify-center gap-2 bg-[#F8E1DC] px-4 text-center text-[15px] text-marker-deep">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formatText(t.detail.historyRangeError, { message: rangeError })}</span>
            </div>
          ) : rangeLoading ? (
            <div className="chalk-skeleton flex h-full items-center justify-center bg-pine-50 text-[15px] text-pine-700">
              {t.common.loading}
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center bg-pine-50 px-4 text-center text-[15px] text-pine-700">
              {(timeRange === "all" ? allSnapshots : snapshots).length === 0
                ? t.detail.accumulatingData
                : t.detail.noDataInRange}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -4, bottom: 0 }}>
                <CartesianGrid stroke="#DCEBE7" vertical={false} />
                <XAxis
                  dataKey="time"
                  tick={{ fill: "#174C44", fontSize: 13 }}
                  tickLine={false}
                  axisLine={{ stroke: "#B6D6CE" }}
                />
                <YAxis
                  tick={{ fill: "#174C44", fontSize: 13 }}
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  // Zoom to the real price band (with the target in view), not from zero, so a change is visible
                  domain={[(min: number) => Math.floor(min * 0.95), (max: number) => Math.ceil(max * 1.03)]}
                  tickFormatter={(val) => formatCompactVND(val)}
                />
                <Tooltip
                  cursor={{ stroke: "#86BBAE" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="space-y-1 bg-pine-950 p-3 text-[13px] text-chalk">
                          <p className="text-chalk/75">{formatDateTime(data.rawDate)}</p>
                          <p className="font-marker text-lg font-extrabold">{formatVND(data.effectivePrice)}</p>
                          <p className="text-chalk/75">
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
                    ifOverflow="extendDomain"
                    stroke="#D9412B"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    label={{
                      value: formatText(t.detail.targetPriceLabel, {
                        price: formatCompactVND(savedTarget),
                      }),
                      fill: "#B3301D",
                      fontSize: 13,
                      position: "insideBottomRight",
                    }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="effectivePrice"
                  stroke="#1A9988"
                  strokeWidth={3}
                  fill="#3CCFB0"
                  fillOpacity={0.12}
                  dot={{ r: 3, fill: "#1A9988", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#0A3832", stroke: "#ffffff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Key prices */}
        <div className="space-y-3">
          <h3 className="text-[17px] font-bold text-pine-900">{t.detail.keyPriceMilestones}</h3>
          <div className="space-y-1">
            {[
              {
                dot: "bg-marker",
                label: t.detail.milestoneJustDropped,
                value: currentPrice ? formatVND(currentPrice) : t.common.unknown,
                note: t.detail.milestoneRecent,
              },
              {
                dot: "bg-teal-400",
                label: t.detail.milestoneLowest,
                value: stats90 ? formatVND(stats90.lowest) : t.common.unknown,
                note: t.detail.milestoneRecordedLow,
              },
              {
                dot: "bg-pine-300",
                label: t.detail.milestoneAverage,
                value: stats90 ? formatVND(stats90.average) : t.common.unknown,
                note: t.detail.milestoneMedian,
              },
            ].map((m) => (
              <div key={m.label} className="flex items-center justify-between gap-3 bg-pine-50 px-4 py-3 text-[15px]">
                <div className="flex items-center gap-2.5">
                  <span aria-hidden className={`h-2.5 w-2.5 shrink-0 ${m.dot}`} />
                  <span className="font-semibold text-pine-900">{m.label}</span>
                </div>
                <div className="flex items-baseline gap-3 text-right">
                  <span className="font-bold text-pine-900">{m.value}</span>
                  <span className="hidden text-[13px] text-pine-700 sm:inline">{m.note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Voucher tips */}
      <VoucherBox
        trackingId={idOrSourceId}
        canonicalUrl={tracking?.CanonicalURL}
        affiliateUrl={tracking?.AffiliateURL}
      />

      {/* Alerts */}
      <section className="space-y-4 bg-white p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-pine-50 text-pine-900">
              <BellRing className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-pine-900">{t.detail.smartAlertsTitle}</h2>
              <p className="text-[15px] text-pine-700">{t.detail.smartAlertsDesc}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateAlertModal(true)}
            className="inline-flex min-h-[44px] items-center gap-2 self-start bg-pine-900 px-5 text-[15px] font-bold text-chalk transition-colors hover:bg-pine-800 sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>{t.detail.addAlertBtn}</span>
          </button>
        </div>

        {alertsErrorMessage && alerts.length === 0 ? (
          <div className="flex items-center justify-between gap-2 bg-[#F8E1DC] p-4 text-[15px] text-marker-deep">
            <span className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{alertsErrorMessage}</span>
            </span>
            <button type="button" onClick={() => refetchAlerts()} className="min-h-[44px] shrink-0 px-2 font-semibold underline">
              {t.common.retry}
            </button>
          </div>
        ) : alerts.length === 0 ? (
          <div className="space-y-2 bg-pine-50 p-6 text-center">
            <p className="text-[15px] font-semibold text-pine-900">{t.detail.noAlertsTitle}</p>
            <p className="mx-auto max-w-sm text-[15px] text-pine-700">{t.detail.noAlertsDesc}</p>
            <button
              type="button"
              onClick={() => setShowCreateAlertModal(true)}
              className="mt-2 inline-flex min-h-[44px] items-center gap-2 bg-teal-400 px-5 text-[15px] font-bold text-pine-950 transition-colors hover:bg-teal-300"
            >
              <Plus className="h-4 w-4" />
              <span>{t.detail.createFirstRuleBtn}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
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
      </section>

      {/* Same product on other marketplaces */}
      <SourceComparisonSection
        trackingId={idOrSourceId}
        productId={tracking?.ProductID || idOrSourceId}
        onLinkSource={() => setShowLinkModal(true)}
      />

      {/* The one action of this page, always within reach */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[60px] z-30 mx-auto max-w-md p-4 md:bottom-4">
        <button
          type="button"
          onClick={() => openTargetModal()}
          className="pointer-events-auto flex min-h-[52px] w-full items-center justify-center gap-2 bg-pine-900 text-[15px] font-bold text-chalk transition-colors hover:bg-pine-800"
        >
          <Target className="h-5 w-5" />
          <span>{savedTarget ? t.detail.updateTargetButton : t.detail.setTargetButton}</span>
        </button>
      </div>

      {/* Target price dialog */}
      {showTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-pine-950/70 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="target-title"
            className="relative w-full max-w-md space-y-5 bg-paper p-6 shadow-2xl shadow-pine-950/30 animate-scaleUp sm:p-8" /* taste-skill-ignore: dialog overlay */
          >
            <button
              type="button"
              onClick={() => setShowTargetModal(false)}
              className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center text-pine-900 transition-colors hover:bg-white"
              aria-label={t.common.close}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="pr-10">
              <h3 id="target-title" className="text-xl font-bold text-pine-900">{t.detail.targetModalTitle}</h3>
              <p className="mt-1 text-[15px] leading-relaxed text-pine-700">{t.detail.targetModalDesc}</p>
            </div>

            <form onSubmit={handleSaveTarget} className="space-y-4">
              <div>
                <input
                  type="number"
                  step="10000"
                  required
                  value={targetInput > 0 ? targetInput : ""}
                  onChange={(e) => setTargetInput(Number(e.target.value))}
                  placeholder="6.000.000"
                  className="h-16 w-full bg-white px-4 text-center font-marker text-3xl font-extrabold text-pine-950 placeholder:text-pine-700/50 focus:outline-none"
                />
                {targetInput > 0 && (
                  <span className="mt-1 block text-center text-[13px] font-semibold text-pine-700">
                    {formatText(t.detail.displayPrice, { price: formatVND(targetInput) })}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleQuickPercent(pct)}
                    disabled={!currentPrice}
                    className="min-h-[44px] bg-white text-[15px] font-bold text-pine-900 transition-colors hover:bg-pine-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    -{pct}%
                  </button>
                ))}
              </div>

              {targetError && <p className="bg-[#F8E1DC] p-3 text-[15px] text-marker-deep">{targetError}</p>}

              <button
                type="submit"
                disabled={savingTarget}
                className="min-h-[52px] w-full bg-teal-400 text-[15px] font-bold text-pine-950 transition-colors hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingTarget ? t.common.loading : t.detail.startTrackingBtn}
              </button>
            </form>

            <div className="flex items-start gap-3 bg-kraft-light p-4 text-[15px] text-kraft-ink">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <span className="mb-0.5 block font-bold">{t.detail.tipTitle}</span>
                <span className="block leading-relaxed">{t.detail.tipDesc}</span>
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
