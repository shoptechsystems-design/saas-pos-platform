import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, qs } from "./rest";
import { getToken, useToken } from "./platform";
import type * as T from "./types";

/** Query keys, also used for invalidation after mutations. */
export const keys = {
  me: ["me"] as const, context: ["context"] as const, settings: ["settings"] as const,
  stats: ["stats"] as const, lowStock: ["lowStock"] as const, recent: ["recent"] as const,
  trend: (d: number) => ["trend", d] as const, top: (d: number) => ["top", d] as const, mix: (d: number) => ["mix", d] as const,
  categories: ["categories"] as const, products: (q?: string, c?: number) => ["products", q ?? "", c ?? 0] as const,
  customers: (q?: string) => ["customers", q ?? ""] as const, groups: ["groups"] as const,
  sales: (p: object) => ["sales", p] as const, sale: (id: number) => ["sale", id] as const,
};

/** Only fetch tenant data once a token exists. */
const useEnabled = () => Boolean(useToken());

// ---- offline-friendly catalog cache (so Sell still works without a connection) ----
const CACHE = "omnipos:cache:";
const cacheGet = <X,>(k: string): X | undefined => { try { const v = localStorage.getItem(CACHE + k); return v ? JSON.parse(v) : undefined; } catch { return undefined; } };
const cacheSet = (k: string, v: unknown) => { try { localStorage.setItem(CACHE + k, JSON.stringify(v)); } catch { /* quota */ } };
export const clearCaches = () => { try { Object.keys(localStorage).filter(k => k.startsWith(CACHE)).forEach(k => localStorage.removeItem(k)); } catch { /* ignore */ } };

async function cached<X>(key: string, load: () => Promise<X>): Promise<X> {
  try { const data = await load(); cacheSet(key, data); return data; }
  catch (e) { const hit = cacheGet<X>(key); if (hit !== undefined && e instanceof ApiError && e.isNetwork) return hit; throw e; }
}

// ---- auth & tenant ----
export const useMe = (enabled = true) => useQuery({ queryKey: keys.me, queryFn: () => api.get<T.User | null>("/auth/me"), enabled: enabled && Boolean(getToken()) });
export const useContext_ = () => { const on = useEnabled(); return useQuery({ queryKey: keys.context, queryFn: () => cached("context", () => api.get<T.TenantContext>("/tenant/context")), enabled: on }); };
export const useSettings = () => { const on = useEnabled(); return useQuery({ queryKey: keys.settings, queryFn: () => api.get<T.TenantSettings>("/tenant/settings"), enabled: on }); };

// ---- dashboard ----
export const useStats = () => { const on = useEnabled(); return useQuery({ queryKey: keys.stats, queryFn: () => cached("stats", () => api.get<T.Stats>("/dashboard/stats")), enabled: on }); };
export const useLowStock = () => { const on = useEnabled(); return useQuery({ queryKey: keys.lowStock, queryFn: () => api.get<T.Product[]>("/dashboard/low-stock"), enabled: on }); };
export const useRecentSales = () => { const on = useEnabled(); return useQuery({ queryKey: keys.recent, queryFn: () => api.get<{ sale: T.Sale; customer: { name: string } | null }[]>("/dashboard/recent-sales"), enabled: on }); };
export const useTrend = (days = 14) => { const on = useEnabled(); return useQuery({ queryKey: keys.trend(days), queryFn: () => api.get<T.TrendPoint[]>(`/dashboard/sales-trend?days=${days}`), enabled: on }); };
export const useTopProducts = (days = 30) => { const on = useEnabled(); return useQuery({ queryKey: keys.top(days), queryFn: () => api.get<T.TopProduct[]>(`/dashboard/top-products?days=${days}`), enabled: on }); };
export const usePaymentMix = (days = 30) => { const on = useEnabled(); return useQuery({ queryKey: keys.mix(days), queryFn: () => api.get<T.PaymentMix[]>(`/dashboard/payment-mix?days=${days}`), enabled: on }); };

// ---- catalog ----
export const useCategories = () => { const on = useEnabled(); return useQuery({ queryKey: keys.categories, queryFn: () => cached("categories", () => api.get<T.Category[]>("/categories")), enabled: on }); };
export const useProducts = (query?: string, categoryId?: number) => {
  const on = useEnabled();
  return useQuery({
    queryKey: keys.products(query, categoryId),
    queryFn: () => cached(`products:${query ?? ""}:${categoryId ?? 0}`, () => api.get<T.Product[]>(`/products${qs({ query, categoryId })}`)),
    enabled: on, placeholderData: prev => prev,
  });
};
export const useCustomers = (query?: string) => { const on = useEnabled(); return useQuery({ queryKey: keys.customers(query), queryFn: () => cached(`customers:${query ?? ""}`, () => api.get<T.Customer[]>(`/customers${qs({ query })}`)), enabled: on, placeholderData: prev => prev }); };
export const useGroups = () => { const on = useEnabled(); return useQuery({ queryKey: keys.groups, queryFn: () => api.get<T.CustomerGroup[]>("/customer-groups"), enabled: on }); };

// ---- generic helpers for screens that just list server data ----
export function useList<X>(key: readonly unknown[], path: string, enabled = true) {
  const on = useEnabled();
  return useQuery({ queryKey: key, queryFn: () => api.get<X>(path), enabled: on && enabled });
}

/** Run a mutation, then refresh the listed query roots. */
export function useAct<A, R = unknown>(fn: (arg: A) => Promise<R>, invalidate: string[] = []) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => { invalidate.forEach(k => qc.invalidateQueries({ queryKey: [k] })); } });
}
