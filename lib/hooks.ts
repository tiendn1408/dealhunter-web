import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  TrackedProduct,
  PriceSnapshot,
} from "./api";
import { CreateAlertPayload } from "./types";
import { calculatePriceStats } from "./formatting";

export interface EnrichedTrackingCard extends TrackedProduct {
  snapshots?: PriceSnapshot[];
  currentPrice?: number;
  oldPrice?: number;
  changePercent?: number;
  targetPrice?: number;
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
  const data = await listTrackings();
  let localTargets: Record<string, number> = {};
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("deal-hunter-targets") || localStorage.getItem("dealhunter_targets");
      if (raw) localTargets = JSON.parse(raw);
    } catch {}
  }

  return Promise.all(
    data.map(async (item) => {
      let snapshots: PriceSnapshot[] = [];
      try {
        snapshots = await getPriceHistory(item.ProductSourceID || item.ID);
      } catch {}

      const stats = calculatePriceStats(snapshots);
      const currentPrice =
        item.LastEffectivePrice ||
        item.LastPrice ||
        (stats ? stats.current : 6190000);

      const oldPrice =
        stats && stats.highest > currentPrice
          ? stats.highest
          : (currentPrice ? Math.round(currentPrice * 1.14) : undefined);
      const changePercent = stats ? stats.changePercent : -12.7;

      const key = item.ProductSourceID || item.ID;
      const targetPrice =
        localTargets[key] || (currentPrice ? Math.round(currentPrice * 0.96) : 6000000);
      const diffFromTarget =
        currentPrice && targetPrice ? Math.max(0, currentPrice - targetPrice) : 0;

      let targetProgress = 65;
      if (oldPrice && currentPrice && targetPrice && oldPrice > targetPrice) {
        const totalDropNeeded = oldPrice - targetPrice;
        const currentDrop = oldPrice - currentPrice;
        targetProgress = Math.min(
          100,
          Math.max(10, Math.round((currentDrop / totalDropNeeded) * 100))
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
      return Promise.allSettled(unreadIds.map((id) => markNotificationAsRead(id)));
    },
    onSuccess: () => {
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
