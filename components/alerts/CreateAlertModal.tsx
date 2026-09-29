"use client";

import { useState } from "react";
import {
  AlertConditionType,
  CreateAlertPayload,
  createAlert,
  AlertRule,
} from "@/lib/api";
import { formatVND } from "@/lib/formatting";
import {
  X,
  TrendingDown,
  Target,
  History,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Bell,
  Clock,
  Sparkles,
} from "lucide-react";

interface CreateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  currentPrice: number;
  onAlertCreated: (rule: AlertRule) => void;
}

export function CreateAlertModal({
  isOpen,
  onClose,
  productId,
  currentPrice,
  onAlertCreated,
}: CreateAlertModalProps) {
  const [conditionType, setConditionType] =
    useState<AlertConditionType>("drop_percent");

  // Inputs for different condition types
  const [dropPercent, setDropPercent] = useState<number>(10);
  const [targetPrice, setTargetPrice] = useState<number>(
    Math.round(currentPrice * 0.9)
  );
  const [lowestDays, setLowestDays] = useState<number>(30);

  // Expiration option (null = permanent/default)
  const [expiresInDays, setExpiresInDays] = useState<number | undefined>(30);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let thresholdValue = 0;
      if (conditionType === "drop_percent") {
        thresholdValue = Number(dropPercent);
        if (thresholdValue <= 0 || thresholdValue > 99) {
          throw new Error("Phần trăm giảm giá phải từ 1% đến 99%");
        }
      } else if (conditionType === "target_price") {
        thresholdValue = Number(targetPrice);
        if (thresholdValue <= 0) {
          throw new Error("Mức giá mục tiêu phải lớn hơn 0đ");
        }
      } else if (conditionType === "lowest_in_days") {
        thresholdValue = Number(lowestDays);
        if (thresholdValue <= 0) {
          throw new Error("Số ngày theo dõi đáy phải lớn hơn 0");
        }
      }

      const payload: CreateAlertPayload = {
        rule_type: conditionType,
        threshold_value: thresholdValue,
        expires_in_days: expiresInDays,
      };

      const createdRule = await createAlert(productId, payload);
      onAlertCreated(createdRule);
      onClose();
    } catch (err: any) {
      setError(err.message || "Không thể tạo quy tắc cảnh báo. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-scaleUp relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-700 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h3 className="text-xl font-black text-pine-900 tracking-tight">
            Thiết lập cảnh báo giá thông minh
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Hệ thống tự động theo dõi và kích hoạt thông báo đa kênh khi sản phẩm đạt điều kiện bạn chọn.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Condition Type Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Chọn điều kiện kích hoạt
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setConditionType("drop_percent")}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  conditionType === "drop_percent"
                    ? "border-pine-900 bg-pine-50/70 text-pine-900 ring-2 ring-pine-900/10"
                    : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <TrendingDown className="w-4 h-4 text-pine-900" />
                  {conditionType === "drop_percent" && (
                    <span className="w-2 h-2 rounded-full bg-pine-900" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold block">Giảm theo %</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Khi giảm ít nhất X%
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setConditionType("target_price")}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  conditionType === "target_price"
                    ? "border-pine-900 bg-pine-50/70 text-pine-900 ring-2 ring-pine-900/10"
                    : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Target className="w-4 h-4 text-pine-900" />
                  {conditionType === "target_price" && (
                    <span className="w-2 h-2 rounded-full bg-pine-900" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold block">Chạm giá đích</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Giá dưới mức định trước
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setConditionType("lowest_in_days")}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  conditionType === "lowest_in_days"
                    ? "border-pine-900 bg-pine-50/70 text-pine-900 ring-2 ring-pine-900/10"
                    : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <History className="w-4 h-4 text-pine-900" />
                  {conditionType === "lowest_in_days" && (
                    <span className="w-2 h-2 rounded-full bg-pine-900" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold block">Đáy lịch sử</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Thấp nhất trong N ngày
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Condition Specific Inputs */}
          {conditionType === "drop_percent" && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Mức giảm tối thiểu (%)
                </span>
                <span className="text-xs text-slate-500">
                  Giá kích hoạt:{" "}
                  <strong className="text-pine-900">
                    {formatVND(Math.round(currentPrice * (1 - dropPercent / 100)))}
                  </strong>
                </span>
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={dropPercent}
                  onChange={(e) => setDropPercent(Number(e.target.value))}
                  className="w-full px-4 py-3 text-2xl font-black rounded-xl border border-slate-200 bg-white text-pine-900 focus:outline-none focus:ring-2 focus:ring-pine-900/10 focus:border-pine-900 text-center"
                />
                <span className="absolute right-4 top-3.5 text-lg font-bold text-slate-400">
                  %
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-1">
                {[5, 10, 15, 20].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setDropPercent(pct)}
                    className={`py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                      dropPercent === pct
                        ? "bg-pine-900 text-white border-pine-900"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    -{pct}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {conditionType === "target_price" && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Mức giá mong muốn (VNĐ)
                </span>
                <span className="text-xs text-slate-500">
                  Giá hiện tại:{" "}
                  <strong className="text-slate-800">
                    {formatVND(currentPrice)}
                  </strong>
                </span>
              </div>

              <input
                type="number"
                step="10000"
                min="1000"
                value={targetPrice}
                onChange={(e) => setTargetPrice(Number(e.target.value))}
                className="w-full px-4 py-3 text-2xl font-black rounded-xl border border-slate-200 bg-white text-pine-900 focus:outline-none focus:ring-2 focus:ring-pine-900/10 focus:border-pine-900 text-center"
              />

              <div className="text-center text-xs font-semibold text-slate-500">
                Hiển thị: {formatVND(targetPrice)}
              </div>

              <div className="grid grid-cols-4 gap-2 pt-1">
                {[5, 10, 15, 20].map((pct) => {
                  const val = Math.round(currentPrice * (1 - pct / 100));
                  return (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setTargetPrice(val)}
                      className={`py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                        targetPrice === val
                          ? "bg-pine-900 text-white border-pine-900"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      -{pct}%
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {conditionType === "lowest_in_days" && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <span className="text-xs font-bold text-slate-700 block">
                Khoảng thời gian so sánh đáy
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[30, 60, 90].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setLowestDays(d)}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition-colors ${
                      lowestDays === d
                        ? "bg-pine-900 text-white border-pine-900"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Đáy {d} ngày
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Hệ thống sẽ đối chiếu với toàn bộ lịch sử snapshot trong {lowestDays} ngày qua. Nếu giá hiện tại thấp hơn kỷ lục trước đó, thông báo sẽ kích hoạt ngay.
              </p>
            </div>
          )}

          {/* Expiration Options */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Thời hạn hiệu lực của cảnh báo
              </label>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "30 ngày", val: 30 },
                { label: "60 ngày", val: 60 },
                { label: "90 ngày", val: 90 },
                { label: "Vô hạn", val: undefined },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setExpiresInDays(opt.val)}
                  className={`py-2 rounded-xl border text-xs font-semibold transition-colors ${
                    expiresInDays === opt.val
                      ? "bg-pine-900 text-white border-pine-900"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Channels Preview */}
          <div className="bg-pine-50/70 border border-pine-100 rounded-2xl p-3.5 space-y-2">
            <span className="text-xs font-bold text-pine-900 block">
              Kênh tiếp nhận thông báo
            </span>
            <div className="flex items-center gap-4 text-xs text-slate-700">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Trung tâm thông báo (In-app)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zalo OA (Khi đã kết nối)</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-pine-900 hover:bg-pine-950 disabled:bg-slate-300 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Đang lưu quy tắc...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Kích hoạt cảnh báo giá</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
