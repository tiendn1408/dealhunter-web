"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useZaloProfile, useDisconnectZalo, useAuth, useTrackings } from "@/lib/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { ZaloConnectModal } from "@/components/settings/ZaloConnectModal";
import { LoginModal } from "@/components/auth/LoginModal";
import { useLanguage } from "@/lib/i18n";
import { formatPhoneLocal } from "@/lib/formatting";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import {
  Settings,
  Bookmark,
  MessageSquare,
  LineChart,
  HelpCircle,
  FileText,
  LogOut,
  LogIn,
  ShieldCheck,
  ChevronRight,
  Clock,
  CheckCircle2,
  Unlink,
  Globe,
} from "lucide-react";

export default function SettingsPage() {
  const [showZaloModal, setShowZaloModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const { t, formatText } = useLanguage();
  const qc = useQueryClient();
  const { user, sessionUser, isAuthenticated, logout } = useAuth();
  const userId = sessionUser?.id ?? "";
  const { data: zaloProfile = null, error: zaloError, refetch: refetchZalo } = useZaloProfile();
  const disconnectMutation = useDisconnectZalo();
  const zaloDisconnecting = disconnectMutation.isPending;

  // The scan interval is decided by the server per tracking (no user-editable setting exists yet);
  // show the real value from the user's trackings.
  const { data: trackings = [], isLoading: trackingsLoading, error: trackingsError } = useTrackings();
  const intervalSeconds = trackings.find((p) => p.PollingIntervalSeconds > 0)?.PollingIntervalSeconds;

  const handleResetUser = async () => {
    if (confirm(t.settings.resetConfirm)) {
      // Clear data older versions kept in the browser
      for (const key of [
        "dealhunter-products-meta", "dealhunter_products_meta", "deal-hunter-products-meta",
        "dealhunter-targets", "dealhunter_targets", "deal-hunter-targets",
        "dealhunter-poll-interval", "dealhunter_poll_interval", "deal-hunter-poll-interval",
      ]) {
        try {
          localStorage.removeItem(key);
        } catch {
          // Storage unavailable (private mode, blocked site data): still sign out below
        }
      }
      try {
        await logout();
        window.location.reload();
      } catch (err: any) {
        alert(err?.message || "Đăng xuất thất bại");
      }
    }
  };

  const handleDisconnectZalo = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(t.settings.disconnectConfirm)) return;
    try {
      await disconnectMutation.mutateAsync();
    } catch (err) {
      alert(t.settings.disconnectFailed);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-6 sm:py-10 space-y-6">
      {/* Header matching Screen 10 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-black text-pine-900 tracking-tight">
          {t.settings.title}
        </h1>
      </div>

      {/* User Profile Card matching Screen 10 */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-full bg-pine-900 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
              {isAuthenticated && user?.name ? user.name[0].toUpperCase() : "D"}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-pine-900 truncate">
                  {isAuthenticated ? (user?.name || t.settings.userTitle) : t.auth.guestUser}
                </h2>
                {isAuthenticated && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 uppercase border border-cyan-200">
                    {user?.auth_provider || "Member"}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono truncate mt-0.5">
                {isAuthenticated && user?.email ? user.email : `ID: ${userId.slice(0, 16)}...`}
              </p>
            </div>
          </div>

          <div>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => logout().catch((err: any) => alert(err?.message || "Đăng xuất thất bại"))}
                className="px-3.5 py-1.5 rounded-full border border-slate-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.auth.logout}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="px-4 py-2 rounded-full bg-pine-900 text-white text-xs font-semibold hover:bg-pine-800 transition-all shadow-xs flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t.auth.login}</span>
              </button>
            )}
          </div>
        </div>

        {!isAuthenticated && (
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-start gap-2.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
            <p>
              {t.auth.guestTip}
            </p>
          </div>
        )}
      </div>

      {/* Menu List matching Screen 10 */}
      <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-2xs divide-y divide-slate-100">
        {/* Đang theo dõi */}
        <Link
          href="/tracking"
          className="flex items-center justify-between p-4 sm:p-4.5 hover:bg-slate-50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-pine-50 text-pine-900 flex items-center justify-center">
              <Bookmark className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-slate-800">
              {t.nav.tracking}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>{t.settings.viewList}</span>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
          </div>
        </Link>

        {/* Chu kỳ quét (giá trị thật do máy chủ quyết định, chỉ hiển thị) */}
        <div className="w-full flex items-center justify-between p-4 sm:p-4.5 text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-pine-50 text-pine-900 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-800 block">
                {t.settings.scanSection}
              </span>
              {trackingsError ? (
                <span className="text-[11px] text-rose-600 block">
                  {(trackingsError as Error).message}
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 block">
                  {trackingsLoading
                    ? t.common.loading
                    : intervalSeconds
                    ? formatText(t.settings.currentInterval, { minutes: Math.round(intervalSeconds / 60) })
                    : t.settings.intervalNoTrackings}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Liên kết Zalo (Phase 2): a failed load is an error, not "not linked" */}
        {zaloError ? (
          <div className="flex items-center justify-between gap-3 p-4 sm:p-4.5">
            <span className="text-[11px] text-rose-600">{(zaloError as Error).message}</span>
            <button
              type="button"
              onClick={() => refetchZalo()}
              className="shrink-0 text-xs font-bold text-pine-700 hover:underline"
            >
              {t.common.retry}
            </button>
          </div>
        ) : zaloProfile?.zalo_connected ? (
          <div className="flex items-center justify-between p-4 sm:p-4.5 bg-blue-50/30 hover:bg-blue-50/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 block">
                    {formatText(t.settings.zaloActiveTitle, {
                      // phone comes normalized (84xxxxxxxxx); shown in local form
                      identifier:
                        formatPhoneLocal(zaloProfile.phone) || t.settings.zaloIdentifierUnknown,
                    })}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                    {t.settings.zaloConnected}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block">
                  {t.settings.zaloActiveDesc}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDisconnectZalo}
              disabled={zaloDisconnecting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold transition-colors disabled:opacity-50"
              title={t.settings.disconnectZaloBtn}
            >
              <Unlink className="w-3.5 h-3.5" />
              <span>{zaloDisconnecting ? t.settings.disconnecting : t.settings.disconnectZaloBtn}</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => (isAuthenticated ? setShowZaloModal(true) : setShowLoginModal(true))}
            className="w-full flex items-center justify-between p-4 sm:p-4.5 hover:bg-slate-50 transition-colors group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-800 block">
                  {t.settings.zaloSection}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {t.settings.zaloDesc}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold px-2.5 py-1 bg-pine-900 text-white rounded-full">
                {t.settings.connectNow}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
          </button>
        )}

        {/* Lịch sử giá */}
        <Link
          href="/tracking"
          className="flex items-center justify-between p-4 sm:p-4.5 hover:bg-slate-50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-pine-50 text-pine-900 flex items-center justify-center">
              <LineChart className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-slate-800">
              {t.settings.priceHistoryMenu}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
        </Link>

        {/* Hỗ trợ & góp ý */}
        <div className="flex items-center justify-between p-4 sm:p-4.5 hover:bg-slate-50 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-slate-800">
              {t.settings.supportFeedback}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300" />
        </div>

        {/* Điều khoản sử dụng */}
        <div className="flex items-center justify-between p-4 sm:p-4.5 hover:bg-slate-50 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-slate-800">
              {t.settings.termsOfService}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300" />
        </div>

        {/* Ngôn ngữ hiển thị */}
        <div className="flex items-center justify-between p-4 sm:p-4.5 hover:bg-slate-50 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-pine-50 text-pine-900 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-800 block">
                {t.settings.languageSection}
              </span>
              <span className="text-[11px] text-slate-400 block">
                {t.settings.languageDesc}
              </span>
            </div>
          </div>
          <LanguageSwitcher variant="select" />
        </div>

        {/* Đăng xuất / Đặt lại */}
        <button
          type="button"
          onClick={handleResetUser}
          className="w-full flex items-center justify-between p-4 sm:p-4.5 hover:bg-rose-50 transition-colors group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <LogOut className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-rose-600">
              {t.settings.resetUserId}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-rose-300 group-hover:text-rose-500 transition-colors" />
        </button>
      </div>

      {/* Zalo Connect Modal (Phase 2) */}
      <ZaloConnectModal
        isOpen={showZaloModal}
        onClose={() => setShowZaloModal(false)}
        onConnected={() => {
          qc.invalidateQueries({ queryKey: ["zalo", "profile"] });
        }}
        onRequestLogin={() => setShowLoginModal(true)}
      />

      {/* Login Modal (GAP-02) */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
}
