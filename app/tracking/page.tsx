"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useEnrichedTrackings, useToggleTracking, useHasUnreadNotifications } from "@/lib/hooks";
import { useLanguage } from "@/lib/i18n";
import { detectPlatform, formatVND, formatRelativeTime } from "@/lib/formatting";
import { PlatformBadge } from "@/components/ui/Badge";
import { PriceChangePill } from "@/components/ui/PriceChangePill";
import { EmptyState } from "@/components/ui/EmptyState";
import { TrackingListSkeleton } from "@/components/ui/LoadingSkeleton";
import { PriceTag, StruckPrice, WrittenPrice } from "@/components/PriceTag";
import { Bell, Search, Plus, AlertCircle, ArrowUpRight } from "lucide-react";

// "Near target" needs a real target and price: products without one are never near it
const isNearTarget = (item: { diffFromTarget?: number }) =>
  item.diffFromTarget !== undefined && item.diffFromTarget <= 300000;

export default function MyTrackingPage() {
  const { t, formatText } = useLanguage();
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
      alert(formatText(t.tracking.actionFailed, { message: err.message }));
    } finally {
      setTogglingId(null);
    }
  };

  const filteredTrackings = useMemo(() => {
    return trackings.filter((item) => {
      if (filterTab === "dropped" && (item.changePercent || 0) >= 0) return false;
      if (filterTab === "target" && !isNearTarget(item)) return false;

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

  const tabs = [
    { id: "all", label: t.tracking.filterAll, count: trackings.length },
    { id: "dropped", label: t.tracking.filterDropped, count: trackings.filter((item) => (item.changePercent || 0) < 0).length },
    { id: "target", label: t.tracking.filterTarget, count: trackings.filter(isNearTarget).length },
  ] as const;

  return (
    <div className="space-y-8">
      {/* The board's header strip: what is on it, and the way to add more */}
      <div className="flex flex-col gap-5 bg-pine-900 p-6 text-chalk sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <h1 className="text-[clamp(32px,4.4vw,52px)] font-extrabold leading-none tracking-tight">{t.tracking.title}</h1>
          <p className="mt-3 text-[15px] text-chalk/85">
            {trackings.length > 0 ? formatText(t.tracking.subtitle, { count: trackings.length }) : t.tracking.zeroCount}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-2 bg-teal-400 px-5 text-[15px] font-bold text-pine-950 transition-colors hover:bg-teal-300"
          >
            <Plus className="h-4 w-4" />
            {t.tracking.trackMore}
          </Link>
          <Link
            href="/notifications"
            title={t.tracking.viewNotifications}
            aria-label={t.tracking.viewNotifications}
            className="relative inline-flex h-11 w-11 items-center justify-center bg-pine-800 transition-colors hover:bg-pine-700"
          >
            <Bell className="h-5 w-5" />
            {hasUnread && <span className="absolute right-2 top-2 h-2.5 w-2.5 bg-marker" />}
          </Link>
        </div>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex overflow-x-auto" role="tablist">
          {tabs.map((tab) => {
            const active = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilterTab(tab.id)}
                className={`inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap px-4 text-[15px] font-semibold transition-colors ${
                  active ? "bg-pine-900 text-chalk" : "bg-white text-pine-900 hover:bg-pine-50"
                }`}
              >
                {tab.label}
                <span className="opacity-70">{tab.count}</span>
              </button>
            );
          })}
        </div>
        <div className="relative sm:w-72">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-pine-700" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.tracking.searchPlaceholder}
            aria-label={t.tracking.searchPlaceholder}
            className="h-11 w-full bg-white pl-10 pr-4 text-[15px] text-pine-950 placeholder:text-pine-700 focus:outline-none focus-visible:outline-teal-400"
          />
        </div>
      </div>

      {loading ? (
        <TrackingListSkeleton />
      ) : error ? (
        <div className="flex flex-col items-start gap-4 bg-[#FBE3E4] p-6 text-marker-deep sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-[15px] font-semibold">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            {error}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="min-h-[44px] bg-marker px-5 text-[15px] font-bold text-chalk transition-colors hover:bg-marker-deep"
          >
            {t.tracking.retry}
          </button>
        </div>
      ) : filteredTrackings.length === 0 ? (
        trackings.length === 0 ? (
          <EmptyState />
        ) : (
          <EmptyState title={t.tracking.notFoundTitle} description={t.tracking.notFoundDesc} actionText={t.tracking.homeBtn} />
        )
      ) : (
        /* Tracked products as price cards; one near its target is marked */
        <ul className="grid gap-x-5 gap-y-8 pt-2 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTrackings.map((item, i) => {
            const hasPrice = item.currentPrice !== undefined && item.currentPrice > 0;
            const detailHref = `/tracking/${item.ProductSourceID || item.ID}`;
            const near = item.Active && hasPrice && isNearTarget(item);
            const multi = Boolean(
              (item.ProductID && trackings.filter((track) => track.ProductID === item.ProductID).length > 1) || !item.IsPrimary
            );

            return (
              <li key={item.ID} className="group relative transition-transform duration-200 hover:-translate-y-1 focus-within:-translate-y-1">
                <PriceTag tone={item.Active ? "white" : "muted"} className="flex flex-col">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <PlatformBadge platformOrUrl={item.Platform || item.CanonicalURL} />
                        {multi && <span className="bg-pine-900 px-2 py-0.5 text-[13px] font-bold text-chalk">{t.tracking.multiPlatform}</span>}
                      </div>
                      <span className="text-[13px] font-semibold opacity-80">
                        {item.Active ? t.tracking.statusTracking : t.tracking.statusPaused}
                      </span>
                    </div>

                    <h2 className="mt-3 line-clamp-2 min-h-[2.75em] text-[17px] font-bold leading-snug">
                      {/* the whole card opens the product; the buttons below sit above this link */}
                      <Link href={detailHref} className="after:absolute after:inset-0 group-hover:underline">
                        {item.Title || (item.CanonicalURL ? item.CanonicalURL.split("/").pop() : t.notifications.productFallback)}
                      </Link>
                    </h2>
                    <p className="mt-1 truncate text-[14px] opacity-80">
                      {item.SellerName ? formatText(t.comparison.shopLabel, { name: item.SellerName }) : t.tracking.autoCheck}
                    </p>

                    <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-1">
                      <span className="relative inline-block">
                        {hasPrice ? (
                          <WrittenPrice className="block text-[clamp(32px,3vw,40px)]">{formatVND(item.currentPrice)}</WrittenPrice>
                        ) : (
                          <span className="block text-2xl font-semibold opacity-60">{t.tracking.checking}</span>
                        )}
                      </span>
                      {item.oldPrice ? <StruckPrice className="mb-1 text-lg">{formatVND(item.oldPrice)}</StruckPrice> : null}
                      {near && <span className="mb-1.5 bg-teal-400 px-2 py-0.5 text-[13px] font-bold text-pine-950">{t.tracking.filterTarget}</span>}
                      {item.changePercent !== undefined && item.changePercent !== 0 && (
                        <PriceChangePill changePercent={item.changePercent} className="mb-1.5" />
                      )}
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 text-[14px]">
                      <div>
                        <span className="block opacity-80">{t.tracking.targetPriceLabel}</span>
                        <span className="font-bold">{item.targetPrice ? formatVND(item.targetPrice) : t.tracking.notSet}</span>
                      </div>
                      <div>
                        <span className="block opacity-80">{t.tracking.distanceLabel}</span>
                        <span className="font-bold">
                          {!item.targetPrice
                            ? t.tracking.noTarget
                            : item.diffFromTarget !== undefined
                            ? formatVND(item.diffFromTarget)
                            : t.common.unknown}
                        </span>
                      </div>
                    </div>
                    {item.targetPrice ? (
                      <div className="mt-3 h-2 w-full bg-pine-100" aria-hidden>
                        <div className="h-full bg-pine-900 transition-[width] duration-500" style={{ width: `${item.targetProgress || 0}%` }} />
                      </div>
                    ) : null}

                    <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-[13px]">
                      <span className="opacity-80">
                        {formatText(t.tracking.updated, { time: formatRelativeTime(item.UpdatedAt || item.CreatedAt) })}
                      </span>
                      <button
                        type="button"
                        disabled={togglingId === item.ID}
                        onClick={(e) => handleToggle(e, item.ID, item.Active)}
                        className={`relative z-10 min-h-[40px] px-3 text-[13px] font-bold transition-colors disabled:opacity-50 ${
                          item.Active ? "bg-pine-50 hover:bg-pine-100" : "bg-teal-400 text-pine-950 hover:bg-teal-300"
                        }`}
                      >
                        {item.Active ? t.tracking.pause : t.tracking.resume}
                      </button>
                    </div>
                    {/* The buy action, plainly visible on every product: the owner's affiliate link first */}
                    {(item.AffiliateURL || item.CanonicalURL) && (
                      <a
                        href={item.AffiliateURL || item.CanonicalURL}
                        target="_blank"
                        rel="sponsored noopener noreferrer"
                        className="cut relative z-10 mt-3 inline-flex min-h-[44px] items-center justify-center gap-1.5 bg-teal-400 px-4 text-[15px] font-bold text-pine-950 transition-colors hover:bg-teal-300"
                      >
                        {formatText(t.landing.buyOn, { platform: detectPlatform(item.Platform || item.CanonicalURL).name })}
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    )}
                  </PriceTag>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
