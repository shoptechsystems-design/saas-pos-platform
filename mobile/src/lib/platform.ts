import { Capacitor } from "@capacitor/core";
import { useSyncExternalStore } from "react";

/** True inside the Android/iOS app, false in a desktop browser. */
export const isNative = Capacitor.isNativePlatform();

// In `pnpm dev` with no .env.local, fall back to the portal dev server (CORS is enabled on /api/v1).
const DEFAULT_API = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3000" : "")).replace(/\/+$/, "");
const KEYS = { token: "karyano:token", api: "karyano:api", onboarded: "karyano:onboarded" } as const;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };

function read(key: string): string | null { try { return window.localStorage.getItem(key); } catch { return null; } }
function write(key: string, value: string | null) {
  try { if (value) window.localStorage.setItem(key, value); else window.localStorage.removeItem(key); } catch { /* storage unavailable */ }
  emit();
}

/** Server base URL. People can override it on the sign-in screen (useful for LAN testing). */
export const getApiBase = () => (read(KEYS.api) ?? DEFAULT_API).replace(/\/+$/, "");
export const setApiBase = (url: string | null) => write(KEYS.api, url ? url.trim().replace(/\/+$/, "") : null);
export const defaultApiBase = DEFAULT_API;

export const getToken = () => read(KEYS.token);
export const setToken = (token: string | null) => write(KEYS.token, token);
export const useToken = () => useSyncExternalStore(subscribe, getToken);

export const isOnboarded = () => read(KEYS.onboarded) === "1";
export const setOnboarded = (v: boolean) => write(KEYS.onboarded, v ? "1" : null);
export const useOnboarded = () => useSyncExternalStore(subscribe, isOnboarded);

/**
 * Server settings are for developers and for builds that were shipped without a server address.
 * Normal users of a production build never see them. Tapping the logo 5 times on the sign-in screen
 * reveals them for the current session (useful for support and testing).
 */
const DEV_KEY = "karyano:dev";
const sessionFlag = () => { try { return window.sessionStorage.getItem(DEV_KEY) === "1"; } catch { return false; } };
const serverUiVisible = () => import.meta.env.DEV || !import.meta.env.VITE_API_URL || sessionFlag();
export const revealDeveloperOptions = () => { try { window.sessionStorage.setItem(DEV_KEY, "1"); } catch { /* storage unavailable */ } emit(); };
export const useServerSettingsVisible = () => useSyncExternalStore(subscribe, serverUiVisible);
