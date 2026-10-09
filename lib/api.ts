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
/** Identifies this tab in cross-tab locks and session announcements. */
const tabLockId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

let accessToken: string | null = null;
let accessTokenExpiresAt = 0;
let sessionUserId: string | null = null;
let sessionIsMember = false;
// False until the page load's first ensureSession attempt has settled (succeeded or failed). The session
// that attempt applies is not announced; any later identity change (or one after a failed first attempt) is.
let initialSessionAttemptSettled = false;
let sessionPromise: Promise<string> | null = null;
// When this tab last received a session from the server (0 = never); compared with the logout marker below
let sessionObtainedAt = 0;
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

function notifySessionChange(memberSessionExpired: boolean) {
  sessionListeners.forEach((l) => l({ memberSessionExpired }));
}

/**
 * Applies (or clears) the in-memory session. `announce: false` is used only for the session applied by
 * the page load's first ensureSession: nothing is cached yet, and resetting the queries waiting for it
 * would only send every request twice. Clearing (logout) is followed by a guest session, which is the
 * change worth announcing.
 */
function applySession(session: AuthSession | null, memberSessionExpired = false, announce = true) {
  const prevUserId = sessionUserId;
  accessToken = session?.access_token ?? null;
  accessTokenExpiresAt = session ? Date.now() + session.expires_in * 1000 - TOKEN_EXPIRY_SKEW_MS : 0;
  sessionUserId = session?.user.id ?? null;
  sessionIsMember = !!session && session.user.auth_provider !== "guest";
  if (session) sessionObtainedAt = Date.now();
  pushSessionToExtension(
    session && sessionIsMember
      ? { accessToken: session.access_token, expiresAt: accessTokenExpiresAt, email: session.user.email, name: session.user.name }
      : null
  );
  if (session && prevUserId !== sessionUserId && announce) {
    notifySessionChange(memberSessionExpired);
  }
}

/**
 * Cross-tab session announcements: after a sign-in or sign-out in this tab, the other tabs drop their
 * in-memory token, refresh once (under the cross-tab refresh lock, so the refresh cookie is never
 * replayed) and reset their queries if the identity changed. Only explicit sign-in/sign-out is announced,
 * never a refresh, so a tab reacting to an announcement cannot trigger further announcements.
 */
const SESSION_CHANNEL_NAME = "dealhunter-session";
interface SessionBroadcast {
  type: "session-changed";
  from: string;
  /** The identity the sending tab now has; null when it has none (e.g. the guest session failed to start). */
  userId: string | null;
}
let sessionChannel: BroadcastChannel | null = null;

function broadcastSessionChange() {
  if (typeof window === "undefined") return;
  const msg: SessionBroadcast = { type: "session-changed", from: tabLockId, userId: sessionUserId };
  if (sessionChannel) {
    try {
      sessionChannel.postMessage(msg);
      return;
    } catch {
      // fall through to the storage event
    }
  }
  try {
    // A unique value so every announcement fires a storage event in the other tabs
    localStorage.setItem(SESSION_CHANNEL_NAME, JSON.stringify({ ...msg, at: Date.now(), nonce: Math.random() }));
    localStorage.removeItem(SESSION_CHANNEL_NAME);
  } catch {
    // Storage unusable: the other tabs notice the change on their next refresh
  }
}

function handleSessionBroadcast(data: unknown) {
  const msg = data as Partial<SessionBroadcast> | null;
  if (!msg || msg.type !== "session-changed" || typeof msg.from !== "string") return;
  if (msg.from === tabLockId) return; // never act on our own announcement
  const targetUserId = typeof msg.userId === "string" ? msg.userId : null;
  if (targetUserId && targetUserId === sessionUserId) return; // already in sync
  const resync = () => {
    if (targetUserId && targetUserId === sessionUserId) return;
    // Drop the in-memory token; the change was deliberate in another tab, so it is not shown as an
    // expired member session.
    accessToken = null;
    accessTokenExpiresAt = 0;
    sessionIsMember = false;
    ensureSession().catch(() => {
      // No session could be started: still clear the previous identity's data from this tab
      notifySessionChange(false);
    });
  };
  // A refresh already in flight may have run before the other tab's change: resync after it settles
  if (sessionPromise) sessionPromise.then(resync, resync);
  else resync();
}

