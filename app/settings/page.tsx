"use client";

import { useEffect, useState } from "react";
import { getUserId } from "@/lib/api";
import {
  Settings,
  Clock,
  User,
  BellRing,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export default function SettingsPage() {
  const [interval, setInterval] = useState("1800");
  const [userId, setUserId] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setUserId(getUserId());
    const savedInterval = localStorage.getItem("dealhunter_poll_interval");
    if (savedInterval) setInterval(savedInterval);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("dealhunter_poll_interval", interval);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-xl mx-auto py-6 sm:py-8 space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Cài đặt Hệ thống
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Tùy chỉnh thông số quét định kỳ và định danh người dùng trên thiết bị này.
        </p>
      </div>

      {/* Main Settings Form */}
      <form
        onSubmit={handleSave}
        className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6"
      >
        {/* Polling Interval Setting */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-indigo-600" />
            <label className="text-sm font-bold text-slate-900">
              Chu kỳ tự động quét giá (Polling Interval)
            </label>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Tần suất worker chạy ngầm kiểm tra và ghi lại giá mới nhất từ các sàn thương mại điện tử.
          </p>
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
          >
            <option value="1800">Mỗi 30 phút (Khuyến nghị - Mặc định)</option>
            <option value="3600">Mỗi 1 giờ</option>
            <option value="7200">Mỗi 2 giờ</option>
            <option value="21600">Mỗi 6 giờ</option>
          </select>
        </div>

        {/* User Identity Setting */}
        <div className="pt-5 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-indigo-600" />
            <label className="text-sm font-bold text-slate-900">
              Mã định danh người dùng (User ID)
            </label>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Mã định danh lưu trữ tại trình duyệt giúp hệ thống phân biệt danh sách theo dõi của bạn.
          </p>
          <input
            type="text"
            readOnly
            value={userId}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600 select-all"
          />
        </div>

        {/* Save button & feedback */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-xs"
          >
            Lưu thay đổi
          </button>
          {saved && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Đã lưu cài đặt thành công!</span>
            </span>
          )}
        </div>
      </form>

      {/* Phase 2 Preview Card */}
      <div className="bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-white border border-indigo-100 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Sắp ra mắt trong Phase 2: Cảnh báo Zalo & Bộ máy luật
          </h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed mb-4">
          Trong Phase 2, bạn sẽ có thể kết nối tài khoản Zalo ZNS để tự động nhận thông báo ngay khi giá giảm ≥ X%, chạm ngưỡng giá mong muốn, hoặc đạt mức thấp nhất trong 30 ngày.
        </p>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold px-2.5 py-1 bg-white text-indigo-700 rounded-lg border border-indigo-200 shadow-xs">
            🔔 Zalo ZNS Notification
          </span>
          <span className="text-[11px] font-semibold px-2.5 py-1 bg-white text-purple-700 rounded-lg border border-purple-200 shadow-xs">
            🎯 Rule Evaluation Engine
          </span>
        </div>
      </div>
    </div>
  );
}
