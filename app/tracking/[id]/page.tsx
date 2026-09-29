"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  getPriceHistory,
  getTracking,
  pauseTracking,
  resumeTracking,
  PriceSnapshot,
  TrackedProduct,
} from "@/lib/api";
import {
  formatVND,
  formatCompactVND,
  formatDateTime,
  formatRelativeTime,
  calculatePriceStats,
} from "@/lib/formatting";
import { PlatformBadge, StatusBadge } from "@/components/ui/Badge";
import { PriceChangePill } from "@/components/ui/PriceChangePill";
import { DetailSkeleton } from "@/components/ui/LoadingSkeleton";
import {
  LineChart,
  Line,
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
  ExternalLink,
  Pause,
  Play,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Award,
  Calendar,
  AlertCircle,
  PackageCheck,
  PackageX,
  Clock,
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const idOrSourceId = params.id as string;

  const [tracking, setTracking] = useState<TrackedProduct | null>(null);
  const [snapshots, setSnapshots] = useState<PriceSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("30d");
  const [toggling, setToggling] = useState(false);

  const fetchData = async (isManualRefresh = false) => {
    if (!idOrSourceId) return;

    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch tracking info and snapshot history concurrently
      const [trackingRes, priceRes] = await Promise.allSettled([
        getTracking(idOrSourceId),
        getPriceHistory(idOrSourceId),
      ]);

      if (trackingRes.status === "fulfilled") {
        setTracking(trackingRes.value);
      }
      if (priceRes.status === "fulfilled") {
        setSnapshots(priceRes.value);
      } else {
        // If price fetch failed
        console.warn("Could not fetch price history:", priceRes.reason);
      }
    } catch (err: any) {
      setError(err.message || "Lỗi tải thông tin sản phẩm");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [idOrSourceId]);

  const handleToggleTracking = async () => {
    if (!tracking) return;
    setToggling(true);
    const nextState = !tracking.Active;
    try {
      if (tracking.Active) {
        await pauseTracking(tracking.ID);
      } else {
        await resumeTracking(tracking.ID);
      }
      setTracking({ ...tracking, Active: nextState });
    } catch (err: any) {
      alert("Thao tác thất bại: " + err.message);
    } finally {
      setToggling(false);
    }
  };

  // Filter snapshots based on selected time range
  const filteredSnapshots = useMemo(() => {
    if (!snapshots || snapshots.length === 0) return [];
    if (timeRange === "all") return snapshots;

    const now = Date.now();
    const days = timeRange === "7d" ? 7 : 30;
    const cutoff = now - days * 24 * 60 * 60 * 1000;

    const filtered = snapshots.filter((s) => new Date(s.CapturedAt).getTime() >= cutoff);
    return filtered.length > 0 ? filtered : snapshots; // fallback to full list if range empty
  }, [snapshots, timeRange]);

  // Compute key price statistics
  const stats = useMemo(() => {
    return calculatePriceStats(snapshots);
  }, [snapshots]);

  const latestSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  const currentPrice =
    latestSnapshot?.EffectivePrice ||
    tracking?.LastEffectivePrice ||
    latestSnapshot?.Price ||
    tracking?.LastPrice;

  // Prepare chart series
  const chartData = useMemo(() => {
    return filteredSnapshots.map((s) => ({
      time: new Date(s.CapturedAt).toLocaleDateString("vi-VN", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      rawDate: s.CapturedAt,
      effectivePrice: s.EffectivePrice || s.Price,
      rawPrice: s.Price,
      shipping: s.ShippingFee,
      inStock: s.InStock,
    }));
  }, [filteredSnapshots]);

  if (loading) {
    return (
      <div className="py-6">
        <DetailSkeleton />
      </div>
    );
  }

  return (
    <div className="py-4 sm:py-6 space-y-6">
      {/* Top Back Navigation & Actions */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/tracking"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Danh sách theo dõi</span>
        </Link>

        <button
          type="button"
          disabled={refreshing}
          onClick={() => fetchData(true)}
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs transition-all hover:bg-slate-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-indigo-600" : ""}`} />
          <span>{refreshing ? "Đang tải..." : "Làm mới"}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-2xl text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Hero Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          {/* Product Meta Left */}
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <PlatformBadge
                platformOrUrl={tracking?.Platform || tracking?.CanonicalURL}
              />
              {tracking && <StatusBadge active={tracking.Active} />}
              {tracking?.SellerName && (
                <span className="text-xs text-slate-400 font-medium">
                  Shop: <span className="text-slate-600 font-semibold">{tracking.SellerName}</span>
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 leading-tight">
              {tracking?.Title || "Sản phẩm theo dõi giá"}
            </h1>

            {tracking?.CanonicalURL && (
              <a
                href={tracking.CanonicalURL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold hover:underline"
              >
                <span>Xem trên trang thương mại điện tử gốc</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Current Price Right */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 sm:min-w-[260px] text-left sm:text-right">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Giá thực tế hiện tại
            </span>
            <div className="text-3xl sm:text-4xl font-black text-indigo-600 tracking-tight">
              {currentPrice ? formatVND(currentPrice) : "Đang chờ quét..."}
            </div>

            {/* Price change pill */}
            {stats && (
              <div className="mt-2 flex items-center sm:justify-end gap-1.5">
                <PriceChangePill
                  changePercent={stats.changePercent}
                  labelPrefix="So với lúc theo dõi: "
                />
              </div>
            )}

            {/* Price breakdown */}
            {latestSnapshot && (
              <p className="text-[11px] text-slate-500 mt-2">
                Giá niêm yết: {formatVND(latestSnapshot.Price)} · Ship:{" "}
                {formatVND(latestSnapshot.ShippingFee)}
              </p>
            )}

            {/* Tracking control toggle button */}
            {tracking && (
              <div className="mt-4 pt-3 border-t border-slate-200/80 flex sm:justify-end">
                <button
                  type="button"
                  disabled={toggling}
                  onClick={handleToggleTracking}
                  className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 shadow-xs ${
                    tracking.Active
                      ? "bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-700 border border-slate-200"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  {tracking.Active ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Tạm dừng theo dõi</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Tiếp tục theo dõi</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historical Summary 4-Stat Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* 1. Lowest */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Thấp nhất đã ghi nhận
            </span>
            <div className="text-lg sm:text-xl font-extrabold text-emerald-600">
              {formatVND(stats.lowest)}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {stats.isAtLowest ? "Đang ở đáy giá! 🎉" : `Thấp hơn hiện tại ${formatVND(stats.diffFromLowest)}`}
            </span>
          </div>

          {/* 2. Average */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Giá trung bình
            </span>
            <div className="text-lg sm:text-xl font-extrabold text-slate-800">
              {formatVND(stats.average)}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {stats.current <= stats.average ? "Thấp hơn trung bình" : "Cao hơn trung bình"}
            </span>
          </div>

          {/* 3. Highest */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Cao nhất đã ghi nhận
            </span>
            <div className="text-lg sm:text-xl font-extrabold text-slate-800">
              {formatVND(stats.highest)}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Chênh lệch đỉnh {formatVND(stats.highest - stats.lowest)}
            </span>
          </div>

          {/* 4. Current Context */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Lần quét gần nhất
            </span>
            <div className="text-lg sm:text-xl font-extrabold text-slate-900">
              {formatRelativeTime(latestSnapshot?.CapturedAt || tracking?.UpdatedAt)}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Chu kỳ 30 phút/lần</span>
            </span>
          </div>
        </div>
      )}

      {/* Price Chart Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Biểu đồ Lịch sử Biến động Giá
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Đường biểu diễn giá thực tế (bao gồm tiền ship) theo thời gian
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
            {[
              { id: "7d", label: "7 Ngày" },
              { id: "30d", label: "30 Ngày" },
              { id: "all", label: "Tất cả" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTimeRange(tab.id as any)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  timeRange === tab.id
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs sm:text-sm bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center">
            <Clock className="w-8 h-8 text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600 mb-1">Đang chờ lần quét đầu tiên</p>
            <p className="text-slate-400 max-w-sm">
              Hệ thống worker đang chạy trong nền và sẽ tự động cập nhật snapshot giá sau ít phút.
            </p>
          </div>
        ) : (
          <div className="h-72 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickFormatter={(val) => formatCompactVND(val)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white rounded-2xl p-3.5 shadow-xl text-xs space-y-1.5 border border-slate-800">
                          <p className="text-slate-400 text-[10px]">
                            {formatDateTime(data.rawDate)}
                          </p>
                          <p className="text-base font-black text-indigo-300">
                            {formatVND(data.effectivePrice)}
                          </p>
                          <div className="pt-1.5 border-t border-slate-800 text-[11px] space-y-0.5 text-slate-300">
                            <p>Giá niêm yết: {formatVND(data.rawPrice)}</p>
                            <p>Phí vận chuyển: {formatVND(data.shipping)}</p>
                            <p className="flex items-center gap-1 mt-1 text-emerald-400">
                              <PackageCheck className="w-3 h-3" />
                              <span>{data.inStock ? "Còn hàng" : "Hết hàng"}</span>
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {stats && stats.lowest > 0 && (
                  <ReferenceLine
                    y={stats.lowest}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    label={{
                      value: `Đáy: ${formatCompactVND(stats.lowest)}`,
                      fill: "#059669",
                      fontSize: 10,
                      position: "insideBottomRight",
                    }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="effectivePrice"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#priceGradient)"
                  dot={{ r: 3, fill: "#4f46e5" }}
                  activeDot={{ r: 6, fill: "#4f46e5", stroke: "#ffffff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Snapshot History Table */}
      {snapshots.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Lịch sử các lần quét giá</h3>
              <p className="text-xs text-slate-500">
                10 snapshot giá gần đây nhất được ghi nhận bởi worker
              </p>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Tổng {snapshots.length} lần quét
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-2">Thời gian</th>
                  <th className="py-3 px-2">Giá niêm yết</th>
                  <th className="py-3 px-2">Phí ship</th>
                  <th className="py-3 px-2 font-bold text-slate-700">Giá thực tế</th>
                  <th className="py-3 px-2 text-right">Tình trạng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-normal">
                {snapshots
                  .slice(-10)
                  .reverse()
                  .map((s) => (
                    <tr key={s.ID} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-2">
                        <span className="font-semibold text-slate-900 block">
                          {formatDateTime(s.CapturedAt)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatRelativeTime(s.CapturedAt)}
                        </span>
                      </td>
                      <td className="py-3 px-2">{formatVND(s.Price)}</td>
                      <td className="py-3 px-2">{formatVND(s.ShippingFee)}</td>
                      <td className="py-3 px-2 font-bold text-indigo-600 text-sm">
                        {formatVND(s.EffectivePrice)}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {s.InStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Còn hàng
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Tạm hết hàng
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
