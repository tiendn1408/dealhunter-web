import { pushSessionToExtension } from "./extension_bridge";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1").replace(/\/+$/, "");

/**
 * Session handling (GAP-02 / SEC-05)
 * - The access token (15 min) lives only in memory, with its expiry.
 * - The refresh token is an HttpOnly cookie set by the backend on /auth/*.
 * - Visitors without an account get a server-issued guest session.
 * - Listeners are notified only when the signed-in identity changes (not on every token rotation).
 */
const TOKEN_EXPIRY_SKEW_MS = 30_000;

let accessToken: string | null = null;
let accessTokenExpiresAt = 0;
let sessionUserId: string | null = null;
let sessionIsMember = false;
// False until the first session of this page load is applied: establishing it is not an identity change
let sessionEstablished = false;
let sessionPromise: Promise<string> | null = null;
const sessionListeners = new Set<(change: SessionChange) => void>();

export interface SessionChange {
  /** True when a signed-in member session ended (expired/revoked) and the app fell back to a guest. */
  memberSessionExpired: boolean;
}

/** Thrown when a signed-in member's session can no longer be refreshed; the request was NOT retried as a guest. */
export class SessionExpiredError extends Error {
  constructor() {
    super("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }
}

export function onSessionChange(listener: (change: SessionChange) => void): () => void {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

function applySession(session: AuthSession | null, memberSessionExpired = false) {
  const prevUserId = sessionUserId;
  accessToken = session?.access_token ?? null;
  accessTokenExpiresAt = session ? Date.now() + session.expires_in * 1000 - TOKEN_EXPIRY_SKEW_MS : 0;
  sessionUserId = session?.user.id ?? null;
  sessionIsMember = !!session && session.user.auth_provider !== "guest";
  pushSessionToExtension(
    session && sessionIsMember
      ? { accessToken: session.access_token, expiresAt: accessTokenExpiresAt, email: session.user.email, name: session.user.name }
      : null
  );
  // Clearing (logout) is followed by a guest session, which is the change worth announcing. The first
  // session of a page load is not announced: nothing is cached yet, and resetting the queries waiting for
  // it would only send every request twice.
  if (session && prevUserId !== sessionUserId && sessionEstablished) {
    sessionListeners.forEach((l) => l({ memberSessionExpired }));
  }
  if (session) sessionEstablished = true;
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const CONNECTION_ERROR = `Không thể kết nối đến máy chủ Backend (${API_BASE_URL}). Vui lòng đảm bảo backend Go đang được khởi chạy.`;

async function postAuth(path: string, body?: unknown, bearer?: string | null): Promise<AuthSession> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (bearer) headers["Authorization"] = `Bearer ${bearer}`;
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      credentials: "include",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error(CONNECTION_ERROR);
  }
  if (!res.ok) {
    throw new HttpError(res.status, (await res.text()) || `HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Refresh tokens rotate strictly (a replayed token revokes every session), so refreshes are serialized
 * across tabs with the Web Locks API: a tab waiting on the lock sends the cookie the previous tab just set.
 * Browsers without Web Locks fall back to a localStorage lock with the same guarantee (best effort).
 */
const REFRESH_LOCK_NAME = "dealhunter-session-refresh";
const STORAGE_LOCK_TTL_MS = 10_000;
const STORAGE_LOCK_POLL_MS = 100;
const STORAGE_LOCK_SETTLE_MS = 50;
const tabLockId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
let storageLockSeq = 0;

function withCrossTabLock<T>(fn: () => Promise<T>): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.locks?.request) {
    return navigator.locks.request(REFRESH_LOCK_NAME, fn) as Promise<T>;
  }
  return withStorageLock(fn);
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function readStorageLock(): { owner: string; expiresAt: number } | null {
  try {
    const raw = localStorage.getItem(REFRESH_LOCK_NAME);
    if (!raw) return null;
    const lock = JSON.parse(raw);
    return typeof lock?.owner === "string" && typeof lock?.expiresAt === "number" ? lock : null;
  } catch {
    return null;
  }
}

/** Writes the lock; false when storage is unusable (private mode, quota, no window). */
function writeStorageLock(owner: string): boolean {
  try {
    localStorage.setItem(REFRESH_LOCK_NAME, JSON.stringify({ owner, expiresAt: Date.now() + STORAGE_LOCK_TTL_MS }));
    return true;
  } catch {
    return false;
  }
}

/**
 * localStorage has no atomic compare-and-set: a tab claims a free (or expired) lock, waits briefly and
 * re-reads it, so of two tabs claiming at once only the last writer proceeds. The holder renews the
 * expiry while its refresh runs; a crashed tab's lock expires after STORAGE_LOCK_TTL_MS.
 */
async function withStorageLock<T>(fn: () => Promise<T>): Promise<T> {
  const owner = `${tabLockId}:${++storageLockSeq}`;
  let held = false;
  let renew: ReturnType<typeof setInterval> | undefined;
  try {
    for (;;) {
      const lock = readStorageLock();
      if (!lock || lock.expiresAt <= Date.now()) {
        // Without usable storage the tabs cannot coordinate: refresh unlocked, as before.
        if (!writeStorageLock(owner)) break;
        await sleep(STORAGE_LOCK_SETTLE_MS);
        if (readStorageLock()?.owner === owner) {
          held = true;
          break;
        }
      }
      await sleep(STORAGE_LOCK_POLL_MS);
    }
    if (held) renew = setInterval(() => writeStorageLock(owner), STORAGE_LOCK_TTL_MS / 3);
    return await fn();
  } finally {
    if (renew) clearInterval(renew);
    if (held && readStorageLock()?.owner === owner) {
      try {
        localStorage.removeItem(REFRESH_LOCK_NAME);
      } catch {}
    }
  }
}

function refreshOrStartGuest(): Promise<string> {
  return withCrossTabLock(refreshOrStartGuestUnlocked);
}

async function refreshOrStartGuestUnlocked(): Promise<string> {
  const wasMember = sessionIsMember;
  try {
    const session = await postAuth("/auth/refresh");
    // The cookie can belong to a guest when another tab logged out: the member session still ended here.
    applySession(session, wasMember && session.user.auth_provider === "guest");
    return session.access_token;
  } catch (err) {
    if (!(err instanceof HttpError && err.status === 401)) throw err;
    // No usable refresh cookie: continue as a fresh guest (and tell the UI if a member session ended)
    const guest = await postAuth("/auth/guest");
    applySession(guest, wasMember);
    return guest.access_token;
  }
}

function hasFreshToken(): boolean {
  return !!accessToken && Date.now() < accessTokenExpiresAt;
}

/** Returns a valid access token, restoring the session from the refresh cookie or starting a guest session. */
export function ensureSession(forceRefresh = false): Promise<string> {
  if (!forceRefresh && hasFreshToken()) return Promise.resolve(accessToken as string);
  if (!sessionPromise) {
    sessionPromise = refreshOrStartGuest().finally(() => {
      sessionPromise = null;
    });
  }
  return sessionPromise;
}

export function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extraHeaders };
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
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

export interface AuthSession {
  access_token: string;
  expires_in: number;
  user: AuthUser;
  migration?: MigrationResult;
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
  AffiliateURL?: string;
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
  ShippingFee: number | null; // null = shipping fee not stated
  EffectivePrice: number;
  Currency: string;
  InStock: boolean | null;
  CapturedAt: string;
}

export interface TrackResponse {
  id: string;
  product_source_id: string;
  next_fetch_at: string;
  url?: string;
  /** Real scan interval of the new tracking; absent when the server does not return it. */
  polling_interval_seconds?: number;
}

function withBearer(init: RequestInit | undefined, token: string): RequestInit {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return { ...init, headers };
}

/**
 * fetch wrapper for API calls: attaches the access token and, on 401,
 * refreshes the session once and retries.
 */
async function safeFetch(url: string, init?: RequestInit): Promise<Response> {
  try {
    // A member's request must never be sent under another identity: neither when the proactive
    // refresh before sending falls back to a guest, nor when the retry after a 401 does.
    const memberId = sessionIsMember ? sessionUserId : null;
    const token = await ensureSession();
    if (memberId && sessionUserId !== memberId) throw new SessionExpiredError();

    const sentAs = sessionIsMember ? sessionUserId : null;
    const res = await fetch(url, withBearer(init, token));
    if (res.status !== 401) return res;
    // Another request may already have refreshed the token; only force a refresh when it has not.
    const fresh = await ensureSession(token === accessToken);
    if (sentAs && sessionUserId !== sentAs) throw new SessionExpiredError();
    return await fetch(url, withBearer(init, fresh));
  } catch (err: any) {
    if (err instanceof SessionExpiredError) throw err;
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

/** A non-2xx API response carrying the server's own message (and the Retry-After wait for 429). */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    /** Seconds from the Retry-After header; undefined when the server did not send one. */
    public retryAfterSeconds?: number
  ) {
    super(message);
  }
}

/** Parses Retry-After (delta-seconds or an HTTP date) into whole seconds; undefined when absent/invalid. */
function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  const date = Date.parse(trimmed);
  if (isNaN(date)) return undefined;
  return Math.max(0, Math.ceil((date - Date.now()) / 1000));
}

/** "2 phút 5 giây" / "45 giây" */
export function formatWaitVi(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  if (m === 0) return `${rest} giây`;
  return rest === 0 ? `${m} phút` : `${m} phút ${rest} giây`;
}

/**
 * Builds an ApiError from a failed response using the server's text (plain text or JSON {message|error}).
 * On 429 the Retry-After wait is appended so the user knows how long to wait.
 */
async function apiErrorFrom(res: Response, fallback: string): Promise<ApiError> {
  let msg = "";
  try {
    const text = (await res.text()).trim();
    msg = text;
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object") msg = parsed.message || parsed.error || text;
    } catch {
      // plain-text body
    }
  } catch {
    // body unreadable: use the fallback below
  }
  const retryAfter = res.status === 429 ? parseRetryAfter(res.headers.get("Retry-After")) : undefined;
  let message = msg || `${fallback} (HTTP ${res.status})`;
  if (retryAfter !== undefined && retryAfter > 0) {
    message = `${message} (Vui lòng thử lại sau ${formatWaitVi(retryAfter)}.)`;
  }
  return new ApiError(res.status, message, retryAfter);
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
    // 429 = per-user rate limit (message + Retry-After wait)
    throw await apiErrorFrom(res, "Không thể theo dõi sản phẩm. Vui lòng kiểm tra lại đường link.");
  }

  const data: TrackResponse = await res.json();

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

  return trackings;
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

  return (await res.json()) as TrackedProduct;
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
  ConnectZaloResponse,
  ZaloOtpResponse,
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
 * The target price shown everywhere is the newest active, non-expired target_price rule,
 * so the list and the detail page always agree.
 */
export function pickActiveTargetRule(rules: AlertRule[], now = Date.now()): AlertRule | undefined {
  let picked: AlertRule | undefined;
  for (const rule of rules) {
    if (rule.rule_type !== "target_price" || !rule.active) continue;
    if (rule.expires_at && new Date(rule.expires_at).getTime() <= now) continue;
    if (!picked || new Date(rule.created_at).getTime() > new Date(picked.created_at).getTime()) {
      picked = rule;
    }
  }
  return picked;
}

/** Thrown when the new target rule was saved but the previous target rules could not be removed. */
export class TargetCleanupError extends Error {
  constructor(public rule: AlertRule) {
    super("Đã lưu giá mục tiêu mới nhưng không xóa được giá mục tiêu cũ. Vui lòng thử lại.");
  }
}

/**
 * Saves a target price: creates the new target_price rule, then deletes the user's other active
 * target_price rules for this tracking so only one target exists. Throws TargetCleanupError
 * (carrying the saved rule) when the old rules could not all be deleted.
 */
export async function replaceTargetPriceRule(
  trackedProductIdOrSourceId: string,
  payload: CreateAlertPayload
): Promise<AlertRule> {
  const rule = await createAlert(trackedProductIdOrSourceId, payload);
  try {
    const stale = (await listAlerts(trackedProductIdOrSourceId)).filter(
      (r) => r.rule_type === "target_price" && r.active && r.id !== rule.id
    );
    const results = await Promise.allSettled(stale.map((r) => deleteAlert(r.id)));
    if (results.some((r) => r.status === "rejected")) throw new Error("cleanup failed");
  } catch {
    throw new TargetCleanupError(rule);
  }
  return rule;
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
 * Step 1 of Zalo linking (members only): ask the server to send a 6-digit OTP by ZNS to `phone`.
 * Errors carry the server's message: 400 invalid phone, 403 guest, 429 too many / resend too early
 * (retryAfterSeconds), 503 Zalo OA not configured, 502 Zalo failed to send.
 */
export async function requestZaloOtp(phone: string): Promise<ZaloOtpResponse> {
  const res = await safeFetch(`${API_BASE_URL}/users/me/zalo/otp`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ phone }),
  });
  if (!res.ok) {
    throw await apiErrorFrom(res, "Không thể gửi mã xác minh qua Zalo");
  }
  return res.json();
}

/**
 * Step 2 of Zalo linking: verify the OTP and link `phone` to the signed-in member.
 * Errors carry the server's message: 400 wrong/expired code, 429 too many wrong attempts, 403 guest.
 */
export async function connectZalo(payload: ConnectZaloPayload): Promise<ConnectZaloResponse> {
  const res = await safeFetch(`${API_BASE_URL}/users/me/zalo`, {
    method: "POST",
    headers: getAuthHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw await apiErrorFrom(res, "Không thể liên kết tài khoản Zalo");
  }

  return res.json();
}

/**
 * Disconnect Zalo account.
 */
export async function disconnectZalo(): Promise<{ status: string }> {
  const res = await safeFetch(`${API_BASE_URL}/auth/zalo/disconnect`, {
    method: "POST",
    // POST /auth/* only accepts JSON (CSRF guard)
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: "{}",
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
  // 409 = already linked or a shared group only auto-match may change; 429 = rate limited.
  // Both carry the server's message, which is shown as-is.
  if (!res.ok) {
    throw await apiErrorFrom(res, "Không thể liên kết sàn");
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

/** Google login with an ID token from Google Identity Services. Migrates the current guest data. */
export async function authGoogleLogin(idToken: string): Promise<AuthSession> {
  // A fresh guest token is required for the server to migrate this browser's guest data.
  const guestToken = sessionIsMember ? null : await ensureSession().catch(() => null);
  try {
    // Under the refresh lock: a guest refresh in another tab must not overwrite the new member cookie
    // (the lock is not re-entrant, so ensureSession above stays outside it)
    const session = await withCrossTabLock(() => postAuth("/auth/google", { id_token: idToken }, guestToken));
    applySession(session);
    return session;
  } catch (err) {
    if (err instanceof HttpError) {
      if (err.status === 401) throw new Error("Google từ chối xác thực. Vui lòng thử đăng nhập lại.");
      if (err.status === 503) throw new Error("Đăng nhập Google chưa được cấu hình trên máy chủ.");
      if (err.status === 409) throw new Error("Email này đã gắn với một tài khoản Google khác.");
      throw new Error(`Đăng nhập Google thất bại (HTTP ${err.status}).`);
    }
    throw err;
  }
}

/** Revokes the refresh cookie, then continues as a new guest. Throws (keeping the session) if the server did not confirm. */
export async function authLogout(): Promise<void> {
  let res: Response;
  try {
    // Under the refresh lock, so a refresh in another tab cannot rotate the cookie mid-logout
    res = await withCrossTabLock(() =>
      fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })
    );
  } catch {
    throw new Error(CONNECTION_ERROR);
  }
  if (!res.ok) {
    throw new Error("Đăng xuất thất bại. Vui lòng thử lại.");
  }
  applySession(null);
  try {
    await ensureSession();
  } catch {
    // The logout itself succeeded; only the follow-up guest session failed (e.g. 429). Clear the member's
    // data from the UI now (applySession(null) does not notify) and let the next request start the guest session.
    sessionListeners.forEach((l) => l({ memberSessionExpired: false }));
  }
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
  // "No suggestions" is a 200 with an empty list; any non-2xx (incl. 404 = tracking not accessible) is an error.
  if (!res.ok) {
    throw new Error("Không thể tải gợi ý sản phẩm tương đồng");
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
  // 409 = shared comparison group (only auto-match may change it); 429 = rate limited
  if (!res.ok) {
    throw await apiErrorFrom(res, "Không thể chấp nhận liên kết gợi ý");
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
  // 409 = shared comparison group (only auto-match may change it)
  if (!res.ok) {
    throw await apiErrorFrom(res, "Không thể bỏ qua gợi ý");
  }
  return await res.json();
}

export async function triggerAutoMatch(idOrProductId: string): Promise<AutoMatchResult> {
  const res = await safeFetch(`${API_BASE_URL}/tracked-products/${idOrProductId}/auto-match`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  // 409 = the product has no price yet; 429 = rate limited (with Retry-After)
  if (!res.ok) {
    throw await apiErrorFrom(res, "Tìm kiếm tự động thất bại");
  }
  return await res.json();
}

/**
 * Phase 3.5.2: Voucher Intelligence & 2-Step Combo API functions
 */

export interface ProductVoucher {
  id: string;
  product_source_id: string;
  voucher_type: "shop_voucher" | "platform_voucher" | "freeship_voucher";
  voucher_code?: string;
  title: string;
  discount_amount: number;
  discount_percent: number;
  min_order_value: number;
  collect_url?: string;
  affiliate_collect_url?: string;
  expires_at?: string;
}

export interface VoucherCalculation {
  listed_price: number;
  shop_discount: number;
  platform_coupon: number;
  shipping_fee: number;
  /** null (or 0 from older servers) when the product has no price yet. */
  effective_price: number | null;
  total_savings: number;
  best_shop_voucher?: ProductVoucher;
  best_platform_voucher?: ProductVoucher;
  best_freeship_voucher?: ProductVoucher;
  available_vouchers: ProductVoucher[];
}

export interface VoucherResponse {
  product_source_id: string;
  product_id: string;
  platform: string;
  canonical_url?: string;
  affiliate_url?: string;
  /** null until a price has been fetched */
  calculation: VoucherCalculation | null;
  /** false when the shipping fee is unknown and left out of the calculation */
  shipping_fee_known: boolean;
  vouchers: ProductVoucher[];
}

export async function getTrackedProductVouchers(id: string): Promise<VoucherResponse> {
  const res = await safeFetch(`${API_BASE_URL}/tracked-products/${id}/vouchers`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  // "No vouchers" is a 200 with an empty list; any non-2xx (incl. 404 = tracking not accessible) is an error.
  if (!res.ok) {
    throw new Error("Không thể tải mã giảm giá của sản phẩm");
  }
  return await res.json();
}



