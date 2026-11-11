import express from "express";
import type { Server } from "http";
import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { getDb, hashPassword } from "./db";
import { auditLogs, customers, inventoryMovements, products, saleItems, sales, tenantMemberships, tenants, users } from "../drizzle/schema";
import { buildOpenApi, registerRestApi, routes } from "./restApi";

describe("REST API v1", () => {
  let server: Server;
  let base = "";
  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    registerRestApi(app);
    await new Promise<void>(r => { server = app.listen(0, r); });
    base = `http://127.0.0.1:${(server.address() as any).port}/api/v1`;
  });
  afterAll(() => new Promise<void>(r => server.close(() => r())));

  it("serves health", async () => {
    const res = await fetch(`${base}/health`);
    expect(res.status).toBe(200);
    expect((await res.json()).data.status).toBe("ok");
  });

  it("rejects unauthenticated tenant endpoints with 401 in the error envelope", async () => {
    for (const path of ["/products", "/customers", "/sales", "/dashboard/stats", "/shifts/current"]) {
      const res = await fetch(`${base}${path}`);
      expect(res.status, path).toBe(401);
      expect((await res.json()).error.code).toBe("UNAUTHORIZED");
    }
  });

  it("rejects checkout without a token", async () => {
    const res = await fetch(`${base}/pos/checkout`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    expect(res.status).toBe(401);
  });

  it("returns 404 envelope for unknown endpoints", async () => {
    const res = await fetch(`${base}/nope`);
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe("NOT_FOUND");
  });

  it("auth/me is public and returns null without a token", async () => {
    const res = await fetch(`${base}/auth/me`);
    expect(res.status).toBe(200);
    expect((await res.json()).data).toBeNull();
  });

  it("publishes an OpenAPI spec covering every route", async () => {
    const spec = await (await fetch(`${base}/openapi.json`)).json();
    expect(spec.openapi).toBe("3.0.3");
    expect(Object.values(spec.paths).flatMap((p: any) => Object.keys(p)).length).toBe(routes.length);
    expect(buildOpenApi().paths["/sales/{id}"].get.parameters[0].name).toBe("id");
  });
});

