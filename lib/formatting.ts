import { PriceSnapshot } from "./api";

/**
 * Format number to Vietnamese Dong (VND) currency string.
 * Example: 6290000 -> "6.290.000 ₫"
 */
export function formatVND(amount?: number | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "— ₫";
  }
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Compact VND format for chart axes & badges.
 * Example: 6290000 -> "6.29M", 450000 -> "450k"
 */
export function formatCompactVND(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}k`;
  }
  return `${amount}`;
}

/**
 * Format relative time in Vietnamese.
 * Example: "vừa xong", "15 phút trước", "2 giờ trước", "Hôm qua", "25/09/2026"
 */
export function formatRelativeTime(dateInput?: string | Date | null): string {
  if (!dateInput) return "Chưa cập nhật";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "Chưa cập nhật";

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Vừa xong";
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return "Hôm qua";
  }
  if (diffInDays < 7) {
    return `${diffInDays} ngày trước`;
  }

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Format full date & time for tooltips & table.
 * Example: "14:30 · 29/09/2026"
 */
export function formatDateTime(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "—";

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export interface PriceStats {
  lowest: number;
  highest: number;
  average: number;
  current: number;
  initial: number;
  changePercent: number; // e.g. -8.7 means dropped 8.7%
  diffFromLowest: number; // current - lowest
  isAtLowest: boolean;
  trend: "down" | "up" | "stable";
}

/**
 * Calculate key statistics from a list of price snapshots.
 */
export function calculatePriceStats(snapshots: PriceSnapshot[]): PriceStats | null {
  if (!snapshots || snapshots.length === 0) {
    return null;
  }

  const prices = snapshots.map((s) => s.EffectivePrice || s.Price).filter((p) => p > 0);
  if (prices.length === 0) return null;

  const lowest = Math.min(...prices);
  const highest = Math.max(...prices);
  const sum = prices.reduce((acc, p) => acc + p, 0);
  const average = Math.round(sum / prices.length);
  const initial = prices[0];
  const current = prices[prices.length - 1];

  let changePercent = 0;
  if (initial > 0) {
    changePercent = Number((((current - initial) / initial) * 100).toFixed(1));
  }

  const diffFromLowest = current - lowest;
  const isAtLowest = diffFromLowest <= 0;

  let trend: "down" | "up" | "stable" = "stable";
  if (changePercent < 0) {
    trend = "down";
  } else if (changePercent > 0) {
    trend = "up";
  }

  return {
    lowest,
    highest,
    average,
    current,
    initial,
    changePercent,
    diffFromLowest,
    isAtLowest,
    trend,
  };
}

export type SupportedPlatform = "shopee" | "lazada" | "tiktok" | "tiki" | "mock" | "other";

/**
 * Detect platform name and branding colors.
 */
export function detectPlatform(platformOrUrl?: string): {
  id: SupportedPlatform;
  name: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
} {
  const str = (platformOrUrl || "").toLowerCase();

  if (str.includes("shopee")) {
    return {
      id: "shopee",
      name: "Shopee",
      badgeBg: "bg-orange-50",
      badgeText: "text-orange-700",
      badgeBorder: "border-orange-200",
    };
  }
  if (str.includes("lazada")) {
    return {
      id: "lazada",
      name: "Lazada",
      badgeBg: "bg-blue-50",
      badgeText: "text-blue-700",
      badgeBorder: "border-blue-200",
    };
  }
  if (str.includes("tiktok")) {
    return {
      id: "tiktok",
      name: "TikTok Shop",
      badgeBg: "bg-slate-900",
      badgeText: "text-white",
      badgeBorder: "border-slate-800",
    };
  }
  if (str.includes("tiki")) {
    return {
      id: "tiki",
      name: "Tiki",
      badgeBg: "bg-sky-50",
      badgeText: "text-sky-700",
      badgeBorder: "border-sky-200",
    };
  }
  if (str.includes("mock")) {
    return {
      id: "mock",
      name: "Mock Store",
      badgeBg: "bg-purple-50",
      badgeText: "text-purple-700",
      badgeBorder: "border-purple-200",
    };
  }

  return {
    id: "other",
    name: "Sàn TMĐT",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-700",
    badgeBorder: "border-slate-200",
  };
}
