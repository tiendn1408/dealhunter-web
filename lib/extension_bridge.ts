/**
 * Hands the signed-in member session to the DealHunter Assistant extension, so it can show the member's
 * own tracked prices on Shopee pages. Guests and signed-out visitors clear it: the extension then offers
 * only its deal-hunting tools.
 *
 * The extension never refreshes the session itself (strict refresh-token rotation would revoke every
 * session if it raced this app), so a fresh access token is pushed on every sign-in and refresh.
 * Requires NEXT_PUBLIC_EXTENSION_ID and the extension's `externally_connectable` to list this origin.
 */
const EXTENSION_ID = process.env.NEXT_PUBLIC_EXTENSION_ID || "";
// Same base as lib/api.ts. Sent with every session message so the extension calls this deployment's API
// and links back to this site (it validates both and keeps its localhost defaults otherwise).
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1").replace(/\/+$/, "");

export interface ExtensionSession {
  accessToken: string;
  expiresAt: number; // epoch ms
  email?: string;
  name?: string;
}

export function pushSessionToExtension(session: ExtensionSession | null): void {
  if (!EXTENSION_ID || typeof window === "undefined") return;
  // chrome.runtime is only exposed to pages an installed extension lists in externally_connectable
  const runtime = (window as any).chrome?.runtime;
  if (!runtime?.sendMessage) return;
  try {
    runtime.sendMessage(
      EXTENSION_ID,
      {
        type: "DH_WEB_SESSION",
        accessToken: session?.accessToken ?? null,
        ...session,
        apiUrl: API_URL,
        webUrl: window.location.origin,
      },
      () => void runtime.lastError // extension not installed or disabled: nothing to do
    );
  } catch {
    // Invalid extension ID or messaging unavailable: the web app works the same without the extension
  }
}
