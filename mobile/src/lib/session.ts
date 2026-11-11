import { useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "./rest";
import { setToken, useToken } from "./platform";
import { clearCaches, useContext_, useMe } from "./queries";
import type { Role, TenantContext, User } from "./types";

/** Who is signed in and what they may do. Makes no network call without a token. */
export function useSession() {
  const token = useToken();
  const me = useMe(Boolean(token));
  const ctx = useContext_();
  const role: Role | undefined = ctx.data?.membership.role;
  const admin = role === "tenant_admin";
  return {
    token, user: token ? me.data ?? null : null, tenant: ctx.data?.tenant, role,
    loading: Boolean(token) && (me.isLoading || (Boolean(me.data) && ctx.isLoading)),
    authed: Boolean(token) && Boolean(me.data),
    noWorkspace: Boolean(token) && Boolean(me.data) && ctx.isError && ctx.error instanceof ApiError && ctx.error.status === 403,
    unreachable: Boolean(token) && (me.isError || ctx.isError) && !(me.error instanceof ApiError && me.error.status === 401) && !(ctx.error instanceof ApiError && ctx.error.status === 403),
    retry: () => { me.refetch(); ctx.refetch(); },
    can: {
      sell: role === "tenant_admin" || role === "cashier",
      catalog: role === "tenant_admin" || role === "inventory_manager",   // products, stock, suppliers, purchasing
      admin,                                                              // reports, team, expenses create, settings, refunds
    },
  };
}

export function useAuthActions() {
  const qc = useQueryClient();
  const reset = () => { qc.clear(); clearCaches(); };
  return {
    async login(email: string, password: string) {
      const r = await api.post<{ user: User; token: string }>("/auth/login", { email, password });
      reset(); setToken(r.token);
    },
    async register(input: { name: string; businessName: string; email: string; password: string }) {
      const r = await api.post<{ user: User; token: string | null; tenantId: number }>("/auth/register", input);
      if (!r.token) throw new ApiError(500, "NO_TOKEN", "Account created. Please sign in.");
      reset(); setToken(r.token);
    },
    async logout() {
      try { await api.post("/auth/logout"); } catch { /* local sign-out is what matters */ }
      setToken(null); reset();
    },
  };
}
export type { TenantContext };
