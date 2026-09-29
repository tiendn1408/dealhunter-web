"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, SlidersHorizontal, ArrowRight, ShieldCheck } from "lucide-react";

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "drop" | "target">("all");

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-10">
      {/* Header matching Screen 9 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-pine-900 tracking-tight">
            Thông báo
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cập nhật biến động giá và thông báo chạm giá mục tiêu
          </p>
        </div>

        <Link
          href="/settings"
          className="p-2 text-slate-500 hover:text-pine-900 hover:bg-slate-100 rounded-full transition-colors"
          title="Cài đặt thông báo"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 mb-8">
        {[
          { id: "all", label: "Tất cả" },
          { id: "drop", label: "Giá giảm" },
          { id: "target", label: "Gần mục tiêu" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-pine-900 text-white shadow-2xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Empty State matching Screen 9 */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-10 sm:p-14 text-center max-w-lg mx-auto shadow-2xs">
        <div className="w-16 h-16 rounded-full bg-pine-50 border border-pine-100 text-pine-800 flex items-center justify-center mx-auto mb-4">
          <Bell className="w-7 h-7 text-pine-800" />
        </div>

        <h3 className="text-lg font-bold text-pine-900 mb-1.5">
          Chưa có thông báo nào
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-6 leading-relaxed">
          Khi sản phẩm bạn đang theo dõi có biến động giá hoặc chạm mức giá mục tiêu, bạn sẽ nhận được thông báo tại đây.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-pine-900 hover:bg-pine-950 text-white rounded-full text-xs font-semibold shadow-2xs transition-all"
        >
          <span>Theo dõi sản phẩm mới</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
