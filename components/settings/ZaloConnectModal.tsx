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
  "h-12 w-full bg-white pl-11 pr-4 text-[17px] font-medium text-pine-950 placeholder:text-pine-700/70";

/** "4:05" */
function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Compares numbers as the server does: "0912 345 678", "+84912345678" and "84912345678" are one number. */
function phoneKey(phone: string): string {
  return formatPhoneLocal(phone.trim()).replace(/\s/g, "");
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
  // From Retry-After when the first code request was refused (429) before any code was sent. The block is kept
  // only for the number it was given for: most server limits are per number (resend cooldown, codes per
  // member+number, codes per number). The server also limits each member to 5 codes/hour across all numbers;
  // a request for another number refused by that quota gets its own 429 + Retry-After when it is sent.
  const [sendBlock, setSendBlock] = useState<{ phoneKey: string; until: number } | null>(null);

  const sendBlockedUntil = sendBlock && sendBlock.phoneKey === phoneKey(phone) ? sendBlock.until : 0;
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
    setSendBlock(null);
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
  const applyRetryAfter = (err: unknown, forPhone: string) => {
    if (err instanceof ApiError && err.status === 429 && err.retryAfterSeconds !== undefined) {
      const resendAt = Date.now() + err.retryAfterSeconds * 1000;
      setNow(Date.now());
      if (sent) setSent({ ...sent, resendAt });
      else setSendBlock({ phoneKey: phoneKey(forPhone), until: resendAt });
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
      setSendBlock(null);
      setStep("code");
      if (isResend) setInfo(t.settings.zaloResent);
    } catch (err) {
      applyRetryAfter(err, cleanPhone);
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
        applyRetryAfter(err, phone);
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

  const primaryBtn =
    "inline-flex min-h-[48px] w-full items-center justify-center gap-2 bg-teal-400 px-5 text-[15px] font-bold text-pine-950 transition-colors hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="zalo-title">
      <div className="fixed inset-0 bg-pine-950/60 backdrop-blur-sm animate-fadeIn" onClick={handleClose} />
      <div className="relative w-full max-w-md space-y-5 bg-paper p-6 text-pine-900 shadow-2xl shadow-pine-950/30 animate-scaleUp sm:p-8 rounded-[2rem]">{/* taste-skill-ignore: dialog overlay */}
        <button
          type="button"
          onClick={handleClose}
          aria-label={t.common.close}
          className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center bg-pine-50 text-pine-900 transition-colors hover:bg-pine-100 rounded-full"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 pr-12">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-400 text-pine-950">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <h3 id="zalo-title" className="text-xl font-bold leading-snug">
              {t.settings.zaloModalTitle}
            </h3>
            <p className="text-[14px] text-pine-700">{t.settings.zaloModalSubtitle}</p>
          </div>
        </div>

        {authLoading ? (
          <p className="text-[15px] text-pine-700">{t.common.loading}</p>
        ) : !isAuthenticated ? (
          /* Guests cannot link Zalo (the server answers 403): explain and offer the Google sign-in */
          <div className="space-y-4">
            <div className="space-y-1 bg-warn-soft p-4 text-[15px] text-warn-ink rounded-2xl">
              <p className="flex items-center gap-2 font-bold">
                <ShieldCheck className="h-4 w-4" />
                {t.settings.zaloMemberOnlyTitle}
              </p>
              <p className="leading-relaxed">{t.settings.zaloMemberOnlyDesc}</p>
            </div>
            {onRequestLogin && (
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  onRequestLogin();
                }}
                className={primaryBtn}
              >
                <LogIn className="h-4 w-4" />
                {t.auth.googleLoginBtn}
              </button>
            )}
          </div>
        ) : (
          <>
            {error && (
              <div className="flex items-start gap-2 bg-[#FBE3E4] p-3 text-[15px] font-semibold text-marker-deep rounded-2xl">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {info && !error && (
              <div className="flex items-start gap-2 bg-teal-200 p-3 text-[15px] font-semibold text-pine-950 rounded-2xl">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{info}</span>
              </div>
            )}

            {step === "phone" ? (
              <form onSubmit={handleSendCode} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="zalo-phone" className="block text-[15px] font-bold">
                    {t.settings.zaloPhoneLabel}
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-pine-700" />
                    <input
                      id="zalo-phone"
                      type="tel"
                      required
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912 345 678"
                      className={inputClass}
                    />
                  </div>
                  <p className="text-[14px] leading-relaxed text-pine-700">{t.settings.zaloPhoneDesc}</p>
                </div>

                <div className="space-y-1 bg-pine-50 p-4 rounded-2xl">
                  <p className="flex items-center gap-2 text-[15px] font-bold">
                    <ShieldCheck className="h-4 w-4 text-teal-600" />
                    {t.settings.privacyTitle}
                  </p>
                  <p className="text-[14px] leading-relaxed text-pine-700">{t.settings.privacyDesc}</p>
                </div>

                <button type="submit" disabled={sending || phoneStepWaiting} className={primaryBtn}>
                  {sending
                    ? t.settings.zaloSendingCode
                    : phoneStepWaiting
                    ? formatText(t.settings.zaloResendIn, { time: formatCountdown(sendBlockedUntil - now) })
                    : t.settings.zaloSendCodeBtn}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-4">
                <p className="text-[15px] leading-relaxed">{formatText(t.settings.zaloCodeSentTo, { phone: sentToPhone })}</p>

                <div className="space-y-2">
                  <label htmlFor="zalo-code" className="block text-[15px] font-bold">
                    {t.settings.zaloCodeLabel}
                  </label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-pine-700" />
                    <input
                      id="zalo-code"
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
                      className={` rounded-2xl ${inputClass} font-bold tabular-nums tracking-[0.4em] disabled:cursor-not-allowed disabled:opacity-50`}
                    />
                  </div>
                  <p className={`text-[14px] leading-relaxed ${codeUnusable ? "font-semibold text-marker-deep" : "text-pine-700"}`}>
                    {codeDiscarded
                      ? t.settings.zaloCodeDiscarded
                      : codeExpired
                      ? t.settings.zaloCodeExpired
                      : formatText(t.settings.zaloCodeExpiresIn, {
                          time: formatCountdown(expiresInMs),
                        })}
                  </p>
                </div>

                <button type="submit" disabled={verifying || code.length !== 6 || codeUnusable} className={primaryBtn}>
                  {verifying ? t.settings.zaloVerifying : t.settings.zaloVerifyBtn}
                </button>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleChangePhone}
                    disabled={verifying || sending}
                    className="inline-flex min-h-[44px] items-center gap-1.5 px-1 text-[15px] font-semibold text-pine-700 transition-colors hover:text-pine-900 disabled:opacity-50"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {t.settings.zaloChangePhone}
                  </button>
                  <button
                    type="button"
                    onClick={() => sendCode(true)}
                    disabled={sending || verifying || resendWaitMs > 0}
                    className="min-h-[44px] bg-pine-50 px-4 text-[15px] font-bold text-pine-900 transition-colors hover:bg-pine-100 disabled:cursor-not-allowed disabled:opacity-50 rounded-full"
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
