"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { useProductVouchers } from "@/lib/hooks";
import { formatVND, formatDateTime, isKnownPrice } from "@/lib/formatting";
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
  AlertCircle,
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
  const { data: voucherData, isLoading, error, refetch } = useProductVouchers(trackingId);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [openedCollectId, setOpenedCollectId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white p-6 chalk-skeleton space-y-4">
        <div className="h-6 bg-pine-100 w-1/3"></div>
        <div className="h-4 bg-pine-50 w-2/3"></div>
        <div className="h-24 bg-pine-50"></div>
      </div>
    );
  }

  // A failed load is shown as an error, not hidden like "no vouchers"
  if (error) {
    return (
      <div className="bg-white p-6 sm:p-8 space-y-3">
        <h2 className="text-xl font-bold text-pine-900">
          {t.voucher.sectionTitle}
        </h2>
        <div className="p-4 bg-[#FBE3E4] text-marker-deep text-[13px] flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-marker-deep" />
            <span>{(error as Error).message}</span>
          </span>
          <button
            type="button"
            onClick={() => refetch()}
            className="font-semibold underline shrink-0"
          >
            {t.common.retry}
          </button>
        </div>
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
  // null/0 means the product has no price yet: show "unknown", never "0 ₫"
  // calculation is null until the product has a price
  const effectivePrice = isKnownPrice(calculation?.effective_price) ? calculation!.effective_price : null;
  const listedPrice = isKnownPrice(calculation?.listed_price) ? calculation!.listed_price : null;
  const totalSavings = calculation?.total_savings ?? 0;
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
          <span className="inline-flex items-center gap-1 text-[13px] font-bold px-2 py-0.5 bg-teal-200 text-pine-900">
            <Tag className="w-3 h-3" />
            {t.voucher.shopVoucherBadge}
          </span>
        );
      case "platform_voucher":
        return (
          <span className="inline-flex items-center gap-1 text-[13px] font-bold px-2 py-0.5 bg-warn-soft text-warn-ink">
            <Sparkles className="w-3 h-3" />
            {t.voucher.platformVoucherBadge}
          </span>
        );
      case "freeship_voucher":
        return (
          <span className="inline-flex items-center gap-1 text-[13px] font-bold px-2 py-0.5 bg-teal-200 text-pine-950">
            <Layers className="w-3 h-3" />
            {t.voucher.freeshipBadge}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-teal-200 text-pine-950 flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-pine-900">
              {t.voucher.sectionTitle}
            </h2>
          </div>
          <p className="text-[15px] sm:text-sm text-pine-700 font-normal">
            {t.voucher.sectionDesc}
          </p>
        </div>

        {totalSavings > 0 && (
          <div className="shrink-0 bg-teal-200 text-pine-950 px-3 py-1.5 text-right">
            <span className="text-[13px] font-bold block text-teal-600">
              {t.voucher.totalSavingsLabel}
            </span>
            <span className="text-sm sm:text-base font-bold">
              -{formatVND(totalSavings)}
            </span>
          </div>
        )}
      </div>

      {/* 2-Step Workflow Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 1: Collect Vouchers */}
        <div className="bg-pine-50 p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-teal-400 text-pine-950 font-bold text-[13px] flex items-center justify-center shrink-0">
                1
              </span>
              <h3 className="text-[17px] font-bold text-pine-900">
                {t.voucher.step1Title}
              </h3>
            </div>
            <p className="text-[15px] text-pine-700 font-normal pl-8">
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
                    className="bg-white p-3.5 space-y-2 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      {getVoucherBadge(voucher.voucher_type)}
                      {voucher.expires_at && (
                        <span className="text-[13px] text-pine-700">
                          {formatText(t.voucher.expiresLabel, {
                            date: formatDateTime(voucher.expires_at),
                          })}
                        </span>
                      )}
                    </div>

                    <div className="font-bold text-sm text-pine-900">
                      {voucher.title}
                    </div>

                    {voucher.min_order_value > 0 && (
                      <div className="text-[13px] text-pine-700">
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
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-pine-50 hover:bg-pine-100 text-pine-900 text-[13px] font-semibold transition-colors"
                        >
                          {copiedCode === voucher.voucher_code ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-teal-600" />
                              <span className="text-teal-600">
                                {t.voucher.copiedCode}
                              </span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-pine-700" />
                              <span>{voucher.voucher_code}</span>
                            </>
                          )}
                        </button>
                      )}

                      <a
                        href={collectTarget}
                        target="_blank"
                        rel="sponsored noopener noreferrer"
                        onClick={() => handleCollectClick(voucher.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-teal-200 hover:bg-teal-200 text-pine-950 text-[13px] font-bold transition-colors ml-auto"
                      >
                        {openedCollectId === voucher.id ? (
                          <>
                            <Check className="w-3 h-3 text-teal-600" />
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
        <div className="bg-pine-50 p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-teal-400 text-pine-950 font-bold text-[13px] flex items-center justify-center shrink-0">
                2
              </span>
              <h3 className="text-[17px] font-bold text-pine-900">
                {t.voucher.step2Title}
              </h3>
            </div>
            <p className="text-[15px] text-pine-700 font-normal pl-8">
              {t.voucher.step2Desc}
            </p>

            {/* Price calculation summary */}
            <div className="bg-white p-4 space-y-2.5">
              <div className="flex items-center justify-between text-[13px] text-pine-700">
                <span>{t.voucher.listedPriceLabel}</span>
                <span className="font-semibold text-pine-900">
                  {listedPrice !== null ? formatVND(listedPrice) : t.common.unknown}
                </span>
              </div>

              {(calculation?.shop_discount ?? 0) > 0 && (
                <div className="flex items-center justify-between text-[13px] text-marker-deep font-medium">
                  <span>{t.voucher.shopDiscountLabel}</span>
                  <span>-{formatVND(calculation!.shop_discount)}</span>
                </div>
              )}

              {(calculation?.platform_coupon ?? 0) > 0 && (
                <div className="flex items-center justify-between text-[13px] text-marker-deep font-medium">
                  <span>{t.voucher.platformCouponLabel}</span>
                  <span>-{formatVND(calculation!.platform_coupon)}</span>
                </div>
              )}

              {(calculation?.shipping_fee ?? 0) > 0 && (
                <div className="flex items-center justify-between text-[13px] text-pine-700">
                  <span>{t.voucher.shippingFeeLabel}</span>
                  <span>+{formatVND(calculation!.shipping_fee)}</span>
                </div>
              )}

              {calculation && !voucherData.shipping_fee_known && (
                <div className="flex items-center justify-between text-[13px] text-pine-700">
                  <span>{t.voucher.shippingFeeLabel}</span>
                  <span>{t.voucher.shippingUnknown}</span>
                </div>
              )}

              <div className="pt-2 flex items-baseline justify-between">
                <div>
                  <span className="text-[13px] font-bold text-pine-900 block">
                    {t.voucher.effectivePriceLabel}
                  </span>
                  {totalSavings > 0 && (
                    <span className="text-[13px] text-teal-600 font-medium">
                      {formatText(t.voucher.totalSavingsLabel)}: -{formatVND(totalSavings)}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-bold text-teal-600">
                    {effectivePrice !== null ? formatVND(effectivePrice) : t.common.unknown}
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
              rel="sponsored noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-teal-400 hover:bg-teal-400 text-pine-950 text-sm font-bold transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                {effectivePrice !== null
                  ? formatText(t.voucher.buyNowBtn, { price: formatVND(effectivePrice) })
                  : t.voucher.openProductBtn}
              </span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
