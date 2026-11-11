import type { Express, Request, Response, NextFunction } from "express";
import { Router } from "express";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { TRPCError } from "@trpc/server";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { sdk } from "./_core/sdk";
import { getUserByEmail } from "./db";

/**
 * REST API (v1) for the OmniPOS mobile app.
 *
 * Every endpoint is a thin adapter over the same tRPC procedures the portal uses
 * (via `appRouter.createCaller`), so validation, RBAC, tenant isolation and
 * business rules are identical for portal and mobile. Auth: `Authorization: Bearer <token>`
 * from `POST /api/v1/auth/login`.
 *
 * Success: `{ "data": ... }`.  Failure: `{ "error": { "code", "message" } }`.
 */

type Caller = ReturnType<typeof appRouter.createCaller>;
type Method = "get" | "post" | "put" | "patch" | "delete";
type Ctx = { caller: Caller; req: Request; res: Response; q: Record<string, unknown>; b: any; p: Record<string, string> };

interface Route {
  method: Method;
  path: string; // express style, relative to /api/v1
  tag: string;
  summary: string;
  roles: string; // human description for docs
  public?: boolean;
  handler: (c: Ctx) => Promise<unknown> | unknown;
}

// ---- helpers ---------------------------------------------------------------
const num = (v: unknown) => (v === undefined || v === null || v === "" ? undefined : Number(v));
const str = (v: unknown) => (v === undefined || v === null || v === "" ? undefined : String(v));
const id = (c: Ctx, key = "id") => Number(c.p[key]);
const ms = (v: unknown) => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  if (!Number.isNaN(n)) return n;
  const d = Date.parse(String(v));
  return Number.isNaN(d) ? undefined : d;
};
const sendPdfOrJson = (c: Ctx, result: { filename: string; base64: string; mimeType: string }) => {
  if (str(c.q.format) === "pdf") {
    c.res.setHeader("Content-Type", result.mimeType);
    c.res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
    c.res.send(Buffer.from(result.base64, "base64"));
    return undefined;
  }
  return result;
};
const salesFilters = (q: Record<string, unknown>) => ({
  search: str(q.search),
  customerId: num(q.customerId),
  paymentMethod: str(q.paymentMethod) as any,
  status: (str(q.status) ?? "completed") as any,
  from: ms(q.from),
  to: ms(q.to),
});

