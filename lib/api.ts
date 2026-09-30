const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1").replace(/\/+$/, "");

export function getUserId(): string {
  if (typeof window === "undefined") {
    return "00000000-0000-0000-0000-000000000001";
  }
  let uid =
    localStorage.getItem("dealhunter-user-id") ||
    localStorage.getItem("dealhunter_user_id") ||
    localStorage.getItem("deal-hunter-user-id");
  if (!uid) {
    // Default to the deterministic seed user UUID for demo
    uid = "00000000-0000-0000-0000-000000000001";
    localStorage.setItem("dealhunter-user-id", uid);
  }
  return uid;
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("dealhunter-token") || localStorage.getItem("dealhunter_token");
}

export function setAuthToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("dealhunter-token", token);
  } else {
    localStorage.removeItem("dealhunter-token");
    localStorage.removeItem("dealhunter_token");
  }
}

export function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    "X-User-ID": getUserId(),
    ...extraHeaders,
  };
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  avatar_url?: string;
  auth_provider: string;
  zalo_id?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthLoginResponse {
  token: string;
  user: AuthUser;
}

export interface MigrationResult {
  migrated_products: number;
  migrated_alerts: number;
  migrated_notifications: number;
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
  ProductID?: string;
  IsPrimary?: boolean;
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
    const raw =
      localStorage.getItem("dealhunter-products-meta") ||
      localStorage.getItem("dealhunter_products_meta") ||
      localStorage.getItem("deal-hunter-products-meta");
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
    localStorage.setItem("dealhunter-products-meta", JSON.stringify(store));
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
    headers: getAuthHeaders({
      "Content-Type": "application/json",
    }),
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
    headers: getAuthHeaders(),
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
    headers: getAuthHeaders(),
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
    headers: getAuthHeaders(),
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
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error("Không thể tiếp tục theo dõi");
  }
  return res.json();
}

export * from "./types";
import {
  AlertRule,
  CreateAlertPayload,
  PriceNotification,
  UserProfile,
  ConnectZaloPayload,
  ComparisonResult,
  LinkSourceResponse,
  ProductGroupSummary,
} from "./types";

/**
 * Create an alert rule for a tracked product.
 */
export async function createAlert(
  trackedProductIdOrSourceId: string,
  payload: CreateAlertPayload
): Promise<AlertRule> {
  const res = await safeFetch(
    `${API_BASE_URL}/tracked-products/${trackedProductIdOrSourceId}/alerts`,
    {
      method: "POST",
      headers: getAuthHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    let msg = errorText;
    try {
      const parsed = JSON.parse(errorText);
      msg = parsed.message || parsed.error || errorText;
    } catch {}
    throw new Error(msg || "Không thể tạo quy tắc cảnh báo");
  }

  return res.json();
}

/**
 * List alert rules for a specific tracked product.
 */
export async function listAlerts(
  trackedProductIdOrSourceId: string
): Promise<AlertRule[]> {
  const res = await safeFetch(
    `${API_BASE_URL}/tracked-products/${trackedProductIdOrSourceId}/alerts`,
    {
      headers: getAuthHeaders(),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("Không thể tải danh sách cảnh báo của sản phẩm");
  }

  const data = await res.json();
  return data.data || [];
}

/**
 * List all alert rules for the current user.
 */
export async function listUserAlerts(): Promise<AlertRule[]> {
  const res = await safeFetch(`${API_BASE_URL}/alert-rules`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Không thể tải danh sách cảnh báo của bạn");
  }

  const data = await res.json();
  return data.data || [];
}

/**
 * Deactivate / delete an alert rule.
 */
export async function deleteAlert(
  alertId: string
): Promise<{ status: string; id: string }> {
  const res = await safeFetch(`${API_BASE_URL}/alerts/${alertId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error("Không thể xóa quy tắc cảnh báo");
  }

  return res.json();
}

/**
 * List price notifications for the current user.
 */
export async function listNotifications(
  limit: number = 30
): Promise<PriceNotification[]> {
  const res = await safeFetch(`${API_BASE_URL}/notifications?limit=${limit}`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Không thể tải danh sách thông báo");
  }

  const data = await res.json();
  return data.data || [];
}

/**
 * Mark a notification as read.
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<{ status: string; id: string }> {
  const res = await safeFetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error("Không thể đánh dấu thông báo đã đọc");
  }

  return res.json();
}

/**
 * Get current user profile and Zalo connection status.
 */
export async function getZaloStatus(): Promise<UserProfile> {
  const res = await safeFetch(`${API_BASE_URL}/auth/zalo/status`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Không thể kiểm tra trạng thái Zalo");
  }

  return res.json();
}

/**
 * Connect Zalo account using phone number or Zalo ID.
 */
export async function connectZalo(
  payload: ConnectZaloPayload
): Promise<{ status: string; zalo_id?: string; phone?: string }> {
  const res = await safeFetch(`${API_BASE_URL}/users/me/zalo`, {
    method: "POST",
    headers: getAuthHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    let msg = errorText;
    try {
      const parsed = JSON.parse(errorText);
      msg = parsed.message || parsed.error || errorText;
    } catch {}
    throw new Error(msg || "Không thể liên kết tài khoản Zalo");
  }

  return res.json();
}

/**
 * Disconnect Zalo account.
 */
export async function disconnectZalo(): Promise<{ status: string }> {
  const res = await safeFetch(`${API_BASE_URL}/auth/zalo/disconnect`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error("Không thể ngắt kết nối Zalo");
  }

  return res.json();
}

/**
 * Phase 3: Cross-platform Price Comparison API functions
 */

export async function getProductComparison(id: string): Promise<ComparisonResult> {
  const res = await safeFetch(
    `${API_BASE_URL}/tracked-products/${id}/comparison`,
    { headers: getAuthHeaders() }
  );
  if (!res.ok) throw new Error("Khong the tai du lieu so sanh gia");
  return res.json();
}

export async function linkProductSource(
  productId: string,
  url: string
): Promise<LinkSourceResponse> {
  const res = await safeFetch(
    `${API_BASE_URL}/products/${productId}/link-source`,
    {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ url }),
    }
  );
  if (res.status === 409) throw new Error("URL nay da duoc lien ket voi san pham roi");
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Khong the lien ket san");
  }
  return res.json();
}

export async function listProductGroups(): Promise<ProductGroupSummary[]> {
  const res = await safeFetch(`${API_BASE_URL}/product-groups`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Khong the tai danh sach nhom san pham");
  const data = await res.json();
  return data.groups || [];
}

/**
 * GAP-02: Authentication & Guest Migration API functions
 */

export async function authDemoLogin(email?: string, name?: string): Promise<AuthLoginResponse> {
  const res = await safeFetch(`${API_BASE_URL}/auth/demo-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email || "", name: name || "" }),
  });
  if (!res.ok) {
    throw new Error("Đăng nhập thử nghiệm thất bại");
  }
  const data: AuthLoginResponse = await res.json();
  setAuthToken(data.token);
  return data;
}

