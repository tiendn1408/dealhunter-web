"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getUserId } from "@/lib/api";
import { useZaloProfile, useDisconnectZalo } from "@/lib/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { ZaloConnectModal } from "@/components/settings/ZaloConnectModal";
import {
  Settings,
  User,
  Bookmark,
  Bell,
  MessageSquare,
  LineChart,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
  Clock,
  CheckCircle2,
  Sparkles,
  Unlink,
} from "lucide-react";

export default function SettingsPage() {
  const [userId, setUserId] = useState("");
  const [interval, setInterval] = useState("1800");
  const [showIntervalModal, setShowIntervalModal] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [showZaloModal, setShowZaloModal] = useState(false);

  const qc = useQueryClient();
  const { data: zaloProfile = null } = useZaloProfile();
  const disconnectMutation = useDisconnectZalo();
  const zaloDisconnecting = disconnectMutation.isPending;

  useEffect(() => {
    setUserId(getUserId());
    const saved = localStorage.getItem("deal-hunter-poll-interval") || localStorage.getItem("dealhunter_poll_interval");
    if (saved) setInterval(saved);
  }, []);

  const handleSaveInterval = (val: string) => {
    setInterval(val);
    localStorage.setItem("deal-hunter-poll-interval", val);
    setShowIntervalModal(false);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleResetUser = () => {
    if (confirm("Bạn có muốn đặt lại mã định danh người dùng trên thiết bị này?")) {
      localStorage.removeItem("deal-hunter-user-id");
      localStorage.removeItem("dealhunter_user_id");
      localStorage.removeItem("deal-hunter-products-meta");
      localStorage.removeItem("dealhunter_products_meta");
      window.location.reload();
    }
  };

  const handleDisconnectZalo = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Bạn có chắc muốn ngắt kết nối nhận tin nhắn Zalo?")) return;
    try {
      await disconnectMutation.mutateAsync();
    } catch (err) {
      alert("Không thể ngắt kết nối Zalo. Vui lòng thử lại.");
    }
  };

  return (
    <div className="max-w-xl mx-auto py-6 sm:py-10 space-y-6">
      {/* Header matching Screen 10 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-black text-pine-900 tracking-tight">
          Cá nhân
        </h1>
        <button
          type="button"
          onClick={() => setShowIntervalModal(true)}
          className="p-2 text-slate-500 hover:text-pine-900 hover:bg-slate-100 rounded-full transition-colors"
          title="Tùy chỉnh hệ thống"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {savedNotice && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Đã cập nhật chu kỳ quét thành công!</span>
        </div>
      )}

      {/* User Profile Card matching Screen 10 */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-pine-900 text-white flex items-center justify-center font-bold text-xl shadow-xs">
          T
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-pine-900 truncate">
            Người dùng DealHunter
          </h2>
          <p className="text-xs text-slate-400 font-mono truncate mt-0.5">
            ID: {userId.slice(0, 16)}...
          </p>
        </div>
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
              Đang theo dõi
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Xem danh sách</span>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
          </div>
        </Link>

        {/* Cài đặt thông báo & Chu kỳ quét */}
        <button
          type="button"
          onClick={() => setShowIntervalModal(true)}
          className="w-full flex items-center justify-between p-4 sm:p-4.5 hover:bg-slate-50 transition-colors group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-pine-50 text-pine-900 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-800 block">
                Cài đặt chu kỳ quét
              </span>
              <span className="text-[11px] text-slate-400 block">
                Hiện tại: Mỗi {Math.round(parseInt(interval, 10) / 60)} phút
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
        </button>

        {/* Liên kết Zalo (Phase 2) */}
        {zaloProfile?.zalo_connected ? (
          <div className="flex items-center justify-between p-4 sm:p-4.5 bg-blue-50/30 hover:bg-blue-50/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 block">
                    Zalo: {zaloProfile.phone || zaloProfile.zalo_id}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                    Đã kết nối
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block">
                  Đang nhận tin nhắn cảnh báo biến động giá tức thì
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDisconnectZalo}
              disabled={zaloDisconnecting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold transition-colors disabled:opacity-50"
              title="Ngắt kết nối Zalo"
            >
              <Unlink className="w-3.5 h-3.5" />
              <span>{zaloDisconnecting ? "Đang ngắt..." : "Hủy liên kết"}</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowZaloModal(true)}
            className="w-full flex items-center justify-between p-4 sm:p-4.5 hover:bg-slate-50 transition-colors group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-800 block">
                  Liên kết Zalo
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Nhận tin nhắn ZNS khi giá giảm
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold px-2.5 py-1 bg-pine-900 text-white rounded-full">
                Kết nối ngay
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
              Lịch sử giá đã lưu
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
              Hỗ trợ & góp ý
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
              Điều khoản sử dụng
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300" />
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
              Đặt lại mã định danh
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-rose-300 group-hover:text-rose-500 transition-colors" />
        </button>
      </div>

      {/* Interval Modal */}
      {showIntervalModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-xl space-y-4 animate-scaleUp">
            <h3 className="text-lg font-bold text-pine-900">
              Chọn chu kỳ quét giá
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tần suất scheduler kiểm tra và ghi lại giá mới nhất từ các sàn thương mại điện tử.
            </p>

            <div className="space-y-2 pt-2">
              {[
                { val: "1800", label: "Mỗi 30 phút (Khuyến nghị)" },
                { val: "3600", label: "Mỗi 1 giờ" },
                { val: "7200", label: "Mỗi 2 giờ" },
                { val: "21600", label: "Mỗi 6 giờ" },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => handleSaveInterval(opt.val)}
                  className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-semibold border transition-all ${
                    interval === opt.val
                      ? "bg-pine-900 text-white border-pine-900 shadow-2xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowIntervalModal(false)}
              className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Zalo Connect Modal (Phase 2) */}
      <ZaloConnectModal
        isOpen={showZaloModal}
        onClose={() => setShowZaloModal(false)}
        onConnected={() => {
          qc.invalidateQueries({ queryKey: ["zalo", "profile"] });
        }}
      />
    </div>
  );
}
