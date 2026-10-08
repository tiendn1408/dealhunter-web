"use client";

import { useEffect, useRef } from "react";

const GSI_SRC = "https://accounts.google.com/gsi/client";

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

declare global {
  interface Window {
    google?: any;
  }
}

let gsiLoader: Promise<void> | null = null;
let gsiInitialized = false;
// The credential goes to whichever button is currently mounted.
let activeCredentialHandler: ((idToken: string) => void) | null = null;

function loadGoogleIdentityServices(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!gsiLoader) {
    gsiLoader = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = GSI_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        gsiLoader = null;
        reject(new Error("Không tải được Google Sign-In"));
      };
      document.head.appendChild(script);
    });
  }
  return gsiLoader;
}

interface GoogleSignInButtonProps {
  /** Receives the Google ID token (JWT credential) to send to the backend. */
  onCredential: (idToken: string) => void;
  onError?: (message: string) => void;
}

/** Renders the official Google Sign-In button. Requires NEXT_PUBLIC_GOOGLE_CLIENT_ID. */
export function GoogleSignInButton({ onCredential, onError }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  const errorRef = useRef(onError);
  callbackRef.current = onCredential;
  errorRef.current = onError;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;

    loadGoogleIdentityServices()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        if (!gsiInitialized) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response: { credential?: string }) => {
              if (response.credential) activeCredentialHandler?.(response.credential);
            },
            ux_mode: "popup",
          });
          gsiInitialized = true;
        }
        activeCredentialHandler = (idToken) => callbackRef.current(idToken);
        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "filled_black",
          size: "large",
          shape: "pill",
          text: "signin_with",
          width: containerRef.current.offsetWidth || 320,
        });
      })
      .catch((err: Error) => errorRef.current?.(err.message));

    return () => {
      cancelled = true;
      activeCredentialHandler = null;
    };
  }, []);

  if (!GOOGLE_CLIENT_ID) return null;
  return <div ref={containerRef} className="flex w-full justify-center" />;
}
