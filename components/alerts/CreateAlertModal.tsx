"use client";

import { useState } from "react";
import {
  AlertConditionType,
  CreateAlertPayload,
  createAlert,
  replaceTargetPriceRule,
  TargetCleanupError,
  AlertRule,
} from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatVND } from "@/lib/formatting";
import {
  X,
  TrendingDown,
  Target,
  History,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";

interface CreateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  /** Real current price; undefined while the product has no price yet. */
  currentPrice?: number;
  onAlertCreated: (rule: AlertRule) => void;
}

export function CreateAlertModal({
  isOpen,
  onClose,
  productId,
  currentPrice,
  onAlertCreated,
}: CreateAlertModalProps) {
  const { t, formatText } = useLanguage();
  const [conditionType, setConditionType] =
    useState<AlertConditionType>("drop_percent");

  // Inputs for different condition types
  const [dropPercent, setDropPercent] = useState<number>(10);
  // No pre-filled target: the user types it or picks an explicit quick discount
  const [targetPrice, setTargetPrice] = useState<number>(0);
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
          throw new Error(t.alerts.percentRangeError);
        }
      } else if (conditionType === "target_price") {
        thresholdValue = Number(targetPrice);
        if (thresholdValue <= 0) {
          throw new Error(t.alerts.pricePositiveError);
        }
      } else if (conditionType === "lowest_in_days") {
        thresholdValue = Number(lowestDays);
        if (thresholdValue <= 0) {
          throw new Error(t.alerts.daysPositiveError);
        }
      }

      const payload: CreateAlertPayload = {
        rule_type: conditionType,
        threshold_value: thresholdValue,
        expires_in_days: expiresInDays,
      };

      // A new target replaces the previous target rules, so only one target exists per tracking
      const createdRule =
        conditionType === "target_price"
          ? await replaceTargetPriceRule(productId, payload)
          : await createAlert(productId, payload);
      onAlertCreated(createdRule);
      onClose();
    } catch (err: any) {
      // The new target was saved even though old ones could not be removed: show it, keep the error visible
      if (err instanceof TargetCleanupError) onAlertCreated(err.rule);
      setError(err.message || t.alerts.createError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-pine-950/70 flex items-center justify-center p-4">
      <div className="bg-white p-6 sm:p-8 max-w-lg w-full space-y-5 animate-scaleUp relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center text-pine-700 hover:text-pine-900"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h3 className="text-xl font-bold text-pine-900 tracking-tight">
            {t.alerts.modalTitle}
          </h3>
          <p className="text-[15px] text-pine-700 mt-1 leading-relaxed">
            {t.alerts.modalDesc}
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-[#FBE3E4] text-marker-deep text-[13px] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-marker-deep" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Condition Type Selector */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-pine-700 block">
              {t.alerts.selectCondition}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setConditionType("drop_percent")}
                className={`p-3 text-left flex flex-col justify-between transition-colors ${
                  conditionType === "drop_percent"
                    ? " bg-pine-50/70 text-pine-900"
                      : " bg-pine-50 hover:bg-pine-50 text-pine-700"
                      }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <TrendingDown className="w-4 h-4 text-pine-900" />
                  {conditionType === "drop_percent" && (
                    <span className="w-2 h-2 rounded-full bg-pine-900" />
                  )}
                </div>
                <div>
                  <span className="text-[13px] font-bold block">{t.alerts.typeDropPercent}</span>
                  <span className="text-[13px] text-pine-700 block mt-0.5">
                    {t.alerts.whenDropsBy}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setConditionType("target_price")}
                className={`p-3 text-left flex flex-col justify-between transition-colors ${
                  conditionType === "target_price"
                    ? " bg-pine-50/70 text-pine-900"
                      : " bg-pine-50 hover:bg-pine-50 text-pine-700"
                      }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Target className="w-4 h-4 text-pine-900" />
                  {conditionType === "target_price" && (
                    <span className="w-2 h-2 rounded-full bg-pine-900" />
                  )}
                </div>
                <div>
                  <span className="text-[13px] font-bold block">{t.alerts.typeTargetPrice}</span>
                  <span className="text-[13px] text-pine-700 block mt-0.5">
                    {t.alerts.priceBelowTarget}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setConditionType("lowest_in_days")}
                className={`p-3 text-left flex flex-col justify-between transition-colors ${
                  conditionType === "lowest_in_days"
                    ? " bg-pine-50/70 text-pine-900"
                      : " bg-pine-50 hover:bg-pine-50 text-pine-700"
                      }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <History className="w-4 h-4 text-pine-900" />
                  {conditionType === "lowest_in_days" && (
                    <span className="w-2 h-2 rounded-full bg-pine-900" />
                  )}
                </div>
                <div>
                  <span className="text-[13px] font-bold block">{t.alerts.typeLowestDays}</span>
                  <span className="text-[13px] text-pine-700 block mt-0.5">
                    {t.alerts.lowestInNDays}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Condition Specific Inputs */}
          {conditionType === "drop_percent" && (
            <div className="space-y-3 bg-pine-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-pine-700">
                  {t.alerts.minDropPercent}
                </span>
                <span className="text-[13px] text-pine-700">
                  {t.alerts.triggerPriceLabel}{" "}
                  <strong className="text-pine-900">
                    {currentPrice
                      ? formatVND(Math.round(currentPrice * (1 - dropPercent / 100)))
                      : t.common.unknown}
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
                  className="w-full px-4 py-3 text-2xl font-bold bg-white text-pine-900 focus:outline-none text-center"
                />
                <span className="absolute right-4 top-3.5 text-lg font-bold text-pine-700">
                  %
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-1">
                {[5, 10, 15, 20].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setDropPercent(pct)}
                    className={`py-1.5 text-[13px] font-bold transition-colors disabled:opacity-40 ${
                      dropPercent === pct
                        ? "bg-pine-900 text-chalk"
                          : "bg-white text-pine-700 hover:bg-pine-50"
                          }`}
                  >
                    -{pct}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {conditionType === "target_price" && (
            <div className="space-y-3 bg-pine-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-pine-700">
                  {t.alerts.desiredPriceLabel}
                </span>
                <span className="text-[13px] text-pine-700">
                  {t.alerts.currentPriceLabel}{" "}
                  <strong className="text-pine-900">
                    {currentPrice ? formatVND(currentPrice) : t.common.unknown}
                  </strong>
                </span>
              </div>

              <input
                type="number"
                step="10000"
                min="1000"
                value={targetPrice > 0 ? targetPrice : ""}
                onChange={(e) => setTargetPrice(Number(e.target.value))}
                className="w-full px-4 py-3 text-2xl font-bold bg-white text-pine-900 focus:outline-none text-center"
              />

              {targetPrice > 0 && (
                <div className="text-center text-[13px] font-semibold text-pine-700">
                  {t.alerts.displayPriceLabel} {formatVND(targetPrice)}
                </div>
              )}

              <div className="grid grid-cols-4 gap-2 pt-1">
                {[5, 10, 15, 20].map((pct) => {
                  // Quick discounts need a real current price; disabled without one
                  const val = currentPrice ? Math.round(currentPrice * (1 - pct / 100)) : 0;
                  return (
                    <button
                      key={pct}
                      type="button"
                      disabled={!currentPrice}
                      onClick={() => setTargetPrice(val)}
                      className={`py-1.5 text-[13px] font-bold transition-colors disabled:opacity-40 ${
                        val > 0 && targetPrice === val
                          ? "bg-pine-900 text-chalk"
                            : "bg-white text-pine-700 hover:bg-pine-50"
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
            <div className="space-y-3 bg-pine-50 p-4">
              <span className="text-[13px] font-bold text-pine-700 block">
                {t.alerts.comparisonPeriod}
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[30, 60, 90].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setLowestDays(d)}
                    className={`py-2.5 text-[13px] font-bold transition-colors ${
                      lowestDays === d
                        ? "bg-pine-900 text-chalk"
                          : "bg-white text-pine-700 hover:bg-pine-50"
                          }`}
                  >
                    {formatText(t.alerts.lowestDaysPill, { days: d })}
                  </button>
                ))}
              </div>
              <p className="text-[15px] text-pine-700 leading-relaxed">
                {formatText(t.alerts.lowestDaysExplanation, { days: lowestDays })}
              </p>
            </div>
          )}

          {/* Expiration Options */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-pine-700" />
              <label className="text-[13px] font-bold text-pine-700">
                {t.alerts.validityPeriod}
              </label>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: t.alerts.expires30Days, val: 30 },
                { label: t.alerts.expires60Days, val: 60 },
                { label: t.alerts.expires90Days, val: 90 },
                { label: t.alerts.permanent, val: undefined },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setExpiresInDays(opt.val)}
                  className={`py-2 text-[13px] font-semibold transition-colors ${
                    expiresInDays === opt.val
                      ? "bg-pine-900 text-chalk"
                        : "bg-pine-50 text-pine-700 hover:bg-pine-50"
                        }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Channels Preview */}
          <div className="bg-pine-50/70 p-3.5 space-y-2">
            <span className="text-[13px] font-bold text-pine-900 block">
              {t.alerts.channelsSection}
            </span>
            <div className="flex items-center gap-4 text-[13px] text-pine-700">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>{t.alerts.channelInApp}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>{t.alerts.channelZalo}</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-pine-900 hover:bg-pine-800 disabled:bg-pine-100 text-chalk font-bold text-[15px] transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>{t.alerts.creatingBtn}</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{t.alerts.submitBtn}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
