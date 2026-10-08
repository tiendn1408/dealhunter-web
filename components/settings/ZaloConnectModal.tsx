"use client";

import { useEffect, useState } from "react";
import { ApiError, UserProfile, ZaloOtpResponse } from "@/lib/api";
import { useAuth, useConnectZalo, useRequestZaloOtp } from "@/lib/hooks";
import { formatPhoneLocal } from "@/lib/formatting";
import { useLanguage } from "@/lib/i18n";
import {
  X,
  MessageSquare,
  AlertCircle,
  Phone,
  ShieldCheck,
  KeyRound,
  ArrowLeft,
  LogIn,
  CheckCircle2,
} from "lucide-react";

interface ZaloConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (profile: Partial<UserProfile>) => void;
  /** Opens the Google sign-in; linking Zalo is for members only. */
  onRequestLogin?: () => void;
}

/** An OTP sent by the server, with its deadlines as absolute times (ms). */
interface SentOtp {
  phone: string;
  expiresAt: number;
  resendAt: number;
}

const inputClass =
  "w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pine-900/10 focus:border-pine-900 text-slate-900";

/** "4:05" */
function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function toSentOtp(res: ZaloOtpResponse): SentOtp {
  const now = Date.now();
  return {
    phone: res.phone,
    expiresAt: now + res.expires_in * 1000,
    resendAt: now + res.resend_after * 1000,
  };
}

