import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, QueryClient } from "@tanstack/react-query";
import {
  listTrackings,
  getTracking,
  getPriceHistory,
  listAlerts,
  createAlert,
  deleteAlert,
  listNotifications,
  markNotificationAsRead,
  getZaloStatus,
  disconnectZalo,
  requestZaloOtp,
  connectZalo,
  getProductComparison,
  linkProductSource,
  pauseTracking,
  resumeTracking,
  authGoogleLogin,
  authGetMe,
  authLogout,
  listUserAlerts,
  pickActiveTargetRule,
  ensureSession,
  onSessionChange,
  getMatchSuggestions,
  acceptMatchSuggestion,
  dismissMatchSuggestion,
  triggerAutoMatch,
  MatchSuggestion,
  AutoMatchResult,
  AuthUser,
  TrackedProduct,
  PriceSnapshot,
  getTrackedProductVouchers,
  VoucherResponse,
  ProductVoucher,
  ApiError,
} from "./api";
import { AlertRule, CreateAlertPayload } from "./types";
import { calculatePriceStats, computeTargetProgress } from "./formatting";

export interface EnrichedTrackingCard extends TrackedProduct {
  snapshots?: PriceSnapshot[];
  currentPrice?: number;
  oldPrice?: number;
  changePercent?: number;
  targetPrice?: number;
  /** Undefined when there is no target or no known current price. */
  diffFromTarget?: number;
  targetProgress?: number;
}

// ---- Phase 1: Trackings hooks ----

/**
 * The window the price stats are computed over (list card and detail page "90 ngày"). Requested
 * explicitly: without `from` the backend returns only its 30-day default.
 */
export const PRICE_HISTORY_DAYS = 90;

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export function useTrackings() {
  return useQuery({
    queryKey: ["trackings"],
    queryFn: listTrackings,
    staleTime: 30_000,
  });
}

export async function getEnrichedTrackings(): Promise<EnrichedTrackingCard[]> {
  // Target prices come from the user's target_price alert rules on the server. A failure here fails the
  // whole list: showing "not set" for every product would hide the error.
  const [data, rules] = await Promise.all([listTrackings(), listUserAlerts()]);
  const rulesBySource: Record<string, AlertRule[]> = {};
  for (const rule of rules) {
    (rulesBySource[rule.product_source_id] ??= []).push(rule);
  }

  return Promise.all(
    data.map(async (item) => {
      // Price history (last PRICE_HISTORY_DAYS days, same window as the detail page) is per item and
      // non-fatal: without it the history-based fields stay unknown.
      let snapshots: PriceSnapshot[] = [];
      try {
        snapshots = await getPriceHistory(item.ProductSourceID || item.ID, daysAgo(PRICE_HISTORY_DAYS));
      } catch {}

      const stats = calculatePriceStats(snapshots);
      const currentPrice =
        item.LastEffectivePrice ||
        item.LastPrice ||
        (stats ? stats.current : undefined);

      const oldPrice =
        stats && currentPrice && stats.highest > currentPrice
          ? stats.highest
          : undefined;
      const changePercent = stats ? stats.changePercent : undefined;

      const targetPrice = pickActiveTargetRule(rulesBySource[item.ProductSourceID] ?? [])?.threshold_value;
      // Unknown (undefined) without a target or a current price; never a made-up 0
      const diffFromTarget =
        currentPrice && targetPrice ? Math.max(0, currentPrice - targetPrice) : undefined;

      // 100 once the target is reached; 0 when unknown (the list shows the bar empty, never a made-up value)
      const targetProgress = computeTargetProgress(currentPrice, targetPrice, oldPrice) ?? 0;

      return {
        ...item,
        snapshots,
        currentPrice,
        oldPrice,
        changePercent,
        targetPrice,
        diffFromTarget,
        targetProgress,
      };
    })
  );
}

export function useEnrichedTrackings() {
  return useQuery({
    queryKey: ["trackings", "enriched"],
    queryFn: getEnrichedTrackings,
    staleTime: 30_000,
  });
}

export function useToggleTracking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, currentlyActive }: { id: string; currentlyActive: boolean }) => {
      if (currentlyActive) {
        return pauseTracking(id);
      } else {
        return resumeTracking(id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trackings"] });
    },
  });
}

export function useTracking(id: string) {
  return useQuery({
    queryKey: ["tracking", id],
    queryFn: () => getTracking(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

/** Snapshots of the last `days` days. */
export function usePriceHistory(id: string, days = PRICE_HISTORY_DAYS) {
  return useQuery({
    queryKey: ["prices", id, "days", days],
    queryFn: () => getPriceHistory(id, daysAgo(days)),
    enabled: !!id,
    staleTime: 60_000,
  });
}

/**
 * The whole history since `since` (the tracking's CreatedAt), for the "Tất cả" range. Only fetched when
 * enabled; an invalid `since` or a range the backend rejects is reported as an error.
 */
export function useFullPriceHistory(id: string, since: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["prices", id, "since", since],
    queryFn: () => getPriceHistory(id, new Date(since ?? NaN)),
    enabled: !!id && enabled,
    staleTime: 60_000,
    // A rejected range stays rejected: show the error at once instead of retrying it
    retry: (failureCount, err) => !(err instanceof ApiError && err.status === 400) && failureCount < 3,
  });
}

// ---- Phase 2: Alert Rules & Notifications hooks ----

export function useAlerts(id: string) {
  return useQuery({
    queryKey: ["alerts", id],
    queryFn: () => listAlerts(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useCreateAlert(productSourceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAlertPayload) =>
      createAlert(productSourceId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerts", productSourceId] });
    },
  });
}

export function useDeleteAlert(productSourceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) => deleteAlert(ruleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerts", productSourceId] });
    },
  });
}

