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
import { formatVND, formatRelativeTime } from "@/lib/formatting";
import { PlatformBadge } from "@/components/ui/Badge";
import {
  Bell,
  SlidersHorizontal,
  ArrowRight,
  TrendingDown,
  MessageSquare,
  CheckCheck,
  Check,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { t, formatText } = useLanguage();
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "drop" | "zalo">("all");
  const { data: notifications = [], isLoading: loading } = useNotifications(50);
  const markReadMutation = useMarkNotificationAsRead();
  const markAllMutation = useMarkAllNotificationsAsRead();

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await markReadMutation.mutateAsync(id);
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.read_at);
    if (unread.length === 0) return;

    try {
      await markAllMutation.mutateAsync(unread.map((n) => n.id));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
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

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-10 space-y-6">
      {/* Header matching Screen 9 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-pine-900 tracking-tight">
              {t.notifications.title}
            </h1>
            {unreadCount > 0 && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                {formatText(t.notifications.unreadBadge, { count: unreadCount })}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t.notifications.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-pine-900 hover:bg-pine-50 border border-pine-200/80 rounded-full transition-colors"
              title={t.notifications.markAllRead}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.notifications.markAllRead}</span>
            </button>
          )}

          <Link
            href="/settings"
            className="p-2 text-slate-500 hover:text-pine-900 hover:bg-slate-100 rounded-full transition-colors"
            title={t.nav.settings}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
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
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
              activeTab === tab.id
                ? "bg-pine-900 text-white shadow-2xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content list or Loading Skeleton */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white border border-slate-200/90 rounded-3xl p-5 animate-pulse flex items-start gap-3.5"
            >
              <div className="w-10 h-10 rounded-2xl bg-slate-100 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-100 rounded-md w-3/4" />
                <div className="h-3 bg-slate-100 rounded-md w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-slate-200/90 rounded-3xl p-10 sm:p-14 text-center max-w-lg mx-auto shadow-2xs space-y-4">
          <div className="w-16 h-16 rounded-full bg-pine-50 border border-pine-100 text-pine-800 flex items-center justify-center mx-auto">
            <Bell className="w-7 h-7 text-pine-800" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-pine-900 mb-1">
              {activeTab === "unread"
                ? t.notifications.emptyUnreadTitle
                : t.notifications.emptyTitle}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              {activeTab === "unread"
                ? t.notifications.emptyUnreadDesc
                : t.notifications.emptyDesc}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-pine-900 hover:bg-pine-950 text-white rounded-full text-xs font-semibold shadow-2xs transition-all"
            >
              <span>{t.notifications.trackNewBtn}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => {
                const sampleNotif: PriceNotification = {
                  id: "sample-" + Date.now(),
                  user_id: "00000000-0000-0000-0000-000000000001",
                  alert_rule_id: "sample-rule-1",
                  channel: "zalo",
                  recipient: "0988123456",
                  status: "sent",
                  price_before: 6190000,
                  price_after: 5450000,
                  created_at: new Date().toISOString(),
                  sent_at: new Date().toISOString(),
                  product_title: "Tai nghe Sony WH-1000XM6 Chính Hãng",
                  platform: "shopee",
                  product_url: "/tracking",
                };
                qc.setQueryData<PriceNotification[]>(["notifications", 50], (prev = []) => [sampleNotif, ...prev]);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-semibold transition-all border border-slate-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-pine-900" />
              <span>{t.notifications.simulateBtn}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Notifications Feed */
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const isUnread = !notif.read_at;
            const dropAmount = notif.price_before - notif.price_after;
            const dropPercent =
              notif.price_before > 0
                ? Math.round((dropAmount / notif.price_before) * 100)
                : 0;

            return (
              <div
                key={notif.id}
                onClick={() => isUnread && handleMarkAsRead(notif.id)}
                className={`bg-white border rounded-3xl p-5 shadow-2xs transition-all cursor-pointer relative overflow-hidden group ${
                  isUnread
                    ? "border-pine-300 ring-1 ring-pine-900/5 bg-gradient-to-r from-pine-50/20 to-white"
                    : "border-slate-200/90 opacity-80 hover:opacity-100 hover:border-slate-300"
                }`}
              >
                {/* Unread indicator bar */}
                {isUnread && (
                  <span className="absolute left-0 top-0 bottom-0 w-1 bg-pine-900" />
                )}

                <div className="flex items-start gap-3.5">
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      dropAmount > 0
                        ? "bg-rose-50 text-rose-700"
                        : "bg-pine-50 text-pine-900"
                    }`}
                  >
                    {dropAmount > 0 ? (
                      <TrendingDown className="w-5 h-5 text-rose-600" />
                    ) : (
                      <Bell className="w-5 h-5 text-pine-900" />
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {notif.platform && (
                          <PlatformBadge platformOrUrl={notif.platform} />
                        )}
                        {notif.channel === "zalo" ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            <span>Zalo OA</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-pine-50 text-pine-900 border border-pine-200">
                            {t.notifications.inApp}
                          </span>
                        )}

                        {notif.status === "read" ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <CheckCheck className="w-3 h-3 text-emerald-600" />
                            <span>{t.notifications.statusRead}</span>
                          </span>
                        ) : notif.status === "delivered" ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
                            <Check className="w-3 h-3 text-sky-600" />
                            <span>{t.notifications.statusDelivered}</span>
                          </span>
                        ) : notif.status === "sent" ? (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
                            {t.notifications.statusSent}
                          </span>
                        ) : notif.status === "failed" ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            {t.notifications.statusFailed}
                          </span>
                        ) : notif.status === "queued" ? (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            {t.notifications.statusQueued}
                          </span>
                        ) : null}
                      </div>

                      <span className="text-[11px] text-slate-400 font-normal">
                        {formatRelativeTime(notif.sent_at || notif.created_at)}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                      {notif.product_title || t.notifications.productFallback}
                    </h4>

                    {/* Price Diff */}
                    <div className="flex items-baseline gap-2 pt-0.5">
                      <span className="text-base font-extrabold text-pine-900">
                        {formatVND(notif.price_after)}
                      </span>
                      {notif.price_before > 0 && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatVND(notif.price_before)}
                        </span>
                      )}
                      {dropPercent > 0 && (
                        <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-100">
                          ↓ {dropPercent}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Action */}
                  <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                    {isUnread && (
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mb-2" />
                    )}
                    {notif.product_url && (
                      <a
                        href={notif.product_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-slate-400 hover:text-pine-900 hover:bg-slate-100 rounded-lg transition-colors mt-auto"
                        title={t.common.viewProduct}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
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
