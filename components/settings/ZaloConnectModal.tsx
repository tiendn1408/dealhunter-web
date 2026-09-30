"use client";

import { useState } from "react";
import { connectZalo, UserProfile } from "@/lib/api";
import {
  X,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface ZaloConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (profile: Partial<UserProfile>) => void;
}

export function ZaloConnectModal({
  isOpen,
  onClose,
  onConnected,
}: ZaloConnectModalProps) {
  const [connectType, setConnectType] = useState<"phone" | "zalo_id">("phone");
  const [phone, setPhone] = useState("");
  const [zaloId, setZaloId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: { phone?: string; zalo_id?: string } = {};
      if (connectType === "phone") {
        const cleanPhone = phone.trim().replace(/\s+/g, "");
        if (!cleanPhone || cleanPhone.length < 9) {
          throw new Error("Vui lòng nhập số điện thoại hợp lệ (tối thiểu 9 số)");
        }
        payload.phone = cleanPhone;
      } else {
        const cleanId = zaloId.trim();
        if (!cleanId) {
          throw new Error("Vui lòng nhập Zalo ID");
        }
        payload.zalo_id = cleanId;
      }

      const res = await connectZalo(payload);
      onConnected({
        phone: res.phone || payload.phone,
        zalo_id: res.zalo_id || payload.zalo_id,
        zalo_connected: true,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Không thể liên kết tài khoản Zalo");
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemo = () => {
    setConnectType("phone");
    setPhone("0988123456");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-scaleUp relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-700 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-pine-900 tracking-tight">
              Liên kết Zalo nhận thông báo giá
            </h3>
            <p className="text-xs text-slate-500">
              Nhận tin nhắn ZNS tức thì khi deal giảm sâu
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Method selector */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setConnectType("phone")}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                connectType === "phone"
                  ? "bg-white text-pine-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Số điện thoại Zalo
            </button>
            <button
              type="button"
              onClick={() => setConnectType("zalo_id")}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                connectType === "zalo_id"
                  ? "bg-white text-pine-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Zalo ID
            </button>
          </div>

          {connectType === "phone" ? (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Số điện thoại đăng ký Zalo
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912 345 678"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pine-900/10 focus:border-pine-900 text-slate-900"
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Hệ thống gửi tin nhắn thông báo biến động giá qua Zalo OA đến số điện thoại này.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Zalo User ID
              </label>
              <div className="relative">
                <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={zaloId}
                  onChange={(e) => setZaloId(e.target.value)}
                  placeholder="Nhập Zalo ID của bạn"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pine-900/10 focus:border-pine-900 text-slate-900 font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Định danh tài khoản Zalo cá nhân được cấp khi quan tâm Official Account của DealHunter.
              </p>
            </div>
          )}

          {/* Quick Demo Pill */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleUseDemo}
              className="text-[11px] text-pine-900 font-semibold hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-pine-800" />
              <span>Dùng số thử nghiệm (Sandbox)</span>
            </button>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Bảo mật & Quyền riêng tư</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Thông tin liên kết chỉ sử dụng duy nhất cho mục đích gửi cảnh báo giá mà bạn đã chủ động thiết lập. Không chia sẻ cho bên thứ ba.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-pine-900 hover:bg-pine-950 disabled:bg-slate-300 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Đang kết nối...</span>
            ) : (
              <span>Xác nhận liên kết Zalo</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
