import { App } from "@capacitor/app";
import { Network } from "@capacitor/network";
import { useSyncExternalStore } from "react";
import { queryClient } from "./query";
import { api, ApiError } from "./rest";
import { getToken } from "./platform";
import type { CheckoutResult, PaymentMethod } from "./types";

/**
 * Offline checkout queue. Every sale carries a stable clientRequestId, so replaying a request the server
 * already processed returns the original sale instead of creating a duplicate or deducting stock twice.
 */
export interface CheckoutPayload {
  items: { productId: number; quantity: number }[];
  customerId?: number | null;
  paymentMethod: PaymentMethod;
  amountReceived: number;
  discount?: number;
  clientRequestId: string;
}
export interface QueuedCheckout {
  id: string; payload: CheckoutPayload; createdAt: number; retries: number;
  status: "pending" | "failed"; lastError?: string;
  /** For receipts shown while still offline. */
  summary: { total: number; itemCount: number; customerName?: string };
}

const KEY = "omnipos:queue";
const listeners = new Set<() => void>();
let snapshot: QueuedCheckout[] = load();
let syncing = false;
let syncListeners = new Set<() => void>();

function load(): QueuedCheckout[] { try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; } }
function save(next: QueuedCheckout[]) { snapshot = next; try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* quota */ } listeners.forEach(l => l()); }

export const newRequestId = () => `M${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
export const useQueue = () => useSyncExternalStore(cb => { listeners.add(cb); return () => { listeners.delete(cb); }; }, () => snapshot);
export const useSyncing = () => useSyncExternalStore(cb => { syncListeners.add(cb); return () => { syncListeners.delete(cb); }; }, () => syncing);
const setSyncing = (v: boolean) => { syncing = v; syncListeners.forEach(l => l()); };

export function enqueue(entry: Omit<QueuedCheckout, "id" | "retries" | "status" | "createdAt">) {
  save([...snapshot, { ...entry, id: entry.payload.clientRequestId, createdAt: Date.now(), retries: 0, status: "pending" }]);
  void syncQueue();
}
export const discard = (id: string) => save(snapshot.filter(q => q.id !== id));
export const retryNow = (id?: string) => { save(snapshot.map(q => (!id || q.id === id) && q.status === "failed" ? { ...q, status: "pending" } : q)); return syncQueue(); };

/** Send every pending sale. Network trouble keeps it queued; a definite server rejection marks it failed with the reason. */
export async function syncQueue() {
  if (syncing || !getToken()) return;
  const pending = snapshot.filter(q => q.status === "pending");
  if (!pending.length) return;
  setSyncing(true);
  let sent = 0;
  try {
    for (const entry of pending) {
      try {
        await api.post<CheckoutResult>("/pos/checkout", entry.payload);
        save(snapshot.filter(q => q.id !== entry.id)); sent++;
      } catch (e) {
        const err = e as ApiError;
        if (err instanceof ApiError && err.status === 401) break; // signed out: keep everything, retry after sign-in
        if (err instanceof ApiError && err.isNetwork) { save(snapshot.map(q => q.id === entry.id ? { ...q, retries: q.retries + 1, lastError: err.message } : q)); break; }
        save(snapshot.map(q => q.id === entry.id ? { ...q, status: "failed", retries: q.retries + 1, lastError: err instanceof Error ? err.message : "Rejected by the server." } : q));
      }
    }
  } finally {
    setSyncing(false);
    if (sent) for (const k of ["products", "sales", "stats", "recent", "customers", "lowStock", "trend", "top", "mix"]) queryClient.invalidateQueries({ queryKey: [k] });
  }
}

/** Retry on foreground, reconnect and every 30 s. Returns a cleanup function. */
export function startQueueRunner() {
  const run = () => void syncQueue();
  const sub = App.addListener("appStateChange", s => { if (s.isActive) run(); });
  const net = Network.addListener("networkStatusChange", s => { if (s.connected) run(); });
  const timer = window.setInterval(run, 30_000);
  window.addEventListener("online", run);
  run();
  return () => { void sub.then(h => h.remove()); void net.then(h => h.remove()); clearInterval(timer); window.removeEventListener("online", run); };
}
