"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { PriceNotification } from "@/lib/api";
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from "@/lib/hooks";
import { useLanguage } from "@/lib/i18n";
import { useQueryClient } from "@tanstack/react-query";
import { detectPlatform, formatVND, formatRelativeTime } from "@/lib/formatting";
import { ProductImage } from "@/components/ui/ProductImage";
import { PlatformBadge } from "@/components/ui/Badge";
import { StruckPrice, WrittenPrice } from "@/components/PriceTag";
import {
  SlidersHorizontal,
  ArrowRight,
  MessageSquare,
  CheckCheck,
  Check,
  ArrowUpRight,
  ArrowDown,
  AlertCircle,
} from "lucide-react";

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { t, formatText } = useLanguage();
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "drop" | "zalo">("all");
  const {
    data: notifications = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useNotifications(50);
  const markReadMutation = useMarkNotificationAsRead();
  const markAllMutation = useMarkAllNotificationsAsRead();
  const [actionError, setActionError] = useState<string | null>(null);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActionError(null);
    try {
      await markReadMutation.mutateAsync(id);
    } catch (err: any) {
      setActionError(err?.message || t.common.error);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.read_at);
    if (unread.length === 0) return;

    setActionError(null);
    try {
      await markAllMutation.mutateAsync(unread.map((n) => n.id));
    } catch (err: any) {
      setActionError(err?.message || t.common.error);
    }
  };

  const markingAll = markAllMutation.isPending;

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read_at).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === "unread") return !n.read_at;
      if (activeTab === "drop") return n.price_after < n.price_before;
      if (activeTab === "zalo") return n.channel === "zalo";
      return true;
    });
  }, [notifications, activeTab]);

  const statusChip = (status?: string) => {
    if (status === "read")
      return (
        <span className="inline-flex items-center gap-1 bg-teal-200 rounded-full px-2.5 py-1 text-[13px] font-semibold text-pine-950">
          <CheckCheck className="h-3.5 w-3.5" />
          {t.notifications.statusRead}
        </span>
      );
    if (status === "delivered")
      return (
        <span className="inline-flex items-center gap-1 bg-pine-50 rounded-full px-2.5 py-1 text-[13px] font-semibold text-pine-900">
          <Check className="h-3.5 w-3.5" />
          {t.notifications.statusDelivered}
        </span>
      );
    if (status === "sent")
      return <span className="bg-pine-50 rounded-full px-2.5 py-1 text-[13px] font-semibold text-pine-700">{t.notifications.statusSent}</span>;
    if (status === "failed")
      return <span className="bg-[#FBE3E4] rounded-full px-2.5 py-1 text-[13px] font-semibold text-marker-deep">{t.notifications.statusFailed}</span>;
    if (status === "queued")
      return <span className="bg-warn-soft rounded-full px-2.5 py-1 text-[13px] font-semibold text-warn-ink">{t.notifications.statusQueued}</span>;
    return null;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6 sm:py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[clamp(32px,4.4vw,52px)] font-extrabold leading-none tracking-tight text-pine-900">
              {t.notifications.title}
            </h1>
            {unreadCount > 0 && (
              <span className="bg-marker rounded-full px-2.5 py-1 text-[13px] font-bold text-chalk">
                {formatText(t.notifications.unreadBadge, { count: unreadCount })}
              </span>
            )}
          </div>
          <p className="mt-2 text-[15px] text-pine-700">{t.notifications.subtitle}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="inline-flex min-h-[44px] items-center gap-2 bg-white px-4 text-[15px] font-bold text-pine-900 transition-colors hover:bg-pine-50 disabled:cursor-not-allowed disabled:opacity-50 rounded-full"
              title={t.notifications.markAllRead}
            >
              <CheckCheck className="h-4 w-4" />
              <span className="hidden sm:inline">{t.notifications.markAllRead}</span>
            </button>
          )}
          <Link
            href="/settings"
            className="inline-flex h-11 w-11 items-center justify-center bg-white text-pine-900 transition-colors hover:bg-pine-50 rounded-full"
            title={t.nav.settings}
            aria-label={t.nav.settings}
          >
            <SlidersHorizontal className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Filters: square segmented tabs */}
      <div role="tablist" className="flex gap-1 overflow-x-auto pb-1">
        {[
          { id: "all", label: t.notifications.tabAll },
          {
            id: "unread",
            label: formatText(t.notifications.tabUnread, {
              count: unreadCount > 0 ? `(${unreadCount})` : "",
            }),
          },
          { id: "drop", label: t.notifications.tabPriceDrop },
          { id: "zalo", label: t.notifications.tabZalo },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`min-h-[44px] shrink-0 px-4 text-[15px] font-semibold transition-colors rounded-full ${
              activeTab === tab.id ? "bg-pine-900 text-chalk" : "bg-white text-pine-900 hover:bg-pine-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {actionError && (
        <div className="flex items-center gap-2 bg-[#FBE3E4] p-3 text-[15px] font-semibold text-marker-deep rounded-2xl">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3 bg-white p-5 rounded-[1.75rem] shadow-soft ring-1 ring-pine-900/[0.06]">
              <div className="chalk-skeleton h-4 w-1/3 rounded-full bg-pine-50" />
              <div className="chalk-skeleton h-5 w-3/4 rounded-full bg-pine-50" />
              <div className="chalk-skeleton h-8 w-1/3 rounded-full bg-pine-50" />
            </div>
          ))}
        </div>
      ) : queryError ? (
        <div className="space-y-4 bg-[#FBE3E4] p-6 text-center text-marker-deep rounded-[1.75rem]">
          <AlertCircle className="mx-auto h-8 w-8" />
          <p className="text-[15px] font-semibold">{(queryError as Error).message}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="min-h-[44px] bg-marker px-5 text-[15px] font-bold text-chalk transition-colors hover:bg-marker-deep rounded-full"
          >
            {t.common.retry}
          </button>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white p-8 text-center sm:p-12 rounded-[1.75rem] shadow-soft ring-1 ring-pine-900/[0.06]">
          <h3 className="text-3xl font-extrabold text-pine-900">
            {activeTab === "unread" ? t.notifications.emptyUnreadTitle : t.notifications.emptyTitle}
          </h3>
          <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-pine-700">
            {activeTab === "unread" ? t.notifications.emptyUnreadDesc : t.notifications.emptyDesc}
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex min-h-[44px] items-center gap-2 bg-teal-400 px-5 text-[15px] font-bold text-pine-950 transition-colors hover:bg-teal-300 rounded-full"
          >
            {t.notifications.trackNewBtn}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredNotifications.map((notif) => {
            const isUnread = !notif.read_at;
            const dropAmount = notif.price_before - notif.price_after;
            const dropPercent =
              notif.price_before > 0 ? Math.round((dropAmount / notif.price_before) * 100) : 0;

            return (
              <li
                key={notif.id}
                onClick={() => isUnread && handleMarkAsRead(notif.id)}
                className={`relative flex cursor-pointer flex-wrap items-start gap-4 rounded-[1.75rem] p-5 ring-1 transition-colors duration-500 ease-spring sm:flex-nowrap ${
                  isUnread ? "bg-white shadow-soft ring-pine-900/[0.06] hover:bg-pine-50/60" : "bg-white/60 ring-pine-900/[0.05] hover:bg-white"
                }`}
              >
                <ProductImage src={notif.product_image} alt={notif.product_title || ""} size={56} />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-[13px]">
                    {isUnread && <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-marker" />}
                    {notif.platform && <PlatformBadge platformOrUrl={notif.platform} />}
                    {notif.channel === "zalo" ? (
                      <span className="inline-flex items-center gap-1 bg-pine-50 rounded-full px-2.5 py-1 font-semibold text-pine-900">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Zalo OA
                      </span>
                    ) : (
                      <span className="bg-pine-50 rounded-full px-2.5 py-1 font-semibold text-pine-900">{t.notifications.inApp}</span>
                    )}
                    {statusChip(notif.status)}
                    <span className="ml-auto text-pine-700">{formatRelativeTime(notif.sent_at || notif.created_at)}</span>
                  </div>

                  <h2 className="line-clamp-2 text-[17px] font-bold leading-snug text-pine-900">
                    {notif.product_title || t.notifications.productFallback}
                  </h2>

                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    {notif.price_before > 0 && notif.price_before !== notif.price_after && (
                      <StruckPrice className="text-lg text-pine-700">{formatVND(notif.price_before)}</StruckPrice>
                    )}
                    <WrittenPrice className="text-[28px] text-pine-900">{formatVND(notif.price_after)}</WrittenPrice>
                    {dropPercent > 0 && (
                      <span className="inline-flex items-center gap-1 bg-teal-200 rounded-full px-2.5 py-1 text-[13px] font-bold text-pine-950"><ArrowDown className="h-3.5 w-3.5" strokeWidth={3} />{dropPercent}%</span>
                    )}
                  </div>
                </div>

                {notif.product_url && (
                  <a
                    href={notif.affiliate_url || notif.product_url}
                    target="_blank"
                    rel="sponsored noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="group/buy inline-flex min-h-[48px] w-full shrink-0 items-center justify-between gap-3 rounded-full bg-teal-400 py-1 pl-5 pr-1 text-[15px] font-bold text-pine-950 transition-[transform,background-color] duration-500 ease-spring hover:bg-teal-300 active:scale-[0.98] sm:w-auto"
                  >
                    {formatText(t.landing.buyOn, { platform: detectPlatform(notif.platform || notif.product_url).name })}
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-pine-950/10 transition-transform duration-500 ease-spring group-hover/buy:-translate-y-px group-hover/buy:translate-x-0.5">
                      <ArrowUpRight className="h-[18px] w-[18px]" strokeWidth={1.75} />
                    </span>
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