if (typeof window !== "undefined") {
  try {
    if (typeof BroadcastChannel !== "undefined") {
      sessionChannel = new BroadcastChannel(SESSION_CHANNEL_NAME);
      sessionChannel.onmessage = (e) => handleSessionBroadcast(e.data);
    }
  } catch {
    sessionChannel = null;
  }
  if (!sessionChannel) {
    try {
      window.addEventListener("storage", (e) => {
        if (e.key !== SESSION_CHANNEL_NAME || !e.newValue) return;
        try {
          handleSessionBroadcast(JSON.parse(e.newValue));
        } catch {
          // malformed value: ignore
        }
      });
    } catch {
      // no storage events: announcements from other tabs are not received
    }
  }
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
    if (held) {
      // Renew only while the lock is still ours: if it expired and another tab took it, stop renewing
      // instead of overwriting its claim (and the finally below leaves its lock in place).
      renew = setInterval(() => {
        if (readStorageLock()?.owner === owner) {
          writeStorageLock(owner);
        } else if (renew) {
          clearInterval(renew);
          renew = undefined;
        }
      }, STORAGE_LOCK_TTL_MS / 3);
    }
    return await fn();
  } finally {
    if (renew) clearInterval(renew);
    // Release only our own lock, never one another tab claimed after ours was lost
    if (held && readStorageLock()?.owner === owner) {
      try {
        localStorage.removeItem(REFRESH_LOCK_NAME);
      } catch {}
    }
  }
}

/**
 * A deliberate sign-out is recorded (time and tab) while the logging-out tab still holds the refresh lock.
 * A tab whose refresh was queued behind that lock then finds the cookie revoked (or replaced by the new
 * guest's): the marker tells it the member session ended by choice, not by expiry, so no "expired" banner.
 */
const LOGOUT_MARKER_KEY = "dealhunter-logout";

function recordDeliberateLogout() {
  try {
    localStorage.setItem(LOGOUT_MARKER_KEY, JSON.stringify({ at: Date.now(), by: tabLockId }));
  } catch {
    // Storage unusable: the other tabs may show the expired banner for this logout
  }
}

/** True when some tab signed out deliberately after this tab last received its session. */
function loggedOutDeliberatelySince(since: number): boolean {
  try {
    const raw = localStorage.getItem(LOGOUT_MARKER_KEY);
    if (!raw) return false;
    const marker = JSON.parse(raw);
    return typeof marker?.at === "number" && marker.at >= since;
  } catch {
    return false;
  }
}

/** A member session ended in this tab without a deliberate sign-out anywhere since it was obtained. */
function memberSessionExpiredHere(wasMember: boolean, obtainedAt: number): boolean {
  return wasMember && !loggedOutDeliberatelySince(obtainedAt);
}

function refreshOrStartGuest(announce: boolean): Promise<string> {
  return withCrossTabLock(() => refreshOrStartGuestUnlocked(announce));
}

/** A failed session start as a clear message (never the server's raw response text). */
function sessionStartError(err: unknown): Error {
  if (err instanceof HttpError) {
    if (err.status === 429) {
      return new Error("Máy chủ đang giới hạn số lần tạo phiên. Vui lòng thử lại sau ít phút.");
    }
    return new Error(`Không thể bắt đầu phiên làm việc với máy chủ (HTTP ${err.status}). Vui lòng thử lại sau.`);
  }
  return err instanceof Error ? err : new Error(CONNECTION_ERROR);
}