export function ZaloConnectModal({
  isOpen,
  onClose,
  onConnected,
  onRequestLogin,
}: ZaloConnectModalProps) {
  const { t, formatText } = useLanguage();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const otpMutation = useRequestZaloOtp();
  const connectMutation = useConnectZalo();

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState<SentOtp | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  // The server discarded the pending code (429 after too many wrong tries): only a new code helps
  const [codeDiscarded, setCodeDiscarded] = useState(false);
  // From Retry-After when the first code request was refused (429) before any code was sent
  const [sendBlockedUntil, setSendBlockedUntil] = useState(0);

  const phoneStepWaiting = step === "phone" && sendBlockedUntil > now;
  // Tick once a second while a code is pending or a send is blocked, for the countdowns
  useEffect(() => {
    if (!isOpen || (step !== "code" && !phoneStepWaiting)) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isOpen, step, phoneStepWaiting]);

  if (!isOpen) return null;

  const reset = () => {
    setStep("phone");
    setPhone("");
    setCode("");
    setSent(null);
    setError(null);
    setInfo(null);
    setCodeDiscarded(false);
    setSendBlockedUntil(0);
    otpMutation.reset();
    connectMutation.reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const errorMessage = (err: unknown, fallback: string) =>
    err instanceof Error && err.message ? err.message : fallback;

  /** On 429 the server says when a new code may be requested: honour it in the resend countdown. */
  const applyRetryAfter = (err: unknown) => {
    if (err instanceof ApiError && err.status === 429 && err.retryAfterSeconds !== undefined) {
      const resendAt = Date.now() + err.retryAfterSeconds * 1000;
      setNow(Date.now());
      if (sent) setSent({ ...sent, resendAt });
      else setSendBlockedUntil(resendAt);
    }
  };

  const sendCode = async (isResend: boolean) => {
    setError(null);
    setInfo(null);
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      setError(t.settings.phoneValidationError);
      return;
    }
    try {
      const res = await otpMutation.mutateAsync(cleanPhone);
      setSent(toSentOtp(res));
      setNow(Date.now());
      setCode("");
      setCodeDiscarded(false);
      setSendBlockedUntil(0);
      setStep("code");
      if (isResend) setInfo(t.settings.zaloResent);
    } catch (err) {
      applyRetryAfter(err);
      setError(errorMessage(err, t.settings.zaloSendCodeFailed));
    }
  };

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    sendCode(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!/^\d{6}$/.test(code)) {
      setError(t.settings.zaloCodeValidationError);
      return;
    }
    try {
      const res = await connectMutation.mutateAsync({ phone: phone.trim(), code });
      onConnected({ phone: res.phone, zalo_connected: true });
      handleClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        // Too many wrong tries: the server discarded this code. Back to "request a new code".
        setCodeDiscarded(true);
        setCode("");
        applyRetryAfter(err);
      }
      setError(errorMessage(err, t.settings.zaloConnectFailed));
    }
  };

  const handleChangePhone = () => {
    setStep("phone");
    setCode("");
    setSent(null);
    setError(null);
    setInfo(null);
    setCodeDiscarded(false);
  };

  const sending = otpMutation.isPending;
  const verifying = connectMutation.isPending;
  const resendWaitMs = sent ? sent.resendAt - now : 0;
  const expiresInMs = sent ? sent.expiresAt - now : 0;
  const codeExpired = !!sent && expiresInMs <= 0;
  // No usable code: the input is locked until a new code is requested
  const codeUnusable = codeExpired || codeDiscarded;
  // The server returns the normalized phone; show it in local form
  const sentToPhone = sent ? formatPhoneLocal(sent.phone) : "";

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-scaleUp relative">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-700 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-pine-900 tracking-tight">
              {t.settings.zaloModalTitle}
            </h3>
            <p className="text-xs text-slate-500">
              {t.settings.zaloModalSubtitle}
            </p>
          </div>
        </div>

        {authLoading ? (
          <p className="text-xs text-slate-500">{t.common.loading}</p>
        ) : !isAuthenticated ? (
          /* Guests cannot link Zalo (the server answers 403): explain and offer the Google sign-in */
          <div className="space-y-4">
            <div className="p-3.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-2xl text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>{t.settings.zaloMemberOnlyTitle}</span>
              </div>
              <p className="leading-relaxed">{t.settings.zaloMemberOnlyDesc}</p>
            </div>
            {onRequestLogin && (
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  onRequestLogin();
                }}
                className="w-full py-3 bg-pine-900 hover:bg-pine-950 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>{t.auth.googleLoginBtn}</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {error && (
              <div className="p-3.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-2xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}
            {info && !error && (
              <div className="p-3.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{info}</span>
              </div>
            )}

            {step === "phone" ? (
              <form onSubmit={handleSendCode} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {t.settings.zaloPhoneLabel}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      type="tel"
                      required
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912 345 678"
                      className={inputClass}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {t.settings.zaloPhoneDesc}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>{t.settings.privacyTitle}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {t.settings.privacyDesc}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={sending || phoneStepWaiting}
                  className="w-full py-3 bg-pine-900 hover:bg-pine-950 disabled:bg-slate-300 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <span>
                    {sending
                      ? t.settings.zaloSendingCode
                      : phoneStepWaiting
                      ? formatText(t.settings.zaloResendIn, { time: formatCountdown(sendBlockedUntil - now) })
                      : t.settings.zaloSendCodeBtn}
                  </span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  {formatText(t.settings.zaloCodeSentTo, { phone: sentToPhone })}
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {t.settings.zaloCodeLabel}
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="\d{6}"
                      maxLength={6}
                      required
                      autoFocus
                      disabled={codeUnusable}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="123456"
                      className={`${inputClass} font-mono tracking-[0.4em] disabled:opacity-50 disabled:cursor-not-allowed`}
                    />
                  </div>
                  <p
                    className={`text-[11px] leading-relaxed ${
                      codeUnusable ? "text-rose-600" : "text-slate-400"
                    }`}
                  >
                    {codeDiscarded
                      ? t.settings.zaloCodeDiscarded
                      : codeExpired
                      ? t.settings.zaloCodeExpired
                      : formatText(t.settings.zaloCodeExpiresIn, {
                          time: formatCountdown(expiresInMs),
                        })}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={verifying || code.length !== 6 || codeUnusable}
                  className="w-full py-3 bg-pine-900 hover:bg-pine-950 disabled:bg-slate-300 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <span>{verifying ? t.settings.zaloVerifying : t.settings.zaloVerifyBtn}</span>
                </button>

                <div className="flex items-center justify-between gap-3 text-xs">
                  <button
                    type="button"
                    onClick={handleChangePhone}
                    disabled={verifying || sending}
                    className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-pine-900 disabled:opacity-50"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{t.settings.zaloChangePhone}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => sendCode(true)}
                    disabled={sending || verifying || resendWaitMs > 0}
                    className="font-bold text-pine-700 hover:underline disabled:text-slate-400 disabled:no-underline"
                  >
                    {sending
                      ? t.settings.zaloSendingCode
                      : resendWaitMs > 0
                      ? formatText(t.settings.zaloResendIn, { time: formatCountdown(resendWaitMs) })
                      : t.settings.zaloResendBtn}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
