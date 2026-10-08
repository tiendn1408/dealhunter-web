"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks";
import { useLanguage } from "@/lib/i18n";
import { X, LogIn, ShieldCheck, AlertCircle } from "lucide-react";
import { GoogleSignInButton, GOOGLE_CLIENT_ID } from "./GoogleSignInButton";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const { t } = useLanguage();
  const { loginWithGoogle, isLoggingIn } = useAuth();
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleCredential = async (idToken: string) => {
    setError(null);
    try {
      await loginWithGoogle(idToken);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Đăng nhập Google thất bại");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
            <LogIn className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            {t.auth.loginTitle}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {t.auth.loginSubtitle}
          </p>
        </div>

        {/* Notice of guest data auto-migration */}
        <div className="mb-6 rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3.5 text-xs text-cyan-200">
          <div className="flex gap-2.5">
            <ShieldCheck className="h-4 w-4 shrink-0 text-cyan-400" />
            <div>
              <p className="font-semibold text-cyan-300">
                {t.auth.guestNotice}
              </p>
              <p className="mt-0.5 text-cyan-200/80">
                {t.auth.guestTip}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {GOOGLE_CLIENT_ID ? (
          <div className={isLoggingIn ? "pointer-events-none opacity-50" : undefined}>
            <GoogleSignInButton onCredential={handleGoogleCredential} onError={setError} />
            {isLoggingIn && (
              <p className="mt-3 text-center text-xs text-slate-400">{t.common.loading}</p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-950/30 p-3 text-xs text-amber-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              Đăng nhập Google chưa được cấu hình. Cần đặt NEXT_PUBLIC_GOOGLE_CLIENT_ID (trùng GOOGLE_CLIENT_ID của backend).
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