async function refreshOrStartGuestUnlocked(announce: boolean): Promise<string> {
  const wasMember = sessionIsMember;
  const obtainedAt = sessionObtainedAt;
  try {
    const session = await postAuth("/auth/refresh");
    // The cookie can belong to a guest when another tab logged out: the member session ended here, but it
    // is shown as expired only when no tab signed out deliberately.
    applySession(
      session,
      session.user.auth_provider === "guest" && memberSessionExpiredHere(wasMember, obtainedAt),
      announce
    );
    return session.access_token;
  } catch (err) {
    // Not a definitive answer (network, 5xx, 429): keep the current session, report the failure
    if (!(err instanceof HttpError && err.status === 401)) throw sessionStartError(err);
  }
  // No usable refresh cookie: the member session (if any) is definitively gone. Clear it before trying
  // a guest session, so the UI stops treating this browser as signed in even if that attempt fails.
  if (wasMember) applySession(null);
  // A sign-out in another tab revoked the cookie while this refresh waited for the lock: not an expiry
  const expired = memberSessionExpiredHere(wasMember, obtainedAt);
  try {
    const guest = await postAuth("/auth/guest");
    // Tells the UI if a member session ended (prevUserId is null after the clear above, so this announces)
    applySession(guest, expired, announce);
    return guest.access_token;
  } catch (err) {
    if (wasMember && !expired) {
      // Deliberate sign-out elsewhere: clear the member's data, report the real guest-session failure
      notifySessionChange(false);
      throw sessionStartError(err);
    }
    if (wasMember) {
      // Show the session-expired banner and clear the member's data even without a guest session
      notifySessionChange(true);
      throw new SessionExpiredError();
    }
    throw sessionStartError(err);
  }
}

function hasFreshToken(): boolean {
  return !!accessToken && Date.now() < accessTokenExpiresAt;
}

/** Returns a valid access token, restoring the session from the refresh cookie or starting a guest session. */
export function ensureSession(forceRefresh = false): Promise<string> {
  if (!forceRefresh && hasFreshToken()) return Promise.resolve(accessToken as string);
  if (!sessionPromise) {
    // Only the page load's first attempt is silent; once it settled (even by failing) every change is announced
    const announce = initialSessionAttemptSettled;
    sessionPromise = refreshOrStartGuest(announce).finally(() => {
      initialSessionAttemptSettled = true;
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

/** RFC3339 in UTC, whole seconds (the backend's `from`/`to` format). */
function toRfc3339(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

/**
 * Fetch price snapshot history for a tracked product or source between `from` and `to` (default: now).
 * `from` is required: without it the backend silently returns only its default window (30 days).
 * A range the backend rejects (e.g. longer than it allows) is an error, never an empty history.
 */
export async function getPriceHistory(
  sourceOrTrackingId: string,
  from: Date,
  to?: Date
): Promise<PriceSnapshot[]> {
  if (isNaN(from.getTime()) || (to && isNaN(to.getTime()))) {
    throw new Error("Không thể tải lịch sử giá: khoảng thời gian không hợp lệ");
  }
  const params = new URLSearchParams({ from: toRfc3339(from) });
  if (to) params.set("to", toRfc3339(to));
  const url = `${API_BASE_URL}/tracked-products/${sourceOrTrackingId}/prices?${params.toString()}`;

  const res = await safeFetch(url, { cache: "no-store" });
  if (!res.ok) {
    if (res.status === 400) {
      const detail = (await res.text().catch(() => "")).trim();
      throw new ApiError(
        400,
        `Máy chủ từ chối khoảng thời gian lịch sử giá được yêu cầu${detail ? ` (${detail})` : ""}`
      );
    }
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
    broadcastSessionChange();
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
    res = await withCrossTabLock(async () => {
      const r = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      // Recorded before the lock is released, so a refresh queued in another tab sees it
      if (r.ok) recordDeliberateLogout();
      return r;
    });
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
    notifySessionChange(false);
  }
  // Announced after the guest session (if any) set its cookie, so the other tabs refresh into it
  broadcastSessionChange();
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
  /** True when part of the run failed (a platform's search or storing a candidate): candidates may be missing. */
  incomplete?: boolean;
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
  // 409 = the product has no price yet; 429 = rate limited (with Retry-After); 502 = the marketplace
  // search could not be read. The server's message is shown as is.
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



