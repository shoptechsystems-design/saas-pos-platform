import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "@shared/const";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { getMembershipForUser } from "../db";
import type { TenantRole } from "../db";

const t = initTRPC.context<TrpcContext>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(t.middleware(async opts => {
  const { ctx, next } = opts;
  if (!ctx.user || ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
}));

const requireTenant = t.middleware(async opts => {
  const { ctx, next } = opts;
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  const membership = await getMembershipForUser(ctx.user.id);
  if (!membership || membership.tenant.status !== "active") {
    throw new TRPCError({ code: "FORBIDDEN", message: "An active tenant membership is required." });
  }
  return next({ ctx: { ...ctx, user: ctx.user, tenant: membership.tenant, membership: membership.membership } });
});

export const tenantProcedure = t.procedure.use(requireTenant);

function requireRole(roles: TenantRole[]) {
  return t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    const membership = await getMembershipForUser(ctx.user.id);
    if (!membership || membership.tenant.status !== "active" || !roles.includes(membership.membership.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Your role does not have permission for this action." });
    }
    return next({ ctx: { ...ctx, user: ctx.user, tenant: membership.tenant, membership: membership.membership } });
  });
}

export const tenantAdminProcedure = t.procedure.use(requireRole(["tenant_admin"]));
export const cashierProcedure = t.procedure.use(requireRole(["tenant_admin", "cashier"]));
export const inventoryProcedure = t.procedure.use(requireRole(["tenant_admin", "inventory_manager"]));
