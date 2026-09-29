const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export function getUserId(): string {
  if (typeof window === "undefined") {
    return "00000000-0000-0000-0000-000000000001";
  }
  let uid = localStorage.getItem("dealhunter_user_id");
  if (!uid) {
    // Default to the deterministic seed user UUID for demo
    uid = "00000000-0000-0000-0000-000000000001";
    localStorage.setItem("dealhunter_user_id", uid);
  }
  return uid;
}

export interface TrackedProduct {
  ID: string;
  UserID: string;
  ProductSourceID: string;
  Active: boolean;
  PollingIntervalSeconds: number;
  NextFetchAt: string;
  CreatedAt: string;
  UpdatedAt: string;
  // Enriched metadata fields
  Title?: string;
  Platform?: string;
  CanonicalURL?: string;
  SellerName?: string;
  LastPrice?: number;
  LastEffectivePrice?: number;
  LastInStock?: boolean;
}

export interface PriceSnapshot {
  ID: number;
  ProductSourceID: string;
  Price: number;
  ShippingFee: number;
  EffectivePrice: number;
  Currency: string;
  InStock: boolean;
  CapturedAt: string;
}

export interface TrackResponse {
  id: string;
  product_source_id: string;
  next_fetch_at: string;
  url?: string;
}

// Client-side cache for product metadata (fallback if backend only provides UUIDs)
interface LocalProductMeta {
  url?: string;
  title?: string;
  platform?: string;
  savedAt?: number;
}

function getLocalMetaStore(): Record<string, LocalProductMeta> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("dealhunter_products_meta");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalProductMeta(sourceOrTrackingId: string, meta: LocalProductMeta) {
  if (typeof window === "undefined" || !sourceOrTrackingId) return;
  try {
    const store = getLocalMetaStore();
    store[sourceOrTrackingId] = {
      ...store[sourceOrTrackingId],
      ...meta,
      savedAt: Date.now(),
    };
    localStorage.setItem("dealhunter_products_meta", JSON.stringify(store));
  } catch (err) {
    console.warn("Failed to save local product meta:", err);
  }
}

export function getLocalProductMeta(sourceOrTrackingId: string): LocalProductMeta | undefined {
  if (typeof window === "undefined" || !sourceOrTrackingId) return undefined;
  const store = getLocalMetaStore();
  return store[sourceOrTrackingId];
}

async function safeFetch(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (err: any) {
    if (
      err?.name === "TypeError" ||
      err?.message?.includes("fetch") ||
      err?.message?.includes("NetworkError") ||
      err?.message?.includes("Failed")
    ) {
      throw new Error(
        `Không thể kết nối đến máy chủ Backend (${API_BASE_URL}). Vui lòng đảm bảo backend Go đang được khởi chạy.`
      );
    }
    throw err;
  }
}

/**
 * Track a new product by its URL.
 */
export async function trackProduct(url: string): Promise<TrackResponse> {
  const cleanUrl = url.trim();
  const res = await safeFetch(`${API_BASE_URL}/tracked-products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-ID": getUserId(),
    },
    body: JSON.stringify({ url: cleanUrl }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    let msg = errorText;
    try {
      const parsed = JSON.parse(errorText);
      msg = parsed.message || parsed.error || errorText;
    } catch {
      // use raw text
    }
    throw new Error(msg || "Không thể theo dõi sản phẩm. Vui lòng kiểm tra lại đường link.");
  }

  const data: TrackResponse = await res.json();

  // Save metadata to local store so we can immediately show URL & platform
  saveLocalProductMeta(data.product_source_id, { url: cleanUrl });
  if (data.id) {
    saveLocalProductMeta(data.id, { url: cleanUrl });
  }

  return data;
}

/**
 * List all tracked products for the current user.
 */
export async function listTrackings(): Promise<TrackedProduct[]> {
  const res = await safeFetch(`${API_BASE_URL}/tracked-products`, {
    headers: {
      "X-User-ID": getUserId(),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Không thể tải danh sách theo dõi");
  }

  const data = await res.json();
  const trackings: TrackedProduct[] = data.data || [];

  // Merge with any client-side cached metadata if title/url missing
  return trackings.map((t) => {
    const localMeta = getLocalProductMeta(t.ProductSourceID) || getLocalProductMeta(t.ID);
    if (!t.Title && localMeta?.title) {
      t.Title = localMeta.title;
    }
    if (!t.CanonicalURL && localMeta?.url) {
      t.CanonicalURL = localMeta.url;
    }
    if (!t.Platform && localMeta?.platform) {
      t.Platform = localMeta.platform;
    }
    return t;
  });
}

/**
 * Get details for a single tracked product.
 */
export async function getTracking(id: string): Promise<TrackedProduct> {
  const res = await safeFetch(`${API_BASE_URL}/tracked-products/${id}`, {
    headers: {
      "X-User-ID": getUserId(),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Không tìm thấy thông tin sản phẩm theo dõi");
  }

  const tracked: TrackedProduct = await res.json();
  const localMeta = getLocalProductMeta(tracked.ProductSourceID) || getLocalProductMeta(tracked.ID);

  if (!tracked.Title && localMeta?.title) {
    tracked.Title = localMeta.title;
  }
  if (!tracked.CanonicalURL && localMeta?.url) {
    tracked.CanonicalURL = localMeta.url;
  }

  return tracked;
}

/**
 * Fetch price snapshot history for a tracked product or source.
 */
export async function getPriceHistory(
  sourceOrTrackingId: string,
  from?: string,
  to?: string
): Promise<PriceSnapshot[]> {
  let url = `${API_BASE_URL}/tracked-products/${sourceOrTrackingId}/prices`;
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (params.toString()) url += `?${params.toString()}`;

  const res = await safeFetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Không thể tải lịch sử giá");
  }

  const data = await res.json();
  return data.snapshots || [];
}

/**
 * Pause tracking for a product.
 */
export async function pauseTracking(id: string) {
  const res = await safeFetch(`${API_BASE_URL}/tracked-products/${id}/pause`, {
    method: "POST",
    headers: {
      "X-User-ID": getUserId(),
    },
  });

  if (!res.ok) {
    throw new Error("Không thể tạm dừng theo dõi");
  }
  return res.json();
}

/**
 * Resume tracking for a product.
 */
export async function resumeTracking(id: string) {
  const res = await safeFetch(`${API_BASE_URL}/tracked-products/${id}/resume`, {
    method: "POST",
    headers: {
      "X-User-ID": getUserId(),
    },
  });

  if (!res.ok) {
    throw new Error("Không thể tiếp tục theo dõi");
  }
  return res.json();
}
