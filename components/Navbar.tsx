"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useUnreadNotificationsCount, useAuth } from "@/lib/hooks";
import { useLanguage } from "@/lib/i18n";
import { LanguageSwitcher } from "./ui/LanguageSwitcher";
import { LoginModal } from "./auth/LoginModal";
import { Bell, Bookmark, ChevronDown, LogIn, LogOut, Plus, User } from "lucide-react";

/**
 * The board's top strip: wordmark, three plain links, one action. The same strip on every page,
 * so the market board is the frame of the whole product.
 */
export default function Navbar() {
  const pathname = usePathname();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const { user, isAuthenticated, logout, sessionExpired } = useAuth();
  const { t } = useLanguage();

  const handleLogout = async () => {
    setShowUserMenu(false);
    try {
      await logout();
    } catch (err: any) {
      alert(err?.message || "Đăng xuất thất bại");
    }
  };

  const links = [
    { name: t.nav.home, href: "/", match: (p: string) => p === "/" },
    { name: t.nav.tracking, href: "/tracking", match: (p: string) => p.startsWith("/tracking") },
    { name: t.nav.notifications, href: "/notifications", match: (p: string) => p.startsWith("/notifications") },
  ];

  const tabs = [
    { name: t.nav.home, href: "/", icon: Plus, match: (p: string) => p === "/" },
    { name: t.nav.tracking, href: "/tracking", icon: Bookmark, match: (p: string) => p.startsWith("/tracking") },
    { name: t.nav.notifications, href: "/notifications", icon: Bell, match: (p: string) => p.startsWith("/notifications") },
    { name: t.nav.settings, href: "/settings", icon: User, match: (p: string) => p.startsWith("/settings") },
  ];

  return (
    <>
      {sessionExpired && !isAuthenticated && (
        <div className="bg-warn-soft text-warn-ink text-sm">
          <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-3 px-4 py-2 md:px-8">
            <span>Phiên đăng nhập đã hết hạn. Bạn đang xem với tư cách khách: đăng nhập lại để xem dữ liệu của mình.</span>
            <button type="button" onClick={() => setShowLoginModal(true)} className="shrink-0 font-semibold underline">
              {t.auth.loginTitle}
            </button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-pine-950 text-chalk">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-3 px-4 md:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <Image src="/icon.png" alt="" width={34} height={34} className="h-[34px] w-[34px]" priority />
            <span className="text-xl font-extrabold leading-none tracking-tight sm:text-2xl">DealHunter</span>
          </Link>

          <nav aria-label="Chính" className="hidden items-center gap-1 md:flex">
            {links.map((l) => {
              const active = l.match(pathname);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative whitespace-nowrap px-2 py-2 text-[14px] font-semibold lg:px-3 lg:text-[15px] transition-colors ${
                    active ? "text-chalk" : "text-chalk/65 hover:text-chalk"
                  }`}
                >
                  {l.name}
                  {l.href === "/notifications" && unreadCount > 0 && (
                    <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-marker px-1.5 text-[12px] font-bold text-chalk">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                  {active && <span aria-hidden className="absolute inset-x-3 -bottom-[13px] h-[3px] rounded-full bg-teal-400" />}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  aria-expanded={showUserMenu}
                  className="hidden h-10 items-center gap-2 rounded-full bg-pine-800 pl-1.5 pr-3 text-sm font-semibold text-chalk transition-colors duration-300 ease-spring hover:bg-pine-700 sm:inline-flex"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-400 text-[13px] font-bold text-pine-950">
                    {user?.name ? user.name[0].toUpperCase() : "U"}
                  </span>
                  <span className="max-w-[120px] truncate">{user?.name || "Thành viên"}</span>
                  <ChevronDown className="h-4 w-4 text-chalk/60" />
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl bg-white p-1.5 text-pine-900 shadow-float ring-1 ring-pine-900/[0.06] animate-fadeIn">{/* taste-skill-ignore: open menu is an overlay */}
                    <div className="px-4 py-3">
                      <p className="truncate text-sm font-bold">{user?.name}</p>
                      <p className="truncate text-sm text-pine-700">{user?.email}</p>
                    </div>
                    <Link
                      href="/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors duration-300 hover:bg-pine-50"
                    >
                      <User className="h-4 w-4" />
                      {t.nav.settings}
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium text-marker-deep transition-colors duration-300 hover:bg-pine-50"
                    >
                      <LogOut className="h-4 w-4" />
                      {t.auth.logout}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full bg-pine-800 px-4 text-sm font-bold text-chalk transition-colors duration-300 ease-spring hover:bg-pine-700"
              >
                <LogIn className="hidden h-4 w-4 sm:block" />
                <span>{t.auth.login}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

      {/* Phone: the same strip as a bottom bar, four places */}
      <nav aria-label="Điều hướng" className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 bg-pine-950 text-chalk md:hidden">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-[60px] flex-col items-center justify-center gap-1 text-[13px] font-semibold ${
                active ? "text-teal-300" : "text-chalk/65"
              }`}
            >
              {active && <span aria-hidden className="absolute inset-x-6 top-0 h-[3px] rounded-full bg-teal-400" />}
              <span className="relative">
                <Icon className="h-5 w-5" />
                {tab.href === "/notifications" && unreadCount > 0 && (
                  <span className="absolute -right-1.5 -top-1 h-2.5 w-2.5 rounded-full bg-marker" />
                )}
              </span>
              {tab.name}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
