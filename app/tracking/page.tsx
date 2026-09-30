"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  useEnrichedTrackings,
  useToggleTracking,
  useHasUnreadNotifications,
  EnrichedTrackingCard,
} from "@/lib/hooks";
import { formatVND, formatRelativeTime } from "@/lib/formatting";
import { PlatformBadge } from "@/components/ui/Badge";
import { TrackingListSkeleton } from "@/components/ui/LoadingSkeleton";
import {
  Bookmark,
  Bell,
  Search,
  ChevronRight,
  TrendingDown,
  Clock,
  Plus,
  ArrowRight,
  Target,
  Pause,
  Play,
  AlertCircle,
} from "lucide-react";

export default function MyTrackingPage() {
  const { data: trackings = [], isLoading: loading, error: queryError, refetch } = useEnrichedTrackings();
  const toggleMutation = useToggleTracking();
  const { data: hasUnread = false } = useHasUnreadNotifications();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "dropped" | "target">("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const error = queryError ? (queryError as Error).message : null;

  const handleToggle = async (e: React.MouseEvent, id: string, currentlyActive: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setTogglingId(id);

    try {
      await toggleMutation.mutateAsync({ id, currentlyActive });
    } catch (err: any) {
      alert("Thao tác thất bại: " + err.message);
    } finally {
      setTogglingId(null);
    }
  };

  const filteredTrackings = useMemo(() => {
    return trackings.filter((item) => {
      if (filterTab === "dropped" && (item.changePercent || 0) >= 0) return false;
      if (filterTab === "target" && (item.diffFromTarget || 0) > 300000) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (item.Title || "").toLowerCase().includes(q);
        const platformMatch = (item.Platform || "").toLowerCase().includes(q);
        const urlMatch = (item.CanonicalURL || "").toLowerCase().includes(q);
        return titleMatch || platformMatch || urlMatch;
      }

      return true;
    });
  }, [trackings, filterTab, searchQuery]);

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 space-y-6">
      {/* Header matching Screen 5 in mobile.png */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-pine-900 tracking-tight">
            Đang theo dõi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {trackings.length > 0
              ? `${trackings.length} sản phẩm đang được cập nhật giá`
              : "0 sản phẩm"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-pine-900 hover:bg-pine-950 text-white text-xs font-semibold shadow-2xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Theo dõi thêm</span>
          </Link>

          <Link
            href="/notifications"
            className="p-2 text-slate-500 hover:text-pine-900 hover:bg-slate-100 rounded-full transition-colors relative"
            title="Xem thông báo"
          >
            <Bell className="w-4 h-4" />
            {hasUnread && (
              <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5 animate-pulse" />
            )}
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "Tất cả", count: trackings.length },
            {
              id: "dropped",
              label: "Giá giảm",
              count: trackings.filter((t) => (t.changePercent || 0) < 0).length,
            },
            {
              id: "target",
              label: "Gần mục tiêu",
              count: trackings.filter((t) => (t.diffFromTarget || 0) <= 300000).length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                filterTab === tab.id
                  ? "bg-pine-900 text-white shadow-2xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 rounded-full ${
                  filterTab === tab.id
                    ? "bg-pine-800 text-pine-100"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm sản phẩm theo dõi..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-pine-900/10 focus:border-pine-900 text-slate-800 placeholder-slate-400 shadow-2xs"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <TrackingListSkeleton />
      ) : error ? (
        <div className="p-6 bg-rose-50 text-rose-700 border border-rose-200 rounded-3xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-xs sm:text-sm font-semibold">{error}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 bg-rose-600 text-white rounded-full text-xs font-semibold hover:bg-rose-700"
          >
            Thử lại
          </button>
        </div>
      ) : filteredTrackings.length === 0 ? (
        /* Empty State matching Screen 21 & Document specifications */
        <div className="bg-white border border-slate-200/90 rounded-3xl p-10 sm:p-14 text-center max-w-lg mx-auto shadow-2xs space-y-4">
          <div className="w-16 h-16 rounded-full bg-pine-50 border border-pine-100 text-pine-800 flex items-center justify-center mx-auto">
            <Bookmark className="w-7 h-7 text-pine-800" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-pine-900">
              {trackings.length === 0
                ? "Bạn chưa theo dõi sản phẩm nào"
                : "Không tìm thấy sản phẩm phù hợp"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
              {trackings.length === 0
                ? "Dán đường link từ Shopee, Lazada hoặc TikTok Shop để bắt đầu lưu lại lịch sử biến động giá."
                : "Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc Tất cả."}
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-pine-900 hover:bg-pine-950 text-white rounded-full text-xs sm:text-sm font-semibold shadow-2xs transition-all"
          >
            <span>{trackings.length === 0 ? "Theo dõi giá" : "Về trang chủ"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        /* Product Cards matching Screen 5 in mobile.png */
        <div className="grid grid-cols-1 gap-4">
          {filteredTrackings.map((t) => {
            const hasPrice = t.currentPrice !== undefined && t.currentPrice > 0;
            const detailHref = `/tracking/${t.ProductSourceID || t.ID}`;

            return (
              <Link
                key={t.ID}
                href={detailHref}
                className="block bg-white border border-slate-200/90 hover:border-pine-300 rounded-3xl p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-all group"
              >
                {/* Row 1: Image, Title, Status, Platform */}
                <div className="flex items-start gap-4">
                  {/* Product Image Box */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden text-slate-700">
                    <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
                    </svg>
                  </div>

                  {/* Title & Platform */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <PlatformBadge platformOrUrl={t.Platform || t.CanonicalURL} />
                        {Boolean(
                          (t.ProductID && trackings.filter((item) => item.ProductID === t.ProductID).length > 1) ||
                          !t.IsPrimary
                        ) && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                            Đa sàn
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-pine-50 text-pine-900 border border-pine-100">
                        {t.Active ? "Đang theo dõi" : "Tạm dừng"}
                      </span>
                    </div>

                    <h2 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-pine-900 transition-colors line-clamp-1">
                      {t.Title || (t.CanonicalURL ? t.CanonicalURL.split("/").pop() : "Sản phẩm theo dõi giá")}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {t.SellerName ? `Shop: ${t.SellerName}` : "Hệ thống kiểm tra tự động"}
                    </p>
                  </div>
                </div>

                {/* Row 2: Price row with Strikethrough & Drop % */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline gap-2.5">
                  <span className="text-2xl font-black text-pine-900">
                    {hasPrice ? formatVND(t.currentPrice) : "Đang kiểm tra..."}
                  </span>
                  {t.oldPrice && (
                    <span className="text-xs text-slate-400 line-through">
                      {formatVND(t.oldPrice)}
                    </span>
                  )}
                  {t.changePercent !== undefined && (
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                      ↓ {Math.abs(t.changePercent)}%
                    </span>
                  )}
                </div>

                {/* Row 3: Target Box (2 columns) + Progress Bar matching Screen 5 */}
                <div className="mt-3 bg-slate-50/90 border border-slate-100 rounded-2xl p-3.5 space-y-2.5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                        Giá mục tiêu
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-800">
                        {t.targetPrice ? formatVND(t.targetPrice) : "Chưa đặt"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                        Còn cách
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-pine-900">
                        {t.diffFromTarget !== undefined
                          ? formatVND(t.diffFromTarget)
                          : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar visualizing distance to target */}
                  <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${t.targetProgress || 60}%` }}
                    />
                  </div>
                </div>

                {/* Row 4: Footer - Freshness & Chevron */}
                <div className="mt-3.5 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Cập nhật {formatRelativeTime(t.UpdatedAt || t.CreatedAt)}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleToggle(e, t.ID, t.Active)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-colors ${
                        t.Active
                          ? "bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600"
                          : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {t.Active ? "Tạm dừng" : "Tiếp tục"}
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-pine-900 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
