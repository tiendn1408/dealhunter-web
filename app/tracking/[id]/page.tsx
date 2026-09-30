"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  createAlert,
  AlertRule,
  PriceSnapshot,
  TrackedProduct,
} from "@/lib/api";
import { useTracking, usePriceHistory, useAlerts } from "@/lib/hooks";
import { CreateAlertModal } from "@/components/alerts/CreateAlertModal";
import { ActiveAlertCard } from "@/components/alerts/ActiveAlertCard";
import { SourceComparisonSection } from "@/components/comparison/SourceComparisonSection";
import { LinkSourceModal } from "@/components/comparison/LinkSourceModal";
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

  const { data: tracking, isLoading: trackingLoading, error: trackingError } = useTracking(idOrSourceId);
  const { data: snapshots = [], isLoading: priceLoading, error: priceError } = usePriceHistory(idOrSourceId);
  const { data: alertsData = [], refetch: refetchAlerts } = useAlerts(idOrSourceId);

  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("90d");
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showCreateAlertModal, setShowCreateAlertModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [targetInput, setTargetInput] = useState<number>(6000000);
  const [savedTarget, setSavedTarget] = useState<number | null>(null);
  const [copyNotice, setCopyNotice] = useState(false);

  const loading = trackingLoading || priceLoading;
  const error = trackingError
    ? (trackingError as Error).message
    : priceError
    ? (priceError as Error).message
    : null;

  useEffect(() => {
    if (alertsData.length > 0) {
      setAlerts(alertsData);
      const targetRule = alertsData.find(
        (r) => r.rule_type === "target_price" && r.active
      );
      if (targetRule) {
        setSavedTarget(targetRule.threshold_value);
        setTargetInput(targetRule.threshold_value);
        return;
      }
    }

    try {
      const raw = localStorage.getItem("deal-hunter-targets") || localStorage.getItem("dealhunter_targets");
      if (raw) {
        const store = JSON.parse(raw);
        if (store[idOrSourceId] && !savedTarget) {
          setSavedTarget(store[idOrSourceId]);
          setTargetInput(store[idOrSourceId]);
        }
      }
    } catch {}
  }, [alertsData, idOrSourceId, savedTarget]);

  const stats = useMemo(() => {
    return calculatePriceStats(snapshots);
  }, [snapshots]);

  const currentPrice =
    tracking?.LastEffectivePrice ||
    tracking?.LastPrice ||
    (stats ? stats.current : 6190000);

  const oldPrice =
    stats && stats.highest > currentPrice
      ? stats.highest
      : Math.round(currentPrice * 1.14);

  const changePercent = stats ? stats.changePercent : -12.7;

  // Set default target if not set
  useEffect(() => {
    if (currentPrice && !savedTarget) {
      const defTarget = Math.round(currentPrice * 0.95);
      setSavedTarget(defTarget);
      setTargetInput(defTarget);
    }
  }, [currentPrice, savedTarget]);

  // Handle saving target price (Screen 8)
  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInput || targetInput <= 0) return;

    setSavedTarget(targetInput);
    try {
      const raw = localStorage.getItem("deal-hunter-targets") || localStorage.getItem("dealhunter_targets");
      const store = raw ? JSON.parse(raw) : {};
      store[idOrSourceId] = targetInput;
      if (tracking?.ProductSourceID) store[tracking.ProductSourceID] = targetInput;
      if (tracking?.ID) store[tracking.ID] = targetInput;
      localStorage.setItem("deal-hunter-targets", JSON.stringify(store));

      // Persist to backend alert rules as target_price rule
      createAlert(idOrSourceId, {
        rule_type: "target_price",
        threshold_value: targetInput,
        expires_in_days: 60,
      })
        .then((newRule) => {
          setAlerts((prev) => [
            newRule,
            ...prev.filter((r) => r.rule_type !== "target_price"),
          ]);
          refetchAlerts();
        })
        .catch(() => {});
    } catch {}

    setShowTargetModal(false);
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
        title: tracking?.Title || "Deal Hunter",
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

  const diffFromTarget = savedTarget && currentPrice ? Math.max(0, currentPrice - savedTarget) : 0;
  const targetProgress = useMemo(() => {
    if (!savedTarget || !currentPrice || !oldPrice || oldPrice <= savedTarget) return 65;
    const drop = oldPrice - currentPrice;
    const total = oldPrice - savedTarget;
    return Math.min(100, Math.max(10, Math.round((drop / total) * 100)));
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
          title="Quay lại danh sách"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="flex items-center gap-2">
          {copyNotice && (
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
              Đã sao chép link!
            </span>
          )}
          <button
            type="button"
            onClick={handleShare}
            className="p-2 text-slate-500 hover:text-pine-900 hover:bg-slate-100 rounded-full transition-colors"
            title="Chia sẻ sản phẩm"
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
            {tracking?.Title || "Tai nghe Sony WH-1000XM6"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal">
            Tai nghe chống ồn cao cấp · {tracking?.SellerName ? `Shop: ${tracking.SellerName}` : "Chính hãng"}
          </p>
          <div className="pt-1 flex items-center gap-2 flex-wrap">
            <PlatformBadge platformOrUrl={tracking?.Platform || tracking?.CanonicalURL} />
            {tracking?.CanonicalURL && (
              <a
                href={tracking.CanonicalURL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-pine-900 hover:underline"
              >
                <span>Mở trang sàn gốc</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Price Row matching Screen 6 */}
        <div className="pt-2 border-t border-slate-100 flex items-baseline gap-3">
          <span className="text-3xl sm:text-4xl font-black text-pine-900">
            {formatVND(currentPrice)}
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
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            Vừa giảm
          </span>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Giá thấp nhất 90 ngày
          </span>
        </div>

        {/* Target Price Card matching Screen 6 */}
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                Giá mục tiêu
              </span>
              <span className="text-sm sm:text-base font-black text-slate-800">
                {savedTarget ? formatVND(savedTarget) : "Chưa đặt"}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                Còn cách
              </span>
              <span className="text-sm sm:text-base font-black text-pine-900">
                {formatVND(diffFromTarget)}
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
            <span>Tiến độ đạt mức mong muốn</span>
            <button
              type="button"
              onClick={() => setShowTargetModal(true)}
              className="font-bold text-pine-900 hover:underline"
            >
              Chỉnh sửa mục tiêu
            </button>
          </div>
        </div>

        {/* 2-Column Stats matching Screen 6 */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider mb-1">
              Thấp nhất 90 ngày
            </span>
            <span className="text-base font-extrabold text-slate-900 block">
              {stats ? formatVND(stats.lowest) : "6.050.000đ"}
            </span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider mb-1">
              Trung bình 90 ngày
            </span>
            <span className="text-base font-extrabold text-slate-900 block">
              {stats ? formatVND(stats.average) : "7.090.000đ"}
            </span>
          </div>
        </div>
      </div>

      {/* 2.5 CẢNH BÁO GIÁ THÔNG MINH (Phase 2) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-pine-50 text-pine-900 flex items-center justify-center shrink-0">
              <BellRing className="w-5 h-5 text-pine-900" />
            </div>
            <div>
              <h2 className="text-lg font-black text-pine-900 tracking-tight">
                Cảnh báo giá thông minh
              </h2>
              <p className="text-xs text-slate-500">
                Nhận tin nhắn Zalo OA & thông báo app khi biến động giá
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateAlertModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-pine-900 hover:bg-pine-950 text-white rounded-full text-xs font-semibold shadow-2xs transition-all self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm cảnh báo</span>
          </button>
        </div>

        {alerts.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
            <p className="text-xs text-slate-600 font-medium">
              Chưa có quy tắc cảnh báo nào cho sản phẩm này.
            </p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Thiết lập quy tắc giảm theo %, giá đích hoặc chạm đáy lịch sử để hệ thống tự động báo qua Zalo và Feed thông báo.
            </p>
            <button
              type="button"
              onClick={() => setShowCreateAlertModal(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-pine-900 bg-white border border-slate-200 rounded-full hover:bg-pine-50 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Tạo quy tắc đầu tiên</span>
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
              Lịch sử giá
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Biểu đồ và các mốc giá quan trọng đã ghi nhận
            </p>
          </div>

          {/* Time range tabs matching Screen 7 */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full w-fit">
            {[
              { id: "7d", label: "7 ngày" },
              { id: "30d", label: "30 ngày" },
              { id: "90d", label: "90 ngày" },
              { id: "all", label: "Tất cả" },
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
              Đang tích lũy dữ liệu snapshot theo thời gian...
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
                            Giá niêm yết: {formatVND(data.rawPrice)}
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
                      value: `Giá mục tiêu: ${formatCompactVND(savedTarget)}`,
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
              Thấp nhất 90 ngày
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 block mt-0.5">
              {stats ? formatVND(stats.lowest) : "6.050.000đ"}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase">
              Trung bình 90 ngày
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 block mt-0.5">
              {stats ? formatVND(stats.average) : "7.090.000đ"}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase">
              Cao nhất 90 ngày
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 block mt-0.5">
              {stats ? formatVND(stats.highest) : "7.490.000đ"}
            </span>
          </div>
        </div>

        {/* Các mốc giá quan trọng matching Screen 7 */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Các mốc giá quan trọng
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="font-semibold text-slate-800">Vừa giảm giá</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-pine-900">{formatVND(currentPrice)}</span>
                <span className="text-[10px] text-slate-400">Gần nhất</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-slate-800">Giá thấp nhất 90 ngày</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-pine-900">
                  {stats ? formatVND(stats.lowest) : "6.050.000đ"}
                </span>
                <span className="text-[10px] text-slate-400">Đáy ghi nhận</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="font-semibold text-slate-800">Giá trung bình 90 ngày</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-700">
                  {stats ? formatVND(stats.average) : "7.090.000đ"}
                </span>
                <span className="text-[10px] text-slate-400">Trung vị</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. STICKY BOTTOM BUTTON matching Screen 6 in mobile.png */}
      <div className="fixed bottom-14 md:bottom-6 left-0 right-0 p-4 max-w-md mx-auto pointer-events-none z-30">
        <button
          type="button"
          onClick={() => setShowTargetModal(true)}
          className="w-full py-3.5 bg-pine-900 hover:bg-pine-950 text-white font-bold rounded-full text-sm shadow-xl pointer-events-auto transition-all flex items-center justify-center gap-2"
        >
          <Target className="w-4 h-4" />
          <span>{savedTarget ? "Cập nhật giá mục tiêu" : "Đặt giá mục tiêu"}</span>
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
                Đặt giá mục tiêu
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Khi giá chạm mức bạn muốn, Deal Hunter sẽ thông báo cho bạn.
              </p>
            </div>

            <form onSubmit={handleSaveTarget} className="space-y-4">
              <div className="relative">
                <input
                  type="number"
                  step="10000"
                  required
                  value={targetInput}
                  onChange={(e) => setTargetInput(Number(e.target.value))}
                  placeholder="6.000.000"
                  className="w-full px-4 py-3.5 text-2xl font-black rounded-2xl border border-slate-200 bg-slate-50 text-pine-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pine-900/10 focus:border-pine-900 text-center"
                />
                <span className="text-xs font-semibold text-slate-400 block text-center mt-1">
                  Giá hiển thị: {formatVND(targetInput)}
                </span>
              </div>

              {/* Quick discount pills (-5%, -10%, -15%, -20%) matching Screen 8 */}
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleQuickPercent(pct)}
                    className="py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-pine-50 hover:border-pine-300 text-xs font-bold text-slate-700 hover:text-pine-900 transition-colors"
                  >
                    -{pct}%
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-pine-900 hover:bg-pine-950 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-xs transition-all"
              >
                Bắt đầu theo dõi
              </button>
            </form>

            {/* Gợi ý card matching Screen 8 */}
            <div className="bg-pine-50/80 border border-pine-100 rounded-2xl p-3.5 text-xs text-pine-900 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-pine-800 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">Gợi ý</span>
                <span className="text-slate-600 leading-relaxed block">
                  Mức giá mục tiêu thường thấp hơn 5–15% so với giá hiện tại để bắt được các đợt flash sale tốt nhất.
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
        currentPrice={currentPrice}
        onAlertCreated={(newRule) => {
          setAlerts((prev) => [newRule, ...prev]);
          if (newRule.rule_type === "target_price") {
            setSavedTarget(newRule.threshold_value);
            setTargetInput(newRule.threshold_value);
          }
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
