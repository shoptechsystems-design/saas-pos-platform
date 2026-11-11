import { Capacitor } from "@capacitor/core";
import { useSyncExternalStore } from "react";

/** True inside the Android/iOS app, false in a desktop browser. */
export const isNative = Capacitor.isNativePlatform();

const DEFAULT_API = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
const KEYS = { token: "omnipos:token", api: "omnipos:api", onboarded: "omnipos:onboarded" } as const;
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
