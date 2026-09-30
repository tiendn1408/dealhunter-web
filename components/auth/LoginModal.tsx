"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks";
import { useLanguage } from "@/lib/i18n";
import { X, LogIn, Sparkles, ShieldCheck, AlertCircle } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const { t } = useLanguage();
  const { loginWithDemo, loginWithGoogle, isLoggingIn } = useAuth();
  const [demoEmail, setDemoEmail] = useState("");
  const [demoName, setDemoName] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDemoLogin = async () => {
    setError(null);
    try {
      await loginWithDemo({
        email: demoEmail.trim() || undefined,
        name: demoName.trim() || undefined,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Đăng nhập thất bại");
    }
  };

  const handleGoogleMockLogin = async () => {
    setError(null);
    try {
      const email = demoEmail.trim() || "user.google@dealhunter.vn";
      await loginWithGoogle(`mock-google-${email}`);
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

        {/* Form Fields for Demo Login (Optional customization) */}
        <div className="space-y-3 mb-6">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t.auth.email} (tùy chọn)
            </label>
            <input
              type="email"
              value={demoEmail}
              onChange={(e) => setDemoEmail(e.target.value)}
              placeholder="ví dụ: user@dealhunter.vn"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t.auth.name} (tùy chọn)
            </label>
            <input
              type="text"
              value={demoName}
              onChange={(e) => setDemoName(e.target.value)}
              placeholder="ví dụ: DealHunter Member"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            type="button"
            disabled={isLoggingIn}
            onClick={handleDemoLogin}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            <span>{isLoggingIn ? t.common.loading : t.auth.demoLoginBtn}</span>
          </button>

          <button
            type="button"
            disabled={isLoggingIn}
            onClick={handleGoogleMockLogin}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-all hover:bg-slate-700 hover:text-white disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{t.auth.googleLoginBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
