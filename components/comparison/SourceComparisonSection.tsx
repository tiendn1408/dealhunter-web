"use client";

import { useMemo, useState } from "react";
import {
  useComparison,
  useMatchSuggestions,
  useAcceptMatchSuggestion,
  useDismissMatchSuggestion,
  useTriggerAutoMatch,
} from "@/lib/hooks";
import { MatchSuggestion } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { ProductImage } from "@/components/ui/ProductImage";
import { PlatformBadge } from "@/components/ui/Badge";
import { detectPlatform, formatVND, formatRelativeTime, isKnownPrice } from "@/lib/formatting";
import {
  ExternalLink,
  Plus,
  Sparkles,
  Clock,
  AlertCircle,
  Store,
  CheckCircle2,
  X,
  Search,
} from "lucide-react";

interface SourceComparisonSectionProps {
  trackingId: string;
  productId?: string;
  onLinkSource: () => void;
}

export function SourceComparisonSection({
  trackingId,
  productId,
  onLinkSource,
}: SourceComparisonSectionProps) {
  const { t, formatText } = useLanguage();
  const { data: comparison, isLoading, error } = useComparison(trackingId);

  const effectiveProductId = productId || comparison?.product_id;
  const {
    data: suggestions = [],
    error: suggestionsError,
    refetch: refetchSuggestions,
  } = useMatchSuggestions(trackingId);
  const acceptMutation = useAcceptMatchSuggestion(trackingId);
  const dismissMutation = useDismissMatchSuggestion(trackingId);
  const autoMatchMutation = useTriggerAutoMatch(trackingId);

  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  // The last scan partly failed: its result may be missing candidates (kept until the next scan)
  const [scanIncomplete, setScanIncomplete] = useState(false);
  // Failures of auto-match / accept / dismiss are shown, never reported as "nothing found"
  const [suggestionActionError, setSuggestionActionError] = useState<string | null>(null);

  const sortedSources = useMemo(() => {
    if (!comparison?.sources || comparison.sources.length === 0) return [];
    return [...comparison.sources].sort((a, b) => {
      if (a.is_best_deal && !b.is_best_deal) return -1;
      if (!a.is_best_deal && b.is_best_deal) return 1;
      // Sources without a known price sort last
      const pa = isKnownPrice(a.effective_price) ? a.effective_price : Number.MAX_SAFE_INTEGER;
      const pb = isKnownPrice(b.effective_price) ? b.effective_price : Number.MAX_SAFE_INTEGER;
      return pa - pb;
    });
  }, [comparison?.sources]);

  const handleTriggerAutoMatch = async () => {
    setIsScanning(true);
    setScanMessage(null);
    setScanIncomplete(false);
    setSuggestionActionError(null);
    try {
      const res = await autoMatchMutation.mutateAsync();
      const incomplete = res.incomplete === true;
      setScanIncomplete(incomplete);
      // Defensive: a null/missing list means none (also normalised in triggerAutoMatch)
      const found = (res?.new_suggestions?.length ?? 0) > 0 || (res?.auto_linked_sources?.length ?? 0) > 0;
      if (found) {
        setScanMessage(t.comparison.autoMatchFound);
      } else if (!incomplete) {
        // "Nothing found" only for a complete run; a partial run cannot say that
        setScanMessage(t.comparison.autoMatchNone);
      }
      setTimeout(() => setScanMessage(null), 4000);
    } catch (err: any) {
      setSuggestionActionError(err?.message || t.common.error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleAccept = async (sugg: MatchSuggestion) => {
    setAcceptingId(sugg.id);
    setSuggestionActionError(null);
    try {
      await acceptMutation.mutateAsync({
        productId: sugg.product_id || effectiveProductId || trackingId,
        suggestionId: sugg.id,
      });
    } catch (err: any) {
      setSuggestionActionError(err?.message || t.common.error);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDismiss = async (sugg: MatchSuggestion) => {
    setSuggestionActionError(null);
    try {
      await dismissMutation.mutateAsync({
        productId: sugg.product_id || effectiveProductId || trackingId,
        suggestionId: sugg.id,
      });
    } catch (err: any) {
      setSuggestionActionError(err?.message || t.common.error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 sm:p-8 space-y-4 chalk-skeleton rounded-[1.75rem] shadow-soft ring-1 ring-pine-900/[0.06]">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-5 w-44 bg-pine-100" />
            <div className="h-3 w-64 rounded-full bg-pine-50" />
          </div>
          <div className="h-8 w-28 bg-pine-100" />
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 w-full rounded-2xl bg-pine-50"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 sm:p-8 space-y-3 rounded-[1.75rem] shadow-soft ring-1 ring-pine-900/[0.06]">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-pine-900">
            {t.comparison.title}
          </h2>
          <button
            type="button"
            onClick={onLinkSource}
            className="inline-flex min-h-[44px] items-center gap-1.5 px-4 bg-pine-900 hover:bg-pine-800 text-chalk text-[13px] font-semibold transition-colors rounded-full"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.comparison.addAnotherPlatform}</span>
          </button>
        </div>
        <div className="p-4 bg-pine-50 text-pine-700 text-[13px] flex items-center gap-2 rounded-2xl">
          <AlertCircle className="w-4 h-4 shrink-0 text-pine-700" />
          <span>{t.comparison.loadError}</span>
        </div>
      </div>
    );
  }

  // Suggestions Component for both single and multi-source modes
  const renderSuggestions = () => {
    const errorMessage =
      suggestionActionError || (suggestionsError ? (suggestionsError as Error).message : null);
    const errorBox = errorMessage && (
      <div className="p-3 bg-[#FBE3E4] text-marker-deep text-[13px] flex items-center justify-between gap-2 rounded-2xl">
        <span className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-marker-deep" />
          <span>{errorMessage}</span>
        </span>
        {!suggestionActionError && (
          <button
            type="button"
            onClick={() => refetchSuggestions()}
            className="font-semibold underline shrink-0"
          >
            {t.common.retry}
          </button>
        )}
      </div>
    );

    if (!suggestions || suggestions.length === 0) return errorBox || null;

    return (
      <>
        {errorBox}
        <div className="bg-pine-50 p-4 sm:p-5 space-y-3 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pine-900" />
              <h3 className="text-[15px] font-bold text-pine-900">
                {t.comparison.suggestionsTitle}
              </h3>
            </div>
            <span className="text-[13px] font-semibold text-pine-700 bg-white rounded-full px-2.5 py-1">
              {suggestions.length}
            </span>
          </div>
          <p className="text-[15px] text-pine-700">
            {t.comparison.suggestionsDesc}
          </p>

          <div className="space-y-2.5 pt-1">
            {suggestions.map((sugg) => (
              <div
                key={sugg.id}
                className="bg-white p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors rounded-2xl"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <PlatformBadge platformOrUrl={sugg.candidate_platform} />
                    <span className="text-[13px] font-bold rounded-full px-2.5 py-1 bg-teal-200 text-pine-950">
                      {formatText(t.comparison.matchConfidence, {
                        percent: Math.round(sugg.match_score * 100),
                      })}
                    </span>
                    {sugg.candidate_seller && (
                      <span className="text-[13px] text-pine-700 truncate">
                        {sugg.candidate_seller}
                      </span>
                    )}
                  </div>
                  <h4 className="text-[15px] font-semibold text-pine-900 truncate">
                    {sugg.candidate_title}
                  </h4>
                  {sugg.candidate_price > 0 && (
                    <div className="text-[13px] font-bold text-pine-700">
                      {formatVND(sugg.candidate_price)}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleAccept(sugg)}
                    disabled={acceptingId === sugg.id}
                    className="inline-flex min-h-[44px] items-center gap-1.5 px-4 bg-pine-900 hover:bg-pine-800 text-chalk text-[13px] font-semibold transition-colors disabled:opacity-50 rounded-full"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {acceptingId === sugg.id
                        ? t.comparison.acceptingSuggestion
                        : t.comparison.acceptSuggestionBtn}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDismiss(sugg)}
                    className="flex h-11 w-11 items-center justify-center text-pine-700 hover:text-pine-900 hover:bg-pine-50 transition-colors rounded-full"
                    title={t.comparison.dismissSuggestionBtn}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  // Case 1: Only 1 source tracked so far
  if (!comparison?.comparison_available || sortedSources.length < 2) {
    const primarySource = sortedSources[0];

    return (
      <div className="bg-white p-6 sm:p-8 space-y-4 rounded-[1.75rem] shadow-soft ring-1 ring-pine-900/[0.06]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-pine-50 text-pine-900 flex items-center justify-center shrink-0">
              <Store className="w-5 h-5 text-pine-900" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-pine-900">
                {t.comparison.title}
              </h2>
              <p className="text-[15px] text-pine-700">
                {t.comparison.singleSourceSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleTriggerAutoMatch}
              disabled={isScanning}
              className="inline-flex min-h-[44px] items-center gap-1.5 px-4 bg-pine-50 hover:bg-pine-100 text-pine-900 text-[13px] font-semibold transition-colors disabled:opacity-50 rounded-full"
            >
              <Search className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
              <span>{isScanning ? t.comparison.autoMatching : t.comparison.autoMatchBtn}</span>
            </button>
            <button
              type="button"
              onClick={onLinkSource}
              className="inline-flex min-h-[44px] items-center gap-1.5 px-4 bg-pine-900 hover:bg-pine-800 text-chalk text-[13px] font-semibold transition-colors rounded-full"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.comparison.linkSourceBtn}</span>
            </button>
          </div>
        </div>

        {scanMessage && (
          <div className="bg-teal-200 p-3 text-[15px] font-medium text-pine-950 flex items-center gap-2 animate-fadeIn rounded-2xl">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{scanMessage}</span>
          </div>
        )}
        {scanIncomplete && (
          <div className="p-3 bg-warn-soft text-warn-ink text-[13px] font-medium flex items-center gap-2 rounded-2xl">
            <AlertCircle className="w-4 h-4 text-warn-ink shrink-0" />
            <span>{t.comparison.autoMatchIncomplete}</span>
          </div>
        )}

        <div className="p-5 bg-pine-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap text-[13px] text-pine-700">
              <span>{t.comparison.singleSourceTracking}</span>
              {primarySource ? (
                <PlatformBadge platformOrUrl={primarySource.platform} />
              ) : (
                <span className="font-semibold text-pine-900">{t.comparison.onePlatform}</span>
              )}
            </div>
            <p className="text-[15px] text-pine-700 max-w-md leading-relaxed">
              {t.comparison.singleSourceHelp}
            </p>
          </div>

          <button
            type="button"
            onClick={onLinkSource}
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 px-4 bg-pine-900 hover:bg-pine-800 text-chalk text-[13px] font-semibold transition-colors shrink-0 rounded-full"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.comparison.linkSourceBtn}</span>
          </button>
        </div>

        {/* GAP-03: Suggestions inside single-source view */}
        {renderSuggestions()}
      </div>
    );
  }

  // Case 2: Multi-source available (comparison_available = true)
  const bestDeal = comparison.best_deal;

  return (
    <div className="bg-white p-6 sm:p-8 space-y-5 rounded-[1.75rem] shadow-soft ring-1 ring-pine-900/[0.06]">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-pine-50 text-pine-900 flex items-center justify-center shrink-0">
            <Store className="w-5 h-5 text-pine-900" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-pine-900">
              {t.comparison.title}
            </h2>
            <p className="text-[15px] text-pine-700">
              {t.comparison.multiSourceSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleTriggerAutoMatch}
            disabled={isScanning}
            className="inline-flex min-h-[44px] items-center gap-1.5 px-4 bg-pine-50 hover:bg-pine-100 text-pine-900 text-[13px] font-semibold transition-colors disabled:opacity-50 rounded-full"
          >
            <Search className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
            <span>{isScanning ? t.comparison.autoMatching : t.comparison.autoMatchBtn}</span>
          </button>
          <button
            type="button"
            onClick={onLinkSource}
            className="inline-flex min-h-[44px] items-center gap-1.5 px-4 bg-pine-900 hover:bg-pine-800 text-chalk text-[13px] font-semibold transition-colors self-start sm:self-auto rounded-full"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.comparison.addAnotherPlatform}</span>
          </button>
        </div>
      </div>

      {scanMessage && (
        <div className="bg-teal-200 p-3 text-[15px] font-medium text-pine-950 flex items-center gap-2 animate-fadeIn rounded-2xl">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{scanMessage}</span>
        </div>
      )}
      {scanIncomplete && (
        <div className="p-3 bg-warn-soft text-warn-ink text-[13px] font-medium flex items-center gap-2 rounded-2xl">
          <AlertCircle className="w-4 h-4 text-warn-ink shrink-0" />
          <span>{t.comparison.autoMatchIncomplete}</span>
        </div>
      )}

      {/* 2. GAP-03 Suggestions */}
      {renderSuggestions()}

      {/* 3. Best Deal Summary Banner */}
      {bestDeal && bestDeal.saving_vs_most_expensive > 0 && (
        <div className="bg-teal-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold rounded-full px-2.5 py-1 bg-teal-400 text-pine-950 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>{t.comparison.bestDealTitle}</span>
              </span>
              <PlatformBadge platformOrUrl={bestDeal.platform} />
            </div>
            <p className="text-[15px] text-teal-600 font-medium pt-0.5">
              {formatText(t.comparison.savingSummary, {
                amount: formatVND(bestDeal.saving_vs_most_expensive),
                percent: bestDeal.saving_percent.toFixed(1),
              })}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[13px] font-bold text-teal-600 block">
              {t.comparison.bestEffectivePrice}
            </span>
            <span className="text-2xl font-extrabold text-pine-950 block sm:text-3xl">
              {isKnownPrice(bestDeal.effective_price) ? formatVND(bestDeal.effective_price) : t.common.unknown}
            </span>
          </div>
        </div>
      )}

      {/* 4. Table / List of Marketplace Sources */}
      <div className="space-y-3 pt-1">
        {sortedSources.map((source) => {
          const isWinningDeal = source.is_best_deal && comparison.comparison_available;
          const hasPrice = isKnownPrice(source.effective_price) && source.captured_at !== null;

          return (
            <div
              key={source.source_id}
              className={`rounded-[1.5rem] p-4 sm:p-5 transition-colors duration-500 ease-spring flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isWinningDeal ? "bg-teal-200/70 ring-1 ring-teal-400/40" : "bg-paper hover:bg-pine-50"
              }`}
            >
              {/* Left Column: product photo, Platform, Shop Name, Status */}
              <div className="flex min-w-0 flex-1 items-start gap-3.5">
              <ProductImage src={source.image_url} alt={source.seller_name || source.platform} size={44} />
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <PlatformBadge platformOrUrl={source.platform} />
                  {isWinningDeal && (
                    <span className="text-[13px] font-bold rounded-full px-2.5 py-1 bg-teal-200 text-pine-950 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-teal-600" />
                      <span>{t.comparison.cheapest}</span>
                    </span>
                  )}
                  <span
                    className={`text-[13px] font-semibold rounded-full px-2.5 py-1 ${
                      !hasPrice
                        ? "bg-warn-soft text-warn-ink"
                          : source.in_stock === false
                            ? "bg-[#FBE3E4] text-marker-deep"
                              : "bg-pine-50 text-pine-700"
                              }`}
                  >
                    {!hasPrice
                      ? t.comparison.scanning
                      : source.in_stock === null
                      ? t.comparison.stockUnknown
                      : source.in_stock
                      ? t.comparison.inStock
                      : t.comparison.outOfStock}
                  </span>
                </div>

                <p className="text-[15px] text-pine-700 truncate font-medium">
                  {source.seller_name
                    ? formatText(t.comparison.shopLabel, { name: source.seller_name })
                    : t.comparison.officialStore}
                </p>

                {/* Sub-details: Listed price & Shipping fee */}
                {hasPrice && (
                  <div className="flex items-center gap-3 text-[13px] text-pine-700 pt-0.5">
                    <span>
                      {t.comparison.listedPrice}{" "}
                      <span className="font-semibold text-pine-700">
                        {formatVND(source.listed_price)}
                      </span>
                    </span>
                    <span>·</span>
                    <span>
                      {t.comparison.shippingFee}{" "}
                      <span className="font-semibold text-pine-700">
                        {source.shipping_fee === null
                          ? t.common.unknown
                          : source.shipping_fee > 0
                          ? formatVND(source.shipping_fee)
                          : t.comparison.free}
                      </span>
                    </span>
                  </div>
                )}
              </div>
              </div>

              {/* Right Column: Effective Price & Buy Link Button */}
              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 ">
                <div className="text-left sm:text-right">
                  <span className="text-[13px] font-bold text-pine-700 block">
                    {t.comparison.effectivePrice}
                  </span>
                  <span
                    className={`text-xl sm:text-2xl font-extrabold block ${
                      isWinningDeal ? "text-pine-950" : "text-pine-900"
                      }`}
                  >
                    {hasPrice ? formatVND(source.effective_price) : t.comparison.checking}
                  </span>
                </div>

                {source.canonical_url ? (
                  <a
                    href={source.affiliate_url || source.canonical_url}
                    target="_blank"
                    rel="sponsored noopener noreferrer"
                    className={`group/buy inline-flex min-h-[44px] items-center gap-2 rounded-full py-1 pl-4 pr-1 text-[14px] font-bold transition-[transform,background-color] duration-500 ease-spring active:scale-[0.98] ${
                      isWinningDeal ? "bg-pine-900 text-chalk hover:bg-pine-800" : "bg-white text-pine-900 shadow-soft hover:bg-pine-50"
                    }`}
                  >
                    <span>{formatText(t.landing.buyOn, { platform: detectPlatform(source.platform || source.canonical_url).name })}</span>
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-500 ease-spring group-hover/buy:-translate-y-px group-hover/buy:translate-x-0.5 ${isWinningDeal ? "bg-white/10" : "bg-pine-900/[0.06]"}`}>
                      <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                  </a>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Footer info */}
      <div className="pt-2 flex items-center justify-between text-[13px] text-pine-700">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>
            {formatText(t.comparison.dataTimestamp, {
              time: formatRelativeTime(comparison.computed_at),
            })}
          </span>
        </div>
        <span>{t.comparison.effectivePriceFootnote}</span>
      </div>
    </div>
  );
}
