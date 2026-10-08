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
} from "./api";
import { AlertRule, CreateAlertPayload } from "./types";
import { calculatePriceStats } from "./formatting";

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
      // Price history is per item and non-fatal: without it the history-based fields stay unknown.
      let snapshots: PriceSnapshot[] = [];
      try {
        snapshots = await getPriceHistory(item.ProductSourceID || item.ID);
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

      let targetProgress = 0;
      if (oldPrice && currentPrice && targetPrice && oldPrice > targetPrice) {
        const totalDropNeeded = oldPrice - targetPrice;
        const currentDrop = oldPrice - currentPrice;
        targetProgress = Math.min(
          100,
          Math.max(0, Math.round((currentDrop / totalDropNeeded) * 100))
        );
      }

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

export function usePriceHistory(id: string) {
  return useQuery({
    queryKey: ["prices", id],
    queryFn: () => getPriceHistory(id),
    enabled: !!id,
    staleTime: 60_000,
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


