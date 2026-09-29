"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  listTrackings,
  pauseTracking,
  resumeTracking,
  getPriceHistory,
  TrackedProduct,
  PriceSnapshot,
} from "@/lib/api";
import { formatVND, formatRelativeTime, calculatePriceStats } from "@/lib/formatting";
import { PlatformBadge, StatusBadge } from "@/components/ui/Badge";
import { PriceChangePill } from "@/components/ui/PriceChangePill";
import { Sparkline } from "@/components/ui/Sparkline";
import { TrackingListSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Plus,
  Search,
  ArrowRight,
  Pause,
  Play,
  Clock,
  Filter,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface EnrichedCardData extends TrackedProduct {
  snapshots?: PriceSnapshot[];
  currentPrice?: number;
  changePercent?: number;
  sparklineData?: number[];
}

export default function MyTrackingPage() {
  const [trackings, setTrackings] = useState<EnrichedCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "active" | "paused" | "dropped">("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchTrackings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listTrackings();

      // For each tracking, attempt to fetch recent price snapshots to compute sparkline & price changes
      const enriched: EnrichedCardData[] = await Promise.all(
        data.map(async (item) => {
          let snapshots: PriceSnapshot[] = [];
          try {
            snapshots = await getPriceHistory(item.ProductSourceID || item.ID);
          } catch {
            // gracefully fallback to no snapshots
          }

          const stats = calculatePriceStats(snapshots);
          const currentPrice =
            item.LastEffectivePrice ||
            item.LastPrice ||
            (stats ? stats.current : undefined);
          const changePercent = stats ? stats.changePercent : 0;
          const sparklineData = snapshots.map((s) => s.EffectivePrice || s.Price);

          return {
            ...item,
            snapshots,
            currentPrice,
            changePercent,
            sparklineData,
          };
        })
      );

      setTrackings(enriched);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách theo dõi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackings();
  }, []);

  const handleToggle = async (id: string, currentlyActive: boolean) => {
    setTogglingId(id);
    setActionError(null);

    // Optimistic UI update
    setTrackings((prev) =>
      prev.map((item) => (item.ID === id ? { ...item, Active: !currentlyActive } : item))
    );

    try {
      if (currentlyActive) {
        await pauseTracking(id);
      } else {
        await resumeTracking(id);
      }
    } catch (err: any) {
      setActionError(err.message || "Thao tác thất bại");
      // Revert optimistic update
      setTrackings((prev) =>
        prev.map((item) => (item.ID === id ? { ...item, Active: currentlyActive } : item))
      );
    } finally {
      setTogglingId(null);
    }
  };

  // Filtered and searched trackings
  const filteredTrackings = useMemo(() => {
    return trackings.filter((item) => {
      // 1. Tab filter
      if (filterTab === "active" && !item.Active) return false;
      if (filterTab === "paused" && item.Active) return false;
      if (filterTab === "dropped" && (item.changePercent || 0) >= 0) return false;

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (item.Title || "").toLowerCase().includes(q);
        const platformMatch = (item.Platform || "").toLowerCase().includes(q);
        const urlMatch = (item.CanonicalURL || "").toLowerCase().includes(q);
        const idMatch = item.ProductSourceID.toLowerCase().includes(q);
        return titleMatch || platformMatch || urlMatch || idMatch;
      }

      return true;
    });
  }, [trackings, filterTab, searchQuery]);

  return (
    <div className="py-4 sm:py-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Sản phẩm đang theo dõi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Hệ thống tự động theo dõi biến động giá và ghi lại lịch sử snapshot mỗi 30 phút.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-all hover:shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Theo dõi thêm</span>
        </Link>
      </div>

      {/* Action error banner */}
      {actionError && (
        <div className="mb-4 p-3.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-xs font-semibold text-rose-600 hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 bg-white border border-slate-200/90 rounded-2xl p-2 shadow-xs">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "Tất cả", count: trackings.length },
            {
              id: "active",
              label: "Đang quét",
              count: trackings.filter((t) => t.Active).length,
            },
            {
              id: "dropped",
              label: "Giá giảm",
              count: trackings.filter((t) => (t.changePercent || 0) < 0).length,
            },
            {
              id: "paused",
              label: "Tạm dừng",
              count: trackings.filter((t) => !t.Active).length,
            },
          ].map((tab) => {
            const isSelected = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-indigo-50 text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? "bg-indigo-200/70 text-indigo-800"
                      : "bg-slate-200/60 text-slate-500"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px] sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, sàn..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <TrackingListSkeleton />
      ) : error ? (
        <div className="p-6 bg-rose-50 text-rose-700 border border-rose-200 rounded-2xl text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="font-bold text-sm mb-1">Không thể tải dữ liệu</p>
          <p className="text-xs text-rose-600/90 mb-4">{error}</p>
          <button
            type="button"
            onClick={fetchTrackings}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      ) : filteredTrackings.length === 0 ? (
        <EmptyState
          title={
            trackings.length === 0
              ? "Chưa có sản phẩm nào được theo dõi"
              : "Không tìm thấy sản phẩm phù hợp"
          }
          description={
            trackings.length === 0
              ? "Hãy dán đường link sản phẩm từ Shopee, Lazada hoặc TikTok để hệ thống tự động ghi nhận lịch sử giá."
              : "Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc khác để xem danh sách sản phẩm."
          }
          actionText={trackings.length === 0 ? "Theo dõi sản phẩm đầu tiên" : "Xem tất cả sản phẩm"}
          actionHref={trackings.length === 0 ? "/" : "/tracking"}
          onSampleClick={trackings.length !== 0 ? () => setFilterTab("all") : undefined}
        />
      ) : (
        /* Cards Grid */
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredTrackings.map((t) => {
            const hasPrice = t.currentPrice !== undefined && t.currentPrice > 0;
            const isToggling = togglingId === t.ID;

            return (
              <div
                key={t.ID}
                className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar: Platform + Status + Scan Interval */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <PlatformBadge platformOrUrl={t.Platform || t.CanonicalURL} />
                      <StatusBadge active={t.Active} />
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Mỗi {Math.round(t.PollingIntervalSeconds / 60)}p
                    </span>
                  </div>

                  {/* Product Title */}
                  <Link href={`/tracking/${t.ProductSourceID || t.ID}`} className="block">
                    <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 hover:text-indigo-600 transition-colors mb-2">
                      {t.Title || (t.CanonicalURL ? t.CanonicalURL.split("/").pop() : `Sản phẩm ${t.ProductSourceID.slice(0, 8)}`)}
                    </h3>
                  </Link>

                  {/* Price & Sparkline Area */}
                  <div className="flex items-baseline justify-between gap-3 mt-3 pt-3 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider mb-0.5">
                        Giá thực tế gần nhất
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-extrabold text-slate-900">
                          {hasPrice ? formatVND(t.currentPrice) : "Đang chờ quét..."}
                        </span>
                        {hasPrice && t.changePercent !== undefined && (
                          <PriceChangePill changePercent={t.changePercent} />
                        )}
                      </div>
                    </div>

                    {/* Mini Sparkline trajectory */}
                    {t.sparklineData && t.sparklineData.length > 1 && (
                      <div className="hidden sm:block">
                        <Sparkline data={t.sparklineData} width={100} height={32} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Footer: Next Scan / Relative Time & Controls */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400">
                    <span>Cập nhật: {formatRelativeTime(t.UpdatedAt || t.CreatedAt)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isToggling}
                      onClick={() => handleToggle(t.ID, t.Active)}
                      className={`text-xs px-2.5 py-1.5 rounded-xl font-medium transition-colors flex items-center gap-1 ${
                        t.Active
                          ? "bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600"
                          : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {t.Active ? (
                        <>
                          <Pause className="w-3 h-3" />
                          <span className="hidden sm:inline">Tạm dừng</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3" />
                          <span className="hidden sm:inline">Tiếp tục</span>
                        </>
                      )}
                    </button>

                    <Link
                      href={`/tracking/${t.ProductSourceID || t.ID}`}
                      className="text-xs px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl transition-colors flex items-center gap-1"
                    >
                      <span>Biểu đồ</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
