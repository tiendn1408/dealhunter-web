"use client";

import { useMemo } from "react";
import { useComparison } from "@/lib/hooks";
import { PlatformBadge } from "@/components/ui/Badge";
import { formatVND, formatRelativeTime } from "@/lib/formatting";
import {
  ExternalLink,
  Plus,
  Sparkles,
  Clock,
  AlertCircle,
  Store,
  CheckCircle2,
} from "lucide-react";

interface SourceComparisonSectionProps {
  trackingId: string;
  productId?: string;
  onLinkSource: () => void;
}

export function SourceComparisonSection({
  trackingId,
  productId,
  onLinkSource,
}: SourceComparisonSectionProps) {
  const { data: comparison, isLoading, error } = useComparison(trackingId);

  const sortedSources = useMemo(() => {
    if (!comparison?.sources || comparison.sources.length === 0) return [];
    return [...comparison.sources].sort((a, b) => {
      if (a.is_best_deal && !b.is_best_deal) return -1;
      if (!a.is_best_deal && b.is_best_deal) return 1;
      return a.effective_price - b.effective_price;
    });
  }, [comparison?.sources]);

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-5 w-44 bg-slate-200 rounded-md" />
            <div className="h-3 w-64 bg-slate-100 rounded-md" />
          </div>
          <div className="h-8 w-28 bg-slate-200 rounded-full" />
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 w-full bg-slate-50 border border-slate-100 rounded-2xl"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-pine-900 tracking-tight">
            So sánh giá đa sàn
          </h2>
          <button
            type="button"
            onClick={onLinkSource}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-pine-900 hover:bg-pine-950 text-white rounded-full text-xs font-semibold shadow-2xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm sàn khác</span>
          </button>
        </div>
        <div className="p-4 bg-slate-50 text-slate-600 border border-slate-200 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-slate-400" />
          <span>Chưa thể tải dữ liệu so sánh giá đa sàn lúc này.</span>
        </div>
      </div>
    );
  }

  // Truong hop 1: San pham chi moi co 1 nguon (chua du >= 2 nguon de so sanh)
  if (!comparison?.comparison_available || sortedSources.length < 2) {
    const primarySource = sortedSources[0];

    return (
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-pine-50 text-pine-900 flex items-center justify-center shrink-0">
              <Store className="w-5 h-5 text-pine-900" />
            </div>
            <div>
              <h2 className="text-lg font-black text-pine-900 tracking-tight">
                So sánh giá đa sàn
              </h2>
              <p className="text-xs text-slate-500">
                Tìm giá tốt nhất trên Shopee, Lazada và TikTok Shop
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50/90 border border-dashed border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-700">
              <span>Sản phẩm này hiện chỉ đang theo dõi trên</span>
              {primarySource ? (
                <PlatformBadge platformOrUrl={primarySource.platform} />
              ) : (
                <span className="font-semibold text-slate-800">1 sàn</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 max-w-md leading-relaxed">
              Dán thêm đường link sản phẩm tương ứng từ Lazada hoặc TikTok Shop để hệ thống tự động tìm nơi bán rẻ nhất.
            </p>
          </div>

          <button
            type="button"
            onClick={onLinkSource}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-pine-900 hover:bg-pine-950 text-white rounded-full text-xs font-semibold shadow-2xs transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Liên kết thêm sàn</span>
          </button>
        </div>
      </div>
    );
  }

  // Truong hop 2: Co tu 2 nguon tro len (comparison_available = true)
  const bestDeal = comparison.best_deal;

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-5">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-pine-50 text-pine-900 flex items-center justify-center shrink-0">
            <Store className="w-5 h-5 text-pine-900" />
          </div>
          <div>
            <h2 className="text-lg font-black text-pine-900 tracking-tight">
              So sánh giá đa sàn
            </h2>
            <p className="text-xs text-slate-500">
              Bảng so sánh giá thực tế giữa các sàn thương mại điện tử
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLinkSource}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-pine-900 hover:bg-pine-950 text-white rounded-full text-xs font-semibold shadow-2xs transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm sàn khác</span>
        </button>
      </div>

      {/* 2. Best Deal Summary Banner */}
      {bestDeal && bestDeal.saving_vs_most_expensive > 0 && (
        <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-700 text-white uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Giá tốt nhất</span>
              </span>
              <PlatformBadge platformOrUrl={bestDeal.platform} />
            </div>
            <p className="text-xs text-emerald-900 font-medium pt-0.5">
              Tiết kiệm{" "}
              <span className="font-extrabold text-emerald-950">
                {formatVND(bestDeal.saving_vs_most_expensive)}
              </span>{" "}
              ({bestDeal.saving_percent.toFixed(1)}%) so với sàn đắt nhất
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block tracking-wider">
              Thực trả tốt nhất
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-950 block">
              {formatVND(bestDeal.effective_price)}
            </span>
          </div>
        </div>
      )}

      {/* 3. Table / List of Marketplace Sources */}
      <div className="space-y-3 pt-1">
        {sortedSources.map((source) => {
          const isWinningDeal = source.is_best_deal && comparison.comparison_available;
          const hasPrice = source.effective_price > 0 && source.captured_at !== null;

          return (
            <div
              key={source.source_id}
              className={`rounded-2xl p-4 sm:p-5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isWinningDeal
                  ? "bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-300/60"
                  : "bg-slate-50/70 border-slate-200/80 hover:bg-slate-50"
              }`}
            >
              {/* Left Column: Platform, Shop Name, Status */}
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <PlatformBadge platformOrUrl={source.platform} />
                  {isWinningDeal && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      <span>Rẻ nhất</span>
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      !hasPrice
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : source.in_stock
                        ? "bg-slate-100 text-slate-600 border-slate-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {!hasPrice
                      ? "Đang quét"
                      : source.in_stock
                      ? "Còn hàng"
                      : "Hết hàng"}
                  </span>
                </div>

                <p className="text-xs text-slate-600 truncate font-medium">
                  {source.seller_name ? `Shop: ${source.seller_name}` : "Cửa hàng chính hãng"}
                </p>

                {/* Sub-details: Listed price & Shipping fee */}
                {hasPrice && (
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                    <span>
                      Giá niêm yết:{" "}
                      <span className="font-semibold text-slate-700">
                        {formatVND(source.listed_price)}
                      </span>
                    </span>
                    <span>·</span>
                    <span>
                      Phí ship:{" "}
                      <span className="font-semibold text-slate-700">
                        {source.shipping_fee > 0
                          ? formatVND(source.shipping_fee)
                          : "Miễn phí"}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {/* Right Column: Effective Price & Buy Link Button */}
              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Giá thực trả
                  </span>
                  <span
                    className={`text-lg sm:text-xl font-black block ${
                      isWinningDeal ? "text-emerald-950" : "text-slate-900"
                    }`}
                  >
                    {hasPrice ? formatVND(source.effective_price) : "Đang kiểm tra..."}
                  </span>
                </div>

                {source.canonical_url ? (
                  <a
                    href={source.canonical_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                      isWinningDeal
                        ? "bg-emerald-800 hover:bg-emerald-900 text-white"
                        : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    <span>Đến nơi bán</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Footer info */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>
            Dữ liệu so sánh: {formatRelativeTime(comparison.computed_at)}
          </span>
        </div>
        <span>Giá thực trả đã bao gồm phí vận chuyển ước tính</span>
      </div>
    </div>
  );
}
