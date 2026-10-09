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
import { PlatformBadge } from "@/components/ui/Badge";
import { formatVND, formatRelativeTime, isKnownPrice } from "@/lib/formatting";
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
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-5 w-44 bg-slate-200 rounded-md" />
            <div className="h-3 w-64 bg-slate-100 rounded-md" />
          </div>
          <div className="h-8 w-28 bg-slate-200 rounded-full" />
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 w-full bg-slate-50 border border-slate-100 rounded-2xl"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-pine-900 tracking-tight">
            {t.comparison.title}
          </h2>
          <button
            type="button"
            onClick={onLinkSource}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-pine-900 hover:bg-pine-950 text-white rounded-full text-xs font-semibold shadow-2xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.comparison.addAnotherPlatform}</span>
          </button>
        </div>
        <div className="p-4 bg-slate-50 text-slate-600 border border-slate-200 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-slate-400" />
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
      <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-2xl text-xs flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
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
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pine-900" />
              <h3 className="text-xs sm:text-sm font-bold text-pine-900">
                {t.comparison.suggestionsTitle}
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
              {suggestions.length}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {t.comparison.suggestionsDesc}
          </p>

          <div className="space-y-2.5 pt-1">
            {suggestions.map((sugg) => (
              <div
                key={sugg.id}
                className="bg-white border border-slate-200/90 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-all"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <PlatformBadge platformOrUrl={sugg.candidate_platform} />
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                      {formatText(t.comparison.matchConfidence, {
                        percent: Math.round(sugg.match_score * 100),
                      })}
                    </span>
                    {sugg.candidate_seller && (
                      <span className="text-[11px] text-slate-400 truncate">
                        {sugg.candidate_seller}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs sm:text-sm font-semibold text-pine-900 truncate">
                    {sugg.candidate_title}
                  </h4>
                  {sugg.candidate_price > 0 && (
                    <div className="text-xs font-bold text-slate-700">
                      {formatVND(sugg.candidate_price)}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleAccept(sugg)}
                    disabled={acceptingId === sugg.id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-pine-900 hover:bg-pine-950 text-white rounded-full text-xs font-semibold transition-all disabled:opacity-50 shadow-2xs"
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
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
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
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-pine-50 text-pine-900 flex items-center justify-center shrink-0">
              <Store className="w-5 h-5 text-pine-900" />
            </div>
            <div>
              <h2 className="text-lg font-black text-pine-900 tracking-tight">
                {t.comparison.title}
              </h2>
              <p className="text-xs text-slate-500">
                {t.comparison.singleSourceSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleTriggerAutoMatch}
              disabled={isScanning}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-pine-900 rounded-full text-xs font-semibold transition-all disabled:opacity-50"
            >
              <Search className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
              <span>{isScanning ? t.comparison.autoMatching : t.comparison.autoMatchBtn}</span>
            </button>
            <button
              type="button"
              onClick={onLinkSource}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-pine-900 hover:bg-pine-950 text-white rounded-full text-xs font-semibold shadow-2xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.comparison.linkSourceBtn}</span>
            </button>
          </div>
        </div>

        {scanMessage && (
          <div className="p-3 bg-cyan-50 border border-cyan-200 text-cyan-900 rounded-2xl text-xs font-medium flex items-center gap-2 animate-fadeIn">
            <Sparkles className="w-4 h-4 text-cyan-700 shrink-0" />
            <span>{scanMessage}</span>
          </div>
        )}
        {scanIncomplete && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{t.comparison.autoMatchIncomplete}</span>
          </div>
        )}

        <div className="p-5 rounded-2xl bg-slate-50/90 border border-dashed border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-700">
              <span>{t.comparison.singleSourceTracking}</span>
              {primarySource ? (
                <PlatformBadge platformOrUrl={primarySource.platform} />
              ) : (
                <span className="font-semibold text-slate-800">{t.comparison.onePlatform}</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 max-w-md leading-relaxed">
              {t.comparison.singleSourceHelp}
            </p>
          </div>

          <button
            type="button"
            onClick={onLinkSource}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-pine-900 hover:bg-pine-950 text-white rounded-full text-xs font-semibold shadow-2xs transition-all shrink-0"
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
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-5">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-pine-50 text-pine-900 flex items-center justify-center shrink-0">
            <Store className="w-5 h-5 text-pine-900" />
          </div>
          <div>
            <h2 className="text-lg font-black text-pine-900 tracking-tight">
              {t.comparison.title}
            </h2>
            <p className="text-xs text-slate-500">
              {t.comparison.multiSourceSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleTriggerAutoMatch}
            disabled={isScanning}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-pine-900 rounded-full text-xs font-semibold transition-all disabled:opacity-50"
          >
            <Search className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
            <span>{isScanning ? t.comparison.autoMatching : t.comparison.autoMatchBtn}</span>
          </button>
          <button
            type="button"
            onClick={onLinkSource}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-pine-900 hover:bg-pine-950 text-white rounded-full text-xs font-semibold shadow-2xs transition-all self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.comparison.addAnotherPlatform}</span>
          </button>
        </div>
      </div>

      {scanMessage && (
        <div className="p-3 bg-cyan-50 border border-cyan-200 text-cyan-900 rounded-2xl text-xs font-medium flex items-center gap-2 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-cyan-700 shrink-0" />
          <span>{scanMessage}</span>
        </div>
      )}
      {scanIncomplete && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>{t.comparison.autoMatchIncomplete}</span>
        </div>
      )}

      {/* 2. GAP-03 Suggestions */}
      {renderSuggestions()}

      {/* 3. Best Deal Summary Banner */}
      {bestDeal && bestDeal.saving_vs_most_expensive > 0 && (
        <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-700 text-white uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>{t.comparison.bestDealTitle}</span>
              </span>
              <PlatformBadge platformOrUrl={bestDeal.platform} />
            </div>
            <p className="text-xs text-emerald-900 font-medium pt-0.5">
              {formatText(t.comparison.savingSummary, {
                amount: formatVND(bestDeal.saving_vs_most_expensive),
                percent: bestDeal.saving_percent.toFixed(1),
              })}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block tracking-wider">
              {t.comparison.bestEffectivePrice}
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-950 block">
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
              className={`rounded-2xl p-4 sm:p-5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isWinningDeal
                  ? "bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-300/60"
                  : "bg-slate-50/70 border-slate-200/80 hover:bg-slate-50"
              }`}
            >
              {/* Left Column: Platform, Shop Name, Status */}
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <PlatformBadge platformOrUrl={source.platform} />
                  {isWinningDeal && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      <span>{t.comparison.cheapest}</span>
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      !hasPrice
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : source.in_stock === false
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
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

                <p className="text-xs text-slate-600 truncate font-medium">
                  {source.seller_name
                    ? formatText(t.comparison.shopLabel, { name: source.seller_name })
                    : t.comparison.officialStore}
                </p>

                {/* Sub-details: Listed price & Shipping fee */}
                {hasPrice && (
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                    <span>
                      {t.comparison.listedPrice}{" "}
                      <span className="font-semibold text-slate-700">
                        {formatVND(source.listed_price)}
                      </span>
                    </span>
                    <span>·</span>
                    <span>
                      {t.comparison.shippingFee}{" "}
                      <span className="font-semibold text-slate-700">
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

              {/* Right Column: Effective Price & Buy Link Button */}
              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    {t.comparison.effectivePrice}
                  </span>
                  <span
                    className={`text-lg sm:text-xl font-black block ${
                      isWinningDeal ? "text-emerald-950" : "text-slate-900"
                    }`}
                  >
                    {hasPrice ? formatVND(source.effective_price) : t.comparison.checking}
                  </span>
                </div>

                {source.canonical_url ? (
                  <a
                    href={source.affiliate_url || source.canonical_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                      isWinningDeal
                        ? "bg-emerald-800 hover:bg-emerald-900 text-white"
                        : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    <span>{t.comparison.visitStore}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Footer info */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
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