describe.skipIf(!process.env.DATABASE_URL)("REST API v1 authenticated flow", () => {
  const tag = `rest${Date.now().toString(36)}`;
  const ids = { admin: 0, cashier: 0, tenant: 0, product: 0 };
  let server: Server; let base = ""; let adminToken = ""; let cashierToken = "";
  const call = (path: string, token: string, init: RequestInit = {}) =>
    fetch(`${base}${path}`, { ...init, headers: { "content-type": "application/json", authorization: `Bearer ${token}`, ...(init.headers as any) } });

  beforeAll(async () => {
    const db = (await getDb())!;
    const mk = async (n: string) => (await db.insert(users).values({ openId: `local:${tag}-${n}`, name: n, email: `${tag}.${n}@test.local`, loginMethod: "local", role: "user", passwordHash: hashPassword("password123") }).$returningId())[0].id;
    ids.admin = await mk("admin"); ids.cashier = await mk("cashier");
    ids.tenant = (await db.insert(tenants).values({ name: `${tag}-t`, slug: `${tag}-t`, businessType: "Retail", currency: "PKR", taxRate: "10.000", status: "active", ownerUserId: ids.admin }).$returningId())[0].id;
    await db.insert(tenantMemberships).values([{ tenantId: ids.tenant, userId: ids.admin, role: "tenant_admin", status: "active" }, { tenantId: ids.tenant, userId: ids.cashier, role: "cashier", status: "active" }]);
    ids.product = (await db.insert(products).values({ tenantId: ids.tenant, name: "REST Widget", sku: `${tag}-W`, costPrice: "50", sellingPrice: "100", stockQuantity: 10, minStockLevel: 2, status: "active" }).$returningId())[0].id;
    const app = express(); app.use(express.json()); registerRestApi(app);
    await new Promise<void>(r => { server = app.listen(0, r); });
    base = `http://127.0.0.1:${(server.address() as any).port}/api/v1`;
    const login = async (n: string) => (await (await fetch(`${base}/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: `${tag}.${n}@test.local`, password: "password123" }) })).json()).data.token as string;
    adminToken = await login("admin"); cashierToken = await login("cashier");
  });

  afterAll(async () => {
    const db = (await getDb())!;
    const saleRows = await db.select({ id: sales.id }).from(sales).where(eq(sales.tenantId, ids.tenant));
    if (saleRows.length) await db.delete(saleItems).where(inArray(saleItems.saleId, saleRows.map(r => r.id)));
    for (const t of [sales, inventoryMovements, auditLogs, customers, products] as any[]) await db.delete(t).where(eq(t.tenantId, ids.tenant));
    await db.delete(tenantMemberships).where(eq(tenantMemberships.tenantId, ids.tenant));
    await db.delete(tenants).where(eq(tenants.id, ids.tenant));
    await db.delete(users).where(inArray(users.id, [ids.admin, ids.cashier]));
    await new Promise<void>(r => server.close(() => r()));
  });

  it("logs in with a Bearer token and resolves tenant context + me", async () => {
    expect(adminToken).toBeTruthy();
    expect((await (await call("/tenant/context", adminToken)).json()).data.membership.role).toBe("tenant_admin");
    expect((await (await call("/auth/me", adminToken)).json()).data.email).toContain(tag);
  });

  it("rejects a wrong password with 401", async () => {
    const res = await fetch(`${base}/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: `${tag}.admin@test.local`, password: "bad-password" }) });
    expect(res.status).toBe(401);
  });

  it("lists products with query-string filters", async () => {
    const rows = (await (await call("/products?query=REST", cashierToken)).json()).data;
    expect(rows.some((p: any) => p.id === ids.product)).toBe(true);
  });

  it("checks out idempotently and decrements stock once", async () => {
    const body = JSON.stringify({ items: [{ productId: ids.product, quantity: 2 }], paymentMethod: "cash", amountReceived: 500, clientRequestId: `${tag}-req-1` });
    const first = (await (await call("/pos/checkout", cashierToken, { method: "POST", body })).json()).data;
    const replay = (await (await call("/pos/checkout", cashierToken, { method: "POST", body })).json()).data;
    expect(first.replayed).toBe(false);
    expect(replay.replayed).toBe(true);
    expect(replay.saleId).toBe(first.saleId);
    expect(first.total).toBe("220.00");
    const [p] = (await (await call("/products?query=REST", cashierToken)).json()).data.filter((x: any) => x.id === ids.product);
    expect(p.stockQuantity).toBe(8);
    const detail = (await (await call(`/sales/${first.saleId}`, cashierToken)).json()).data;
    expect(detail.items).toHaveLength(1);
    const list = (await (await call("/sales?pageSize=5", cashierToken)).json()).data;
    expect(list.total).toBe(1);
  });

  it("enforces roles: cashier cannot refund or read reports, admin can refund", async () => {
    const list = (await (await call("/sales", adminToken)).json()).data;
    const saleId = list.rows[0].sale.id;
    const denied = await call(`/sales/${saleId}/refund`, cashierToken, { method: "POST", body: JSON.stringify({ reason: "mistake" }) });
    expect(denied.status).toBe(403);
    expect((await call(`/reports/overview?from=0&to=${Date.now()}`, cashierToken)).status).toBe(403);
    const ok = await call(`/sales/${saleId}/refund`, adminToken, { method: "POST", body: JSON.stringify({ reason: "mistake" }) });
    expect(ok.status).toBe(200);
  });

  it("returns validation errors as 400 and creates expenses with ISO dates", async () => {
    const bad = await call("/pos/checkout", cashierToken, { method: "POST", body: JSON.stringify({ items: [] }) });
    expect(bad.status).toBe(400);
    expect((await bad.json()).error.code).toBe("BAD_REQUEST");
    const exp = await call("/expenses", adminToken, { method: "POST", body: JSON.stringify({ category: "Rent", amount: 100, expenseDate: new Date().toISOString() }) });
    expect(exp.status).toBe(200);
  });

  it("streams a binary PDF for reconciliation with ?format=pdf", async () => {
    const res = await call("/reports/reconciliation?format=pdf", adminToken);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(Buffer.from(await res.arrayBuffer()).subarray(0, 4).toString()).toBe("%PDF");
  });
});
