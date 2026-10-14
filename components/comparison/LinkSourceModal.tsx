"use client";

import { useState } from "react";
import { useLinkSource } from "@/lib/hooks";
import { useLanguage } from "@/lib/i18n";
import { PlatformBadge } from "@/components/ui/Badge";
import { detectPlatform } from "@/lib/formatting";
import { X, Link2, Sparkles, AlertCircle } from "lucide-react";

interface LinkSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  trackingId: string;
}

export function LinkSourceModal({
  isOpen,
  onClose,
  productId,
  trackingId,
}: LinkSourceModalProps) {
  const { t } = useLanguage();
  const [url, setUrl] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const linkMutation = useLinkSource(trackingId);

  if (!isOpen) return null;

  const handleClose = () => {
    setUrl("");
    setLocalError(null);
    onClose();
  };

  const detectedPlatform = url.trim() ? detectPlatform(url) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim();

    if (!cleanUrl) {
      setLocalError(t.comparison.enterUrlError);
      return;
    }

    if (!productId) {
      setLocalError(t.comparison.missingProductError);
      return;
    }

    setLocalError(null);

    linkMutation.mutate(
      { productId, url: cleanUrl },
      {
        onSuccess: () => {
          setUrl("");
          setLocalError(null);
          onClose();
        },
        onError: (err: any) => {
          const msg = err?.message || "";
          if (msg.includes("unsupported platform")) {
            setLocalError(t.comparison.unsupportedPlatformError);
          } else {
            setLocalError(msg || t.comparison.linkFailed);
          }
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-pine-950/70 flex items-center justify-center p-4">
      <div className="bg-white p-6 sm:p-8 max-w-md w-full space-y-5 animate-scaleUp relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center text-pine-700 hover:text-pine-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="w-10 h-10 bg-pine-50 text-pine-900 flex items-center justify-center mb-2">
            <Link2 className="w-5 h-5 text-pine-900" />
          </div>
          <h3 className="text-xl font-bold text-pine-900 tracking-tight">
            {t.comparison.linkModalTitle}
          </h3>
          <p className="text-[15px] text-pine-700 leading-relaxed">
            {t.comparison.linkModalDesc}
          </p>
        </div>

        {/* Error Alert */}
        {localError && (
          <div className="p-3.5 bg-[#F8E1DC] text-marker-deep text-[13px] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-marker-deep mt-0.5" />
            <span className="leading-relaxed">{localError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-pine-700 block">
              {t.comparison.urlInputLabel}
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (localError) setLocalError(null);
              }}
              placeholder={t.comparison.urlPlaceholder}
              className="w-full px-4 py-3 text-[15px] bg-pine-50 text-pine-900 placeholder:text-pine-700 focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          {/* Real-time Platform Recognition */}
          {detectedPlatform && detectedPlatform.id !== "other" && (
            <div className="flex items-center gap-2 text-[13px] text-pine-700 bg-pine-50 p-3">
              <span className="text-pine-700 font-medium">{t.comparison.detectedLabel}</span>
              <PlatformBadge platformOrUrl={url} />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={linkMutation.isPending || !url.trim()}
            className="w-full py-3.5 bg-pine-900 hover:bg-pine-800 disabled:bg-pine-100 text-chalk font-bold text-[15px] transition-colors flex items-center justify-center gap-2"
          >
            {linkMutation.isPending ? (
              <span>{t.comparison.linkingInProgress}</span>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                <span>{t.comparison.linkButtonText}</span>
              </>
            )}
          </button>
        </form>

        {/* Helpful Tip */}
        <div className="bg-pine-50/80 p-3.5 text-[13px] text-pine-900 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-pine-800 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block">{t.comparison.autoUpdateTipTitle}</span>
            <p className="text-pine-700 text-[13px] leading-relaxed">
              {t.comparison.autoUpdateTipDesc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
