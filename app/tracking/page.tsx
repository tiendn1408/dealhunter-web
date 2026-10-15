"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useEnrichedTrackings, useToggleTracking, useHasUnreadNotifications } from "@/lib/hooks";
import { useLanguage } from "@/lib/i18n";
import { detectPlatform, formatVND, formatRelativeTime } from "@/lib/formatting";
import { PlatformBadge } from "@/components/ui/Badge";
import { PriceChangePill } from "@/components/ui/PriceChangePill";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductImage } from "@/components/ui/ProductImage";
import { PillLink } from "@/components/ui/Bezel";
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
      <div className="relative flex flex-col gap-5 overflow-hidden rounded-[2rem] bg-pine-900 p-6 text-chalk shadow-soft sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl" />
        <div className="relative">
          <h1 className="text-[clamp(32px,4.4vw,52px)] font-extrabold leading-none tracking-tight">{t.tracking.title}</h1>
          <p className="mt-3 text-[15px] text-chalk/85">
            {trackings.length > 0 ? formatText(t.tracking.subtitle, { count: trackings.length }) : t.tracking.zeroCount}
          </p>
        </div>
        <div className="relative flex items-center gap-2">
          <PillLink href="/" tone="teal" icon={<Plus className="h-[18px] w-[18px]" strokeWidth={1.75} />}>
            {t.tracking.trackMore}
          </PillLink>
          <Link
            href="/notifications"
            title={t.tracking.viewNotifications}
            aria-label={t.tracking.viewNotifications}
            className="relative inline-flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white/10 transition-colors duration-300 ease-spring hover:bg-white/15"
          >
            <Bell className="h-5 w-5" strokeWidth={1.75} />
            {hasUnread && <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-marker ring-2 ring-pine-900" />}
          </Link>
        </div>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-full bg-white p-1 shadow-soft ring-1 ring-pine-900/[0.06]" role="tablist">
          {tabs.map((tab) => {
            const active = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilterTab(tab.id)}
                className={`inline-flex min-h-[40px] items-center gap-2 whitespace-nowrap rounded-full px-4 text-[15px] font-semibold transition-colors duration-300 ease-spring ${
                  active ? "bg-pine-900 text-chalk" : "text-pine-800 hover:bg-pine-50"
                }`}
              >
                {tab.label}
                <span className="opacity-70">{tab.count}</span>
              </button>
            );
          })}
        </div>
        <div className="relative sm:w-72">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-pine-700" strokeWidth={1.75} />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.tracking.searchPlaceholder}
            aria-label={t.tracking.searchPlaceholder}
            className="h-12 w-full rounded-full bg-white pl-10 pr-4 text-[15px] text-pine-950 shadow-soft ring-1 ring-pine-900/[0.06] placeholder:text-pine-700 focus:outline-none focus-visible:outline-teal-400"
          />
        </div>
      </div>

      {loading ? (
        <TrackingListSkeleton />
      ) : error ? (
        <div className="flex flex-col items-start gap-4 bg-[#FBE3E4] p-6 text-marker-deep sm:flex-row sm:items-center sm:justify-between rounded-[1.75rem]">
          <p className="flex items-start gap-2 text-[15px] font-semibold">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            {error}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="min-h-[44px] bg-marker px-5 text-[15px] font-bold text-chalk transition-colors hover:bg-marker-deep rounded-full"
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
                        {multi && <span className="bg-pine-900 rounded-full px-2.5 py-1 text-[13px] font-bold text-chalk">{t.tracking.multiPlatform}</span>}
                      </div>
                      <span className="text-[13px] font-semibold opacity-80">
                        {item.Active ? t.tracking.statusTracking : t.tracking.statusPaused}
                      </span>
                    </div>

                    <div className="mt-4 flex items-start gap-3.5">
                      <ProductImage src={item.ImageURL} alt={item.Title || ""} size={72} />
                      <div className="min-w-0 flex-1">
                        <h2 className="line-clamp-2 text-[17px] font-bold leading-snug">
                          {/* the whole card opens the product; the buttons below sit above this link */}
                          <Link href={detailHref} className="after:absolute after:inset-0 group-hover:underline">
                            {item.Title || (item.CanonicalURL ? item.CanonicalURL.split("/").pop() : t.notifications.productFallback)}
                          </Link>
                        </h2>
                        <p className="mt-1 truncate text-[14px] opacity-80">
                          {item.SellerName ? formatText(t.comparison.shopLabel, { name: item.SellerName }) : t.tracking.autoCheck}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-1">
                      <span className="relative inline-block">
                        {hasPrice ? (
                          <WrittenPrice className="block text-[clamp(32px,3vw,40px)]">{formatVND(item.currentPrice)}</WrittenPrice>
                        ) : (
                          <span className="block text-2xl font-semibold opacity-60">{t.tracking.checking}</span>
                        )}
                      </span>
                      {item.oldPrice ? <StruckPrice className="mb-1 text-lg">{formatVND(item.oldPrice)}</StruckPrice> : null}
                      {near && <span className="mb-1.5 bg-teal-400 rounded-full px-2.5 py-1 text-[13px] font-bold text-pine-950">{t.tracking.filterTarget}</span>}
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
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-pine-100" aria-hidden>
                        <div className="h-full rounded-full bg-teal-500 transition-[width] duration-500 ease-spring" style={{ width: `${item.targetProgress || 0}%` }} />
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
                        className={`relative z-10 min-h-[40px] px-3 text-[13px] font-bold transition-colors disabled:opacity-50 rounded-full ${
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
                        className="group/buy relative z-10 mt-4 inline-flex min-h-[48px] items-center justify-between gap-3 rounded-full bg-teal-400 py-1 pl-5 pr-1 text-[15px] font-bold text-pine-950 transition-[transform,background-color] duration-500 ease-spring hover:bg-teal-300 active:scale-[0.98]"
                      >
                        {formatText(t.landing.buyOn, { platform: detectPlatform(item.Platform || item.CanonicalURL).name })}
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-pine-950/10 transition-transform duration-500 ease-spring group-hover/buy:-translate-y-px group-hover/buy:translate-x-0.5">
                          <ArrowUpRight className="h-[18px] w-[18px]" strokeWidth={1.75} />
                        </span>
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
