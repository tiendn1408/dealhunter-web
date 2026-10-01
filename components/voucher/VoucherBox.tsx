"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { useProductVouchers } from "@/lib/hooks";
import { formatVND, formatDateTime } from "@/lib/formatting";
import { ProductVoucher } from "@/lib/api";
import {
  Ticket,
  Copy,
  Check,
  ExternalLink,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Layers,
  Tag,
} from "lucide-react";

interface VoucherBoxProps {
  trackingId: string;
  canonicalUrl?: string;
  affiliateUrl?: string;
}

export function VoucherBox({
  trackingId,
  canonicalUrl,
  affiliateUrl,
}: VoucherBoxProps) {
  const { t, formatText } = useLanguage();
  const { data: voucherData, isLoading } = useProductVouchers(trackingId);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [openedCollectId, setOpenedCollectId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 rounded w-1/3"></div>
        <div className="h-4 bg-slate-100 rounded w-2/3"></div>
        <div className="h-24 bg-slate-100 rounded-2xl"></div>
      </div>
    );
  }

  if (
    !voucherData ||
    (!voucherData.vouchers?.length &&
      !voucherData.calculation?.shop_discount &&
      !voucherData.calculation?.platform_coupon)
  ) {
    return null;
  }

  const { calculation, vouchers } = voucherData;
  const primaryOutboundUrl =
    affiliateUrl ||
    voucherData.affiliate_url ||
    canonicalUrl ||
    voucherData.canonical_url ||
    "#";

  const handleCopyCode = (code: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
    }
  };

  const handleCollectClick = (voucherId: string) => {
    setOpenedCollectId(voucherId);
    setTimeout(() => setOpenedCollectId(null), 3000);
  };

  const getVoucherBadge = (type: ProductVoucher["voucher_type"]) => {
    switch (type) {
      case "shop_voucher":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Tag className="w-3 h-3" />
            {t.voucher.shopVoucherBadge}
          </span>
        );
      case "platform_voucher":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Sparkles className="w-3 h-3" />
            {t.voucher.platformVoucherBadge}
          </span>
        );
      case "freeship_voucher":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
            <Layers className="w-3 h-3" />
            {t.voucher.freeshipBadge}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border border-emerald-200/90 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-pine-900 tracking-tight">
              {t.voucher.sectionTitle}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-normal">
            {t.voucher.sectionDesc}
          </p>
        </div>

        {calculation.total_savings > 0 && (
          <div className="shrink-0 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-2xl text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider block text-emerald-600">
              {t.voucher.totalSavingsLabel}
            </span>
            <span className="text-sm sm:text-base font-black">
              -{formatVND(calculation.total_savings)}
            </span>
          </div>
        )}
      </div>

      {/* 2-Step Workflow Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 1: Collect Vouchers */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                {t.voucher.step1Title}
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-normal pl-8">
              {t.voucher.step1Desc}
            </p>

            {/* List of vouchers */}
            <div className="space-y-3 pt-1">
              {vouchers.map((voucher) => {
                const collectTarget =
                  voucher.affiliate_collect_url ||
                  voucher.collect_url ||
                  primaryOutboundUrl;

                return (
                  <div
                    key={voucher.id}
                    className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 shadow-2xs hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      {getVoucherBadge(voucher.voucher_type)}
                      {voucher.expires_at && (
                        <span className="text-[10px] text-slate-400">
                          {formatText(t.voucher.expiresLabel, {
                            date: formatDateTime(voucher.expires_at),
                          })}
                        </span>
                      )}
                    </div>

                    <div className="font-bold text-sm text-slate-900">
                      {voucher.title}
                    </div>

                    {voucher.min_order_value > 0 && (
                      <div className="text-[11px] text-slate-500">
                        {formatText(t.voucher.minOrderLabel, {
                          min: formatVND(voucher.min_order_value),
                        })}
                      </div>
                    )}

                    <div className="pt-1 flex items-center gap-2 flex-wrap">
                      {voucher.voucher_code && (
                        <button
                          type="button"
                          onClick={() => handleCopyCode(voucher.voucher_code!)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                        >
                          {copiedCode === voucher.voucher_code ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">
                                {t.voucher.copiedCode}
                              </span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-600" />
                              <span>{voucher.voucher_code}</span>
                            </>
                          )}
                        </button>
                      )}

                      <a
                        href={collectTarget}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleCollectClick(voucher.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors ml-auto"
                      >
                        {openedCollectId === voucher.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-700" />
                            <span>{t.voucher.collectedVoucher}</span>
                          </>
                        ) : (
                          <>
                            <span>{t.voucher.collectVoucherBtn}</span>
                            <ExternalLink className="w-3 h-3" />
                          </>
                        )}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step 2: Open Product & Apply Code */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                {t.voucher.step2Title}
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-normal pl-8">
              {t.voucher.step2Desc}
            </p>

            {/* Price calculation summary */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{t.voucher.listedPriceLabel}</span>
                <span className="font-semibold text-slate-800">
                  {formatVND(calculation.listed_price)}
                </span>
              </div>

              {calculation.shop_discount > 0 && (
                <div className="flex items-center justify-between text-xs text-rose-600 font-medium">
                  <span>{t.voucher.shopDiscountLabel}</span>
                  <span>-{formatVND(calculation.shop_discount)}</span>
                </div>
              )}

              {calculation.platform_coupon > 0 && (
                <div className="flex items-center justify-between text-xs text-rose-600 font-medium">
                  <span>{t.voucher.platformCouponLabel}</span>
                  <span>-{formatVND(calculation.platform_coupon)}</span>
                </div>
              )}

              {calculation.shipping_fee > 0 && (
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{t.voucher.shippingFeeLabel}</span>
                  <span>+{formatVND(calculation.shipping_fee)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    {t.voucher.effectivePriceLabel}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    {formatText(t.voucher.totalSavingsLabel)}: -{formatVND(calculation.total_savings)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-black text-emerald-700">
                    {formatVND(calculation.effective_price)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTA Button */}
          <div className="pt-2">
            <a
              href={primaryOutboundUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-xs transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                {formatText(t.voucher.buyNowBtn, {
                  price: formatVND(calculation.effective_price),
                })}
              </span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