export async function authGoogleLogin(idToken: string): Promise<AuthLoginResponse> {
  const res = await safeFetch(`${API_BASE_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_token: idToken }),
  });
  if (!res.ok) {
    throw new Error("Đăng nhập Google thất bại hoặc phiên đã hết hạn");
  }
  const data: AuthLoginResponse = await res.json();
  setAuthToken(data.token);
  return data;
}

export async function authMigrateGuestData(guestUserId: string): Promise<MigrationResult> {
  const res = await safeFetch(`${API_BASE_URL}/auth/migrate`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ guest_user_id: guestUserId }),
  });
  if (!res.ok) {
    throw new Error("Đồng bộ dữ liệu khách vãng lai thất bại");
  }
  return await res.json();
}

export async function authGetMe(): Promise<AuthUser> {
  const res = await safeFetch(`${API_BASE_URL}/auth/me`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error("Không thể lấy thông tin người dùng");
  }
  return await res.json();
}

/**
 * GAP-03: Auto-Matching & Suggestion API functions
 */

export interface MatchSuggestion {
  id: string;
  product_id: string;
  candidate_platform: string;
  candidate_url: string;
  candidate_title: string;
  candidate_seller?: string;
  candidate_price: number;
  match_score: number;
  status: "pending" | "accepted" | "dismissed" | "auto_linked";
  created_at: string;
  updated_at: string;
}

export interface AutoMatchResult {
  product_id: string;
  reference_title: string;
  auto_linked_sources: string[];
  new_suggestions: MatchSuggestion[];
  total_discovered: number;
}

export async function getMatchSuggestions(idOrProductId: string): Promise<MatchSuggestion[]> {
  const res = await safeFetch(`${API_BASE_URL}/tracked-products/${idOrProductId}/match-suggestions`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    return [];
  }
  const data = await res.json();
  return data.suggestions || [];
}

export async function acceptMatchSuggestion(
  productId: string,
  suggestionId: string
): Promise<{ status: string; id: string }> {
  const res = await safeFetch(
    `${API_BASE_URL}/products/${productId}/match-suggestions/${suggestionId}/accept`,
    {
      method: "POST",
      headers: getAuthHeaders(),
    }
  );
  if (!res.ok) {
    throw new Error("Không thể chấp nhận liên kết gợi ý");
  }
  return await res.json();
}

export async function dismissMatchSuggestion(
  productId: string,
  suggestionId: string
): Promise<{ status: string; id: string }> {
  const res = await safeFetch(
    `${API_BASE_URL}/products/${productId}/match-suggestions/${suggestionId}/dismiss`,
    {
      method: "POST",
      headers: getAuthHeaders(),
    }
  );
  if (!res.ok) {
    throw new Error("Không thể bỏ qua gợi ý");
  }
  return await res.json();
}

export async function triggerAutoMatch(idOrProductId: string): Promise<AutoMatchResult> {
  const res = await safeFetch(`${API_BASE_URL}/tracked-products/${idOrProductId}/auto-match`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error("Tìm kiếm tự động thất bại");
  }
  return await res.json();
}


