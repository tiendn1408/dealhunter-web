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
import { Bookmark, MessageSquare, LineChart, HelpCircle, FileText, LogOut, LogIn, ChevronRight, Clock, Unlink, Globe } from "lucide-react";

const panel = "bg-white";
const row = "flex min-h-[64px] items-center justify-between gap-4 px-5 py-4";
const rowLink = `${row} transition-colors hover:bg-pine-50`;
const rowIcon = "flex h-10 w-10 shrink-0 items-center justify-center bg-pine-50 text-pine-900";
const rowTitle = "block text-[15px] font-semibold text-pine-900";
const rowNote = "block text-[14px] leading-snug text-pine-700";

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
    <div className="mx-auto max-w-2xl space-y-8 py-6 sm:py-10">
      <div>
        <h1 className="font-marker text-[clamp(32px,4.4vw,52px)] font-extrabold leading-none tracking-tight text-pine-900">
          {t.settings.title}
        </h1>
        <p className="mt-2 text-[15px] text-pine-700">{t.settings.subtitle}</p>
      </div>

      {/* Account */}
      <section aria-labelledby="set-account" className="space-y-3">
        <h2 id="set-account" className="text-xl font-bold text-pine-900">
          {t.settings.userSection}
        </h2>
        <div className={`${panel} p-5 sm:p-6`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-pine-900 font-marker text-2xl font-extrabold text-chalk">
                {isAuthenticated && user?.name ? user.name[0].toUpperCase() : "D"}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-lg font-bold text-pine-900">
                    {isAuthenticated ? user?.name || t.settings.userTitle : t.auth.guestUser}
                  </p>
                  {isAuthenticated && (
                    <span className="bg-teal-200 px-2 py-0.5 text-[13px] font-semibold capitalize text-pine-950">
                      {user?.auth_provider || "Member"}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[14px] text-pine-700">
                  {isAuthenticated && user?.email ? user.email : `ID: ${userId.slice(0, 16)}...`}
                </p>
              </div>
            </div>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => logout().catch((err: any) => alert(err?.message || "Đăng xuất thất bại"))}
                className="inline-flex min-h-[44px] items-center gap-2 bg-marker px-5 text-[15px] font-bold text-chalk transition-colors hover:bg-marker-deep"
              >
                <LogOut className="h-4 w-4" />
                {t.auth.logout}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="inline-flex min-h-[44px] items-center gap-2 bg-teal-400 px-5 text-[15px] font-bold text-pine-950 transition-colors hover:bg-teal-300"
              >
                <LogIn className="h-4 w-4" />
                {t.auth.login}
              </button>
            )}
          </div>

          {!isAuthenticated && <p className="mt-4 bg-pine-50 p-4 text-[15px] leading-relaxed text-pine-900">{t.auth.guestTip}</p>}
        </div>
      </section>

      {/* Alerts: Zalo and the real scan interval */}
      <section aria-labelledby="set-alerts" className="space-y-3">
        <h2 id="set-alerts" className="text-xl font-bold text-pine-900">
          {t.settings.alertsGroup}
        </h2>
        <div className={`${panel} space-y-px bg-pine-50`}>
          {/* A failed load is an error, not "not linked" */}
          {zaloError ? (
            <div className={`${row} bg-white`}>
              <span className="text-[15px] font-semibold text-marker-deep">{(zaloError as Error).message}</span>
              <button
                type="button"
                onClick={() => refetchZalo()}
                className="min-h-[44px] shrink-0 bg-pine-50 px-4 text-[15px] font-bold text-pine-900 transition-colors hover:bg-pine-100"
              >
                {t.common.retry}
              </button>
            </div>
          ) : zaloProfile?.zalo_connected ? (
            <div className={`${row} flex-wrap bg-white`}>
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-teal-400 text-pine-950">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={rowTitle}>
                      {formatText(t.settings.zaloActiveTitle, {
                        // phone comes normalized (84xxxxxxxxx); shown in local form
                        identifier: formatPhoneLocal(zaloProfile.phone) || t.settings.zaloIdentifierUnknown,
                      })}
                    </span>
                    <span className="bg-teal-200 px-2 py-0.5 text-[13px] font-semibold text-pine-950">{t.settings.zaloConnected}</span>
                  </div>
                  <span className={rowNote}>{t.settings.zaloActiveDesc}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDisconnectZalo}
                disabled={zaloDisconnecting}
                className="inline-flex min-h-[44px] items-center gap-2 bg-[#F8E1DC] px-4 text-[15px] font-bold text-marker-deep transition-colors hover:bg-marker hover:text-chalk disabled:cursor-not-allowed disabled:opacity-50"
                title={t.settings.disconnectZaloBtn}
              >
                <Unlink className="h-4 w-4" />
                {zaloDisconnecting ? t.settings.disconnecting : t.settings.disconnectZaloBtn}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => (isAuthenticated ? setShowZaloModal(true) : setShowLoginModal(true))}
              className={`${rowLink} w-full bg-white text-left`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className={rowIcon}>
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <span className={rowTitle}>{t.settings.zaloSection}</span>
                  <span className={rowNote}>{t.settings.zaloDesc}</span>
                </div>
              </div>
              <span className="inline-flex min-h-[40px] shrink-0 items-center bg-teal-400 px-4 text-[14px] font-bold text-pine-950">
                {t.settings.connectNow}
              </span>
            </button>
          )}

          {/* The scan interval is the server's real value, shown only */}
          <div className={`${row} bg-white`}>
            <div className="flex min-w-0 items-center gap-3">
              <div className={rowIcon}>
                <Clock className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className={rowTitle}>{t.settings.scanSection}</span>
                {trackingsError ? (
                  <span className="block text-[14px] text-marker-deep">{(trackingsError as Error).message}</span>
                ) : (
                  <span className={rowNote}>
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
        </div>
      </section>

      {/* Your list */}
      <section aria-labelledby="set-list" className="space-y-3">
        <h2 id="set-list" className="text-xl font-bold text-pine-900">
          {t.settings.listGroup}
        </h2>
        <div className="space-y-px bg-pine-50">
          <Link href="/tracking" className={`${rowLink} group bg-white`}>
            <div className="flex items-center gap-3">
              <div className={rowIcon}>
                <Bookmark className="h-5 w-5" />
              </div>
              <span className={rowTitle}>{t.nav.tracking}</span>
            </div>
            <span className="flex items-center gap-1 text-[14px] text-pine-700">
              {t.settings.viewList}
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
          <Link href="/tracking" className={`${rowLink} group bg-white`}>
            <div className="flex items-center gap-3">
              <div className={rowIcon}>
                <LineChart className="h-5 w-5" />
              </div>
              <span className={rowTitle}>{t.settings.priceHistoryMenu}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-pine-700 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* Language */}
      <section aria-labelledby="set-lang" className="space-y-3">
        <h2 id="set-lang" className="text-xl font-bold text-pine-900">
          {t.settings.languageSection}
        </h2>
        <div className={`${row} flex-wrap bg-white`}>
          <div className="flex min-w-0 items-center gap-3">
            <div className={rowIcon}>
              <Globe className="h-5 w-5" />
            </div>
            <span className={rowNote}>{t.settings.languageDesc}</span>
          </div>
          <LanguageSwitcher variant="select" />
        </div>
      </section>

      {/* Help: no pages exist for these yet, so they are plain rows, not links */}
      <section aria-labelledby="set-help" className="space-y-3">
        <h2 id="set-help" className="text-xl font-bold text-pine-900">
          {t.settings.helpGroup}
        </h2>
        <div className="space-y-px bg-pine-50">
          <div className={`${row} bg-white`}>
            <div className="flex items-center gap-3">
              <div className={rowIcon}>
                <HelpCircle className="h-5 w-5" />
              </div>
              <span className={rowTitle}>{t.settings.supportFeedback}</span>
            </div>
          </div>
          <div className={`${row} bg-white`}>
            <div className="flex items-center gap-3">
              <div className={rowIcon}>
                <FileText className="h-5 w-5" />
              </div>
              <span className={rowTitle}>{t.settings.termsOfService}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Reset this device */}
      <button
        type="button"
        onClick={handleResetUser}
        className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 bg-[#F8E1DC] px-5 text-[15px] font-bold text-marker-deep transition-colors hover:bg-marker hover:text-chalk sm:w-auto"
      >
        <LogOut className="h-4 w-4" />
        {t.settings.resetUserId}
      </button>

      <ZaloConnectModal
        isOpen={showZaloModal}
        onClose={() => setShowZaloModal(false)}
        onConnected={() => {
          qc.invalidateQueries({ queryKey: ["zalo", "profile"] });
        }}
        onRequestLogin={() => setShowLoginModal(true)}
      />

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
}
