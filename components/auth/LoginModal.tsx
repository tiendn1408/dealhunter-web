"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks";
import { useLanguage } from "@/lib/i18n";
import Image from "next/image";
import { X, AlertCircle } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="login-title">
      <div className="fixed inset-0 bg-pine-950/70 animate-fadeIn" onClick={onClose} />

      <div className="relative w-full max-w-md bg-paper p-6 text-pine-900 shadow-2xl shadow-pine-950/30 animate-scaleUp sm:p-8">{/* taste-skill-ignore: dialog overlay */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t.common.close}
          className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center bg-pine-50 text-pine-900 transition-colors hover:bg-pine-100"
        >
          <X className="h-5 w-5" />
        </button>

        <Image src="/icon.png" alt="" width={56} height={56} className="h-14 w-14" />
        <h2 id="login-title" className="mt-4 pr-10 text-[32px] font-extrabold leading-tight tracking-tight">
          {t.auth.loginTitle}
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-pine-700">{t.auth.loginSubtitle}</p>

        {/* Guest data moves to the account automatically */}
        <div className="mt-6 bg-teal-200 p-4 text-[15px] text-pine-950">
          <p className="font-bold">{t.auth.guestNotice}</p>
          <p className="mt-1 leading-relaxed">{t.auth.guestTip}</p>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 bg-[#FBE3E4] p-3 text-[15px] font-semibold text-marker-deep">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6">
          {GOOGLE_CLIENT_ID ? (
            <div className={isLoggingIn ? "pointer-events-none opacity-50" : undefined}>
              <GoogleSignInButton onCredential={handleGoogleCredential} onError={setError} />
              {isLoggingIn && <p className="mt-3 text-center text-[14px] text-pine-700">{t.common.loading}</p>}
            </div>
          ) : (
            <div className="flex items-start gap-2 bg-warn-soft p-3 text-[14px] text-warn-ink">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Đăng nhập Google chưa được cấu hình. Cần đặt NEXT_PUBLIC_GOOGLE_CLIENT_ID (trùng GOOGLE_CLIENT_ID của backend).
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