// ---- route table -----------------------------------------------------------
export const routes: Route[] = [
  // Auth
  { method: "post", path: "/auth/register", tag: "Auth", summary: "Create account + business workspace. Body: {name,businessName,email,password}. Returns user, tenantId, token.", roles: "public", public: true,
    handler: async ({ caller, b }) => {
      const r = await caller.auth.register(b);
      const user = await getUserByEmail(String(b.email).toLowerCase());
      const token = user ? await sdk.createSessionToken(user.openId, { name: user.name ?? b.email }) : null;
      return { ...r, token };
    } },
  { method: "post", path: "/auth/login", tag: "Auth", summary: "Body: {email,password}. Returns {user, token}. Send token as Bearer.", roles: "public", public: true,
    handler: ({ caller, b }) => caller.auth.login(b) },
  { method: "post", path: "/auth/logout", tag: "Auth", summary: "Stateless for Bearer tokens: discard the token client-side.", roles: "public", public: true,
    handler: ({ caller }) => caller.auth.logout() },
  { method: "get", path: "/auth/me", tag: "Auth", summary: "Current user (null if no valid token).", roles: "public", public: true,
    handler: ({ caller }) => caller.auth.me() },

  // Tenant
  { method: "get", path: "/tenant/context", tag: "Tenant", summary: "Active tenant + membership (role).", roles: "any member", handler: ({ caller }) => caller.tenant.context() },
  { method: "get", path: "/tenant/settings", tag: "Tenant", summary: "Business name, currency, tax rate, logo, receipt footer.", roles: "any member", handler: ({ caller }) => caller.tenant.settings() },
  { method: "put", path: "/tenant/settings", tag: "Tenant", summary: "Body: {name,businessType,currency,taxRate,logoUrl?,receiptFooter?}.", roles: "tenant_admin", handler: ({ caller, b }) => caller.tenant.updateSettings(b) },
  { method: "post", path: "/tenant/logo", tag: "Tenant", summary: "Body: {filename,base64Data,contentType}. Max 5MB.", roles: "tenant_admin", handler: ({ caller, b }) => caller.tenant.uploadLogo(b) },

  // Dashboard
  { method: "get", path: "/dashboard/stats", tag: "Dashboard", summary: "Headline KPIs.", roles: "any member", handler: ({ caller }) => caller.dashboard.stats() },
  { method: "get", path: "/dashboard/low-stock", tag: "Dashboard", summary: "Products at/below minimum stock.", roles: "any member", handler: ({ caller }) => caller.dashboard.lowStock() },
  { method: "get", path: "/dashboard/recent-sales", tag: "Dashboard", summary: "Latest sales.", roles: "any member", handler: ({ caller }) => caller.dashboard.recentSales() },
  { method: "get", path: "/dashboard/sales-trend", tag: "Dashboard", summary: "?days=7..90 (default 14).", roles: "any member", handler: ({ caller, q }) => caller.dashboard.salesTrend({ days: num(q.days) ?? 14 }) },
  { method: "get", path: "/dashboard/top-products", tag: "Dashboard", summary: "?days=1..90 (default 30).", roles: "any member", handler: ({ caller, q }) => caller.dashboard.topProducts({ days: num(q.days) ?? 30 }) },
  { method: "get", path: "/dashboard/payment-mix", tag: "Dashboard", summary: "?days=1..90 (default 30).", roles: "any member", handler: ({ caller, q }) => caller.dashboard.paymentMix({ days: num(q.days) ?? 30 }) },

  // Catalog
  { method: "get", path: "/categories", tag: "Catalog", summary: "List categories.", roles: "any member", handler: ({ caller }) => caller.catalog.categories() },
  { method: "post", path: "/categories", tag: "Catalog", summary: "Body: {name,color?}.", roles: "tenant_admin", handler: ({ caller, b }) => caller.catalog.createCategory(b) },
  { method: "put", path: "/categories/:id", tag: "Catalog", summary: "Body: {name,color?}.", roles: "tenant_admin", handler: (c) => c.caller.catalog.updateCategory({ ...c.b, id: id(c) }) },
  { method: "delete", path: "/categories/:id", tag: "Catalog", summary: "Delete category.", roles: "tenant_admin", handler: (c) => c.caller.catalog.deleteCategory({ id: id(c) }) },
  { method: "get", path: "/products", tag: "Catalog", summary: "?query=&categoryId=. Query matches name/SKU/barcode.", roles: "any member", handler: ({ caller, q }) => caller.catalog.products({ query: str(q.query ?? q.search), categoryId: num(q.categoryId) }) },
  { method: "post", path: "/products", tag: "Catalog", summary: "Body: {name,sellingPrice,stockQuantity,sku?,barcode?,categoryId?,costPrice?,discountPrice?,taxRate?,minStockLevel?,unit?,imageUrl?}.", roles: "tenant_admin, inventory_manager", handler: ({ caller, b }) => caller.catalog.createProduct(b) },
  { method: "put", path: "/products/:id", tag: "Catalog", summary: "Body: {name,sku,sellingPrice,stockQuantity,categoryId?,imageUrl?}.", roles: "tenant_admin, inventory_manager", handler: (c) => c.caller.catalog.updateProduct({ ...c.b, id: id(c) }) },
  { method: "delete", path: "/products/:id", tag: "Catalog", summary: "Delete product.", roles: "tenant_admin, inventory_manager", handler: (c) => c.caller.catalog.deleteProduct({ id: id(c) }) },
  { method: "post", path: "/products/image", tag: "Catalog", summary: "Body: {filename,base64Data,contentType}. Returns {url}.", roles: "tenant_admin, inventory_manager", handler: ({ caller, b }) => caller.catalog.uploadProductImage(b) },
  { method: "get", path: "/products/:id/variants", tag: "Catalog", summary: "List variants of a product.", roles: "any member", handler: (c) => c.caller.inventory.variants({ productId: id(c) }) },
  { method: "post", path: "/products/:id/variants", tag: "Catalog", summary: "Body: {name,sku,additionalPrice?,stockQuantity?}.", roles: "tenant_admin, inventory_manager", handler: (c) => c.caller.inventory.createVariant({ ...c.b, productId: id(c) }) },
  { method: "delete", path: "/variants/:id", tag: "Catalog", summary: "Delete variant.", roles: "tenant_admin, inventory_manager", handler: (c) => c.caller.inventory.deleteVariant({ id: id(c) }) },

  // Customers
  { method: "get", path: "/customers", tag: "Customers", summary: "?query=", roles: "any member", handler: ({ caller, q }) => caller.customers.list({ query: str(q.query ?? q.search) }) },
  { method: "post", path: "/customers", tag: "Customers", summary: "Body: {name,email?,phone?,groupId?}. Optional FKs: omit or null, never \"\".", roles: "tenant_admin, cashier", handler: ({ caller, b }) => caller.customers.create(b) },
  { method: "get", path: "/customers/:id/statement", tag: "Customers", summary: "?from=&to= (ms or ISO). JSON {filename,mimeType,base64}; add &format=pdf for the binary PDF.", roles: "any member", handler: async c => sendPdfOrJson(c, await c.caller.reports.customerStatementPdf({ customerId: id(c), from: ms(c.q.from), to: ms(c.q.to) })) },
  { method: "get", path: "/customer-groups", tag: "Customers", summary: "List groups.", roles: "any member", handler: ({ caller }) => caller.customerGroups.list() },
  { method: "post", path: "/customer-groups", tag: "Customers", summary: "Body: {name,discountPercent?}.", roles: "tenant_admin", handler: ({ caller, b }) => caller.customerGroups.create(b) },
  { method: "delete", path: "/customer-groups/:id", tag: "Customers", summary: "Delete group.", roles: "tenant_admin", handler: (c) => c.caller.customerGroups.delete({ id: id(c) }) },

  // POS / Sales
  { method: "post", path: "/pos/checkout", tag: "POS", summary: "Body: {items:[{productId,quantity}],paymentMethod,amountReceived,discount?,customerId?,clientRequestId?}. Send a stable clientRequestId (8-48 chars) for idempotent offline replay; replays return replayed:true.", roles: "tenant_admin, cashier", handler: ({ caller, b }) => caller.pos.checkout(b) },
  { method: "get", path: "/sales", tag: "Sales", summary: "?search&customerId&paymentMethod&status=completed|refunded|all&from&to&page&pageSize. Returns {rows,total,revenue,avgOrder,refundedCount}.", roles: "any member", handler: ({ caller, q }) => caller.salesHistory.list({ ...salesFilters(q), page: num(q.page) ?? 1, pageSize: num(q.pageSize) ?? 15 }) },
  { method: "get", path: "/sales/export", tag: "Sales", summary: "Same filters as /sales; up to 5000 flat rows for export.", roles: "any member", handler: ({ caller, q }) => caller.salesHistory.exportRows(salesFilters(q)) },
  { method: "get", path: "/sales/:id", tag: "Sales", summary: "Sale with customer, cashier and line items.", roles: "any member", handler: (c) => c.caller.salesHistory.detail({ id: id(c) }) },
  { method: "post", path: "/sales/:id/refund", tag: "Sales", summary: "Body: {reason}. Restocks items.", roles: "tenant_admin", handler: (c) => c.caller.salesHistory.refund({ id: id(c), reason: c.b?.reason }) },

  // Reports
  { method: "get", path: "/reports/overview", tag: "Reports", summary: "?from=&to= (required, ms or ISO).", roles: "tenant_admin", handler: ({ caller, q }) => caller.reports.overview({ from: ms(q.from) as number, to: ms(q.to) as number }) },
  { method: "get", path: "/reports/reconciliation", tag: "Reports", summary: "?from&to. JSON with base64 + summary; add &format=pdf for binary.", roles: "any member", handler: async c => { const r = await c.caller.reports.reconciliationPdf({ from: ms(c.q.from), to: ms(c.q.to) }); return str(c.q.format) === "pdf" ? sendPdfOrJson(c, r) : r; } },

  // Inventory
  { method: "get", path: "/inventory", tag: "Inventory", summary: "?query=", roles: "any member", handler: ({ caller, q }) => caller.inventory.list({ query: str(q.query ?? q.search) }) },
  { method: "get", path: "/inventory/low-stock", tag: "Inventory", summary: "Low-stock products.", roles: "any member", handler: ({ caller }) => caller.inventory.lowStock() },
  { method: "post", path: "/inventory/adjust", tag: "Inventory", summary: "Body: {productId,quantity(+/-),reason}.", roles: "tenant_admin, inventory_manager", handler: ({ caller, b }) => caller.inventory.adjust(b) },
  { method: "get", path: "/inventory/movements", tag: "Inventory", summary: "?productId= (last 500).", roles: "tenant_admin, inventory_manager", handler: ({ caller, q }) => caller.inventory.movements({ productId: num(q.productId) }) },

  // Suppliers & Purchases
  { method: "get", path: "/suppliers", tag: "Purchasing", summary: "List suppliers.", roles: "any member", handler: ({ caller }) => caller.suppliers.list() },
  { method: "post", path: "/suppliers", tag: "Purchasing", summary: "Body: {name,email?,phone?,notes?}.", roles: "tenant_admin, inventory_manager", handler: ({ caller, b }) => caller.suppliers.create(b) },
  { method: "get", path: "/purchases", tag: "Purchasing", summary: "List purchase orders.", roles: "tenant_admin, inventory_manager", handler: ({ caller }) => caller.purchases.list() },
  { method: "post", path: "/purchases", tag: "Purchasing", summary: "Body: {supplierId?,notes?,items:[{productId,quantity,unitCost}]}.", roles: "tenant_admin, inventory_manager", handler: ({ caller, b }) => caller.purchases.create(b) },
  { method: "get", path: "/purchases/:id/items", tag: "Purchasing", summary: "PO line items.", roles: "tenant_admin, inventory_manager", handler: (c) => c.caller.purchases.items({ id: id(c) }) },
  { method: "post", path: "/purchases/:id/receive", tag: "Purchasing", summary: "Receive stock into inventory.", roles: "tenant_admin, inventory_manager", handler: (c) => c.caller.purchases.receive({ id: id(c) }) },
  { method: "post", path: "/purchases/:id/cancel", tag: "Purchasing", summary: "Cancel an open PO.", roles: "tenant_admin, inventory_manager", handler: (c) => c.caller.purchases.cancel({ id: id(c) }) },

  // Expenses
  { method: "get", path: "/expenses", tag: "Expenses", summary: "Last 500 expenses.", roles: "any member", handler: ({ caller }) => caller.expenses.list() },
  { method: "post", path: "/expenses", tag: "Expenses", summary: "Body: {category,amount,notes?,expenseDate? (ISO or ms)}.", roles: "tenant_admin", handler: ({ caller, b }) => { const d = ms(b?.expenseDate); return caller.expenses.create({ ...b, expenseDate: d === undefined ? undefined : new Date(d) }); } },

  // Team & Activity
  { method: "get", path: "/team", tag: "Team", summary: "Members of the tenant.", roles: "tenant_admin", handler: ({ caller }) => caller.team.list() },
  { method: "post", path: "/team/invite", tag: "Team", summary: "Body: {email,name,role: cashier|inventory_manager}.", roles: "tenant_admin", handler: ({ caller, b }) => caller.team.invite(b) },
  { method: "get", path: "/activity", tag: "Team", summary: "Audit log. ?page&pageSize&entity.", roles: "tenant_admin", handler: ({ caller, q }) => caller.activity.list({ page: num(q.page) ?? 1, pageSize: num(q.pageSize) ?? 20, entity: str(q.entity) }) },

  // Shifts
  { method: "get", path: "/shifts", tag: "Shifts", summary: "Recent shifts.", roles: "any member", handler: ({ caller }) => caller.shifts.list() },
  { method: "get", path: "/shifts/current", tag: "Shifts", summary: "Open shift with expected cash, or null.", roles: "any member", handler: ({ caller }) => caller.shifts.current() },
  { method: "post", path: "/shifts/open", tag: "Shifts", summary: "Body: {openingCash}.", roles: "tenant_admin, cashier", handler: ({ caller, b }) => caller.shifts.open(b) },
  { method: "post", path: "/shifts/close", tag: "Shifts", summary: "Body: {countedCash,notes?}. Returns expected/counted/variance.", roles: "tenant_admin, cashier", handler: ({ caller, b }) => caller.shifts.close(b) },

  // Search
  { method: "get", path: "/search", tag: "Search", summary: "?q= (2-60 chars). Products, customers, sales.", roles: "any member", handler: ({ caller, q }) => caller.search.global({ q: String(q.q ?? "") }) },

  // Platform admin
  { method: "get", path: "/admin/stats", tag: "Platform admin", summary: "Platform totals.", roles: "platform admin", handler: ({ caller }) => caller.admin.platformStats() },
  { method: "get", path: "/admin/tenants", tag: "Platform admin", summary: "All tenants.", roles: "platform admin", handler: ({ caller }) => caller.admin.tenants() },
  { method: "put", path: "/admin/tenants/:id/status", tag: "Platform admin", summary: "Body: {status: active|suspended|inactive}.", roles: "platform admin", handler: (c) => c.caller.admin.setTenantStatus({ tenantId: id(c), status: c.b?.status }) },
];

