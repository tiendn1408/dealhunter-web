"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { DealHunterLogo } from "./ui/DealHunterLogo";
import { useUnreadNotificationsCount } from "@/lib/hooks";
import {
  Compass,
  Bookmark,
  Bell,
  User,
  Search,
  ExternalLink,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [topSearch, setTopSearch] = useState("");
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();

  const handleTopSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topSearch.trim()) return;
    router.push(`/?url=${encodeURIComponent(topSearch.trim())}`);
  };

  const navTabs = [
    { name: "Trang chủ", href: "/", icon: Compass },
    { name: "Đang theo dõi", href: "/tracking", icon: Bookmark },
    { name: "Thông báo", href: "/notifications", icon: Bell },
    { name: "Cá nhân", href: "/settings", icon: User },
  ];

  return (
    <>
      {/* Desktop Header matching web-dashboard.png */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          {/* Logo & Tagline */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <DealHunterLogo size="md" />
            <span className="hidden xl:inline-block text-xs text-slate-400 font-medium pl-3 border-l border-slate-200">
              Săn đúng giá trước khi mua
            </span>
          </Link>

          {/* Desktop Search / Paste Bar (center) */}
          <form
            onSubmit={handleTopSearch}
            className="hidden md:flex flex-1 max-w-lg items-center relative"
          >
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={topSearch}
              onChange={(e) => setTopSearch(e.target.value)}
              placeholder="Tìm sản phẩm, dán link hoặc nhập từ khóa..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-full bg-slate-100/80 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pine-900/10 focus:border-pine-900 text-slate-800 placeholder-slate-400 transition-all font-normal"
            />
          </form>

          {/* Desktop Navigation Links & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <nav className="hidden lg:flex items-center gap-1 mr-2">
              <Link
                href="/"
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  pathname === "/"
                    ? "bg-pine-50 text-pine-900 font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                Khám phá
              </Link>
              <Link
                href="/tracking"
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  pathname.startsWith("/tracking")
                    ? "bg-pine-50 text-pine-900 font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                Đang theo dõi
              </Link>
            </nav>

            {/* Notification Bell */}
            <Link
              href="/notifications"
              className="p-2 text-slate-500 hover:text-pine-900 hover:bg-slate-100 rounded-full transition-colors relative"
              title="Thông báo biến động giá"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5 animate-pulse" />
              )}
            </Link>

            {/* User Login / Profile Button */}
            <Link
              href="/settings"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-2xs"
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Cá nhân</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (4 tabs matching mobile.png) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-1.5 flex items-center justify-around shadow-lg"
      >
        {navTabs.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 min-w-[64px] rounded-xl transition-all ${
                isActive
                  ? "text-pine-900 font-bold"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-colors relative ${
                  isActive ? "bg-pine-50 text-pine-900" : ""
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.href === "/notifications" && unreadCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-0.5 right-0.5" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