export function useNotifications(limit = 50) {
  return useQuery({
    queryKey: ["notifications", limit],
    queryFn: () => listNotifications(limit),
    staleTime: 30_000,
  });
}

export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const notifs = await listNotifications(20);
      return notifs.filter((n) => !n.read_at).length;
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useHasUnreadNotifications() {
  return useQuery({
    queryKey: ["notifications", "has-unread"],
    queryFn: async () => {
      const notifs = await listNotifications(1);
      return notifs.some((n) => !n.read_at);
    },
    staleTime: 30_000,
  });
}

export function useMarkNotificationAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (unreadIds: string[]) => {
      const results = await Promise.allSettled(unreadIds.map((id) => markNotificationAsRead(id)));
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) {
        throw new Error(`Không thể đánh dấu đã đọc ${failed}/${unreadIds.length} thông báo. Vui lòng thử lại.`);
      }
      return results;
    },
    // Refresh either way: some notifications may have been marked before the failure.
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useZaloProfile() {
  return useQuery({
    queryKey: ["zalo", "profile"],
    queryFn: getZaloStatus,
    staleTime: 60_000,
  });
}

export function useDisconnectZalo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: disconnectZalo,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["zalo", "profile"] });
    },
  });
}

/** Step 1 of Zalo linking: sends an OTP by ZNS to the given phone (members only). */
export function useRequestZaloOtp() {
  return useMutation({
    mutationFn: (phone: string) => requestZaloOtp(phone),
  });
}

/** Step 2 of Zalo linking: verifies the OTP and links the phone. */
export function useConnectZalo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) => connectZalo({ phone, code }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["zalo", "profile"] });
      qc.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}

// ---- Phase 3: Comparison hooks ----

export function useComparison(id: string) {
  return useQuery({
    queryKey: ["comparison", id],
    queryFn: () => getProductComparison(id),
    enabled: !!id,
    staleTime: 300_000,
    refetchOnWindowFocus: true,
  });
}

export function useLinkSource(trackingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, url }: { productId: string; url: string }) =>
      linkProductSource(productId, url),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comparison", trackingId] });
      qc.invalidateQueries({ queryKey: ["trackings"] });
    },
  });
}

// ---- GAP-02: Authentication & Guest Migration Hook ----

const SESSION_EXPIRED_KEY = ["auth", "sessionExpired"] as const;
const boundQueryClients = new WeakSet<QueryClient>();

/**
 * Binds session changes to the query cache once per client: whenever the signed-in identity changes
 * (login, logout, member session expiry) every query is reset so no previous user's data stays on screen.
 */
function bindSessionToQueryClient(qc: QueryClient) {
  if (boundQueryClients.has(qc)) return;
  boundQueryClients.add(qc);
  onSessionChange(({ memberSessionExpired }) => {
    qc.setQueryData(SESSION_EXPIRED_KEY, memberSessionExpired);
    qc.resetQueries({ predicate: (q) => q.queryKey[1] !== "sessionExpired" });
  });
}

export function useAuth() {
  const qc = useQueryClient();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    bindSessionToQueryClient(qc);
    setMounted(true);
    // Restore the session from the refresh cookie, or start a guest session
    ensureSession().catch(() => undefined);
  }, [qc]);

  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authGetMe,
    enabled: mounted,
    staleTime: 60_000,
    retry: false,
  });

  const { data: sessionExpired = false } = useQuery({
    queryKey: SESSION_EXPIRED_KEY,
    queryFn: () => false,
    enabled: false,
    initialData: false,
  });

  // Login changes the identity, so bindSessionToQueryClient resets every query (including migrated guest data).
  const googleLoginMutation = useMutation({
    mutationFn: (idToken: string) => authGoogleLogin(idToken),
    onSuccess: () => qc.setQueryData(SESSION_EXPIRED_KEY, false),
  });

  const logout = () => authLogout();

  const isAuthenticated = !!user && user.auth_provider !== "guest";

  return {
    user: isAuthenticated ? user : null,
    sessionUser: user ?? null,
    isAuthenticated,
    isLoading: !mounted || isLoading,
    sessionExpired,
    loginWithGoogle: googleLoginMutation.mutateAsync,
    isLoggingIn: googleLoginMutation.isPending,
    logout,
    refetchUser: refetch,
  };
}

// ---- GAP-03: Auto-Matching & Suggestions Hooks ----

export function useMatchSuggestions(idOrProductId: string) {
  return useQuery({
    queryKey: ["match-suggestions", idOrProductId],
    queryFn: () => getMatchSuggestions(idOrProductId),
    enabled: !!idOrProductId,
    staleTime: 30_000,
  });
}

export function useAcceptMatchSuggestion(idOrProductId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, suggestionId }: { productId: string; suggestionId: string }) =>
      acceptMatchSuggestion(productId, suggestionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["match-suggestions", idOrProductId] });
      qc.invalidateQueries({ queryKey: ["comparison", idOrProductId] });
      qc.invalidateQueries({ queryKey: ["trackings"] });
    },
  });
}

export function useDismissMatchSuggestion(idOrProductId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, suggestionId }: { productId: string; suggestionId: string }) =>
      dismissMatchSuggestion(productId, suggestionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["match-suggestions", idOrProductId] });
    },
  });
}

export function useTriggerAutoMatch(idOrProductId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => triggerAutoMatch(idOrProductId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["match-suggestions", idOrProductId] });
      qc.invalidateQueries({ queryKey: ["comparison", idOrProductId] });
      qc.invalidateQueries({ queryKey: ["trackings"] });
    },
  });
}

// ---- Phase 3.5.2: Voucher Intelligence Hook ----

export function useProductVouchers(id: string) {
  return useQuery({
    queryKey: ["vouchers", id],
    queryFn: () => getTrackedProductVouchers(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}