// ---- express wiring --------------------------------------------------------
function sendError(res: Response, err: unknown) {
  if (err instanceof TRPCError) {
    let message = err.message;
    // Zod validation failures arrive as a JSON string; surface them as readable text + details.
    let details: unknown;
    if (err.code === "BAD_REQUEST") {
      try { details = JSON.parse(err.message); message = "Invalid request"; } catch { /* plain message */ }
    }
    return res.status(getHTTPStatusCodeFromError(err)).json({ error: { code: err.code, message, ...(details ? { details } : {}) } });
  }
  console.error("[REST API]", err);
  return res.status(500).json({ error: { code: "INTERNAL_SERVER_ERROR", message: "Unexpected server error." } });
}

export function registerRestApi(app: Express) {
  const api = Router();

  api.get("/health", (_req, res) => res.json({ data: { status: "ok", version: "v1", time: new Date().toISOString() } }));

  for (const route of routes) {
    api[route.method](route.path, async (req: Request, res: Response) => {
      try {
        const ctx = await createContext({ req, res } as any);
        const caller = appRouter.createCaller(ctx);
        const result = await route.handler({ caller, req, res, q: req.query as Record<string, unknown>, b: req.body ?? {}, p: req.params as Record<string, string> });
        if (res.headersSent) return; // binary PDF already streamed
        res.json({ data: result ?? null });
      } catch (err) {
        sendError(res, err);
      }
    });
  }

  api.get("/openapi.json", (req, res) => res.json(buildOpenApi(`${req.protocol}://${req.get("host")}/api/v1`)));
  api.use((_req, res) => res.status(404).json({ error: { code: "NOT_FOUND", message: "Unknown API endpoint." } }));
  api.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => sendError(res, err));

  app.use("/api/v1", api);
}

export function buildOpenApi(serverUrl = "/api/v1") {
  const paths: Record<string, any> = {};
  for (const r of routes) {
    const p = r.path.replace(/:(\w+)/g, "{$1}");
    paths[p] ??= {};
    paths[p][r.method] = {
      tags: [r.tag],
      summary: r.summary,
      description: `Allowed roles: ${r.roles}`,
      security: r.public ? [] : [{ bearerAuth: [] }],
      parameters: [...(r.path.match(/:(\w+)/g) ?? []).map(m => ({ name: m.slice(1), in: "path", required: true, schema: { type: "integer" } }))],
      responses: { "200": { description: "OK — { data }" }, "4XX": { description: "{ error: { code, message } }" } },
    };
  }
  return {
    openapi: "3.0.3",
    info: { title: "OmniPOS REST API", version: "1.0.0", description: "Same data and rules as the OmniPOS portal. Auth with POST /auth/login then `Authorization: Bearer <token>`." },
    servers: [{ url: serverUrl }],
    components: { securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } } },
    paths,
  };
}
