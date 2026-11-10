import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { auditLogs, customers, inventoryMovements, products, purchaseItems, purchases, registerShifts, saleItems, sales, suppliers, tenantMemberships, tenants, users } from "../drizzle/schema";

/**
 * Integration tests against the real database, using throwaway tenants that are
 * removed afterwards. Skipped automatically when DATABASE_URL is not configured.
 */
const RUN = !!process.env.DATABASE_URL;
const tag = `t${Date.now().toString(36)}`;

describe.skipIf(!RUN)("operations: refunds, purchasing, shifts, isolation", () => {
  const ids = { tenantA: 0, tenantB: 0, admin: 0, cashier: 0, outsider: 0, product: 0, customer: 0 };
  const caller = (userId: number) => appRouter.createCaller({ req: {} as any, res: { cookie() {} } as any, user: { id: userId, role: "user" } as any });

  beforeAll(async () => {
    const db = (await getDb())!;
    const mkUser = async (name: string) => (await db.insert(users).values({ openId: `${tag}:${name}`, name, email: `${tag}.${name}@test.local`, loginMethod: "local", role: "user", passwordHash: "x" }).$returningId())[0].id;
    ids.admin = await mkUser("admin"); ids.cashier = await mkUser("cashier"); ids.outsider = await mkUser("outsider");
    const mkTenant = async (name: string, owner: number) => (await db.insert(tenants).values({ name: `${tag}-${name}`, slug: `${tag}-${name}`, businessType: "Retail", currency: "PKR", taxRate: "10.000", status: "active", ownerUserId: owner }).$returningId())[0].id;
    ids.tenantA = await mkTenant("a", ids.admin); ids.tenantB = await mkTenant("b", ids.outsider);
    await db.insert(tenantMemberships).values([
      { tenantId: ids.tenantA, userId: ids.admin, role: "tenant_admin", status: "active" },
      { tenantId: ids.tenantA, userId: ids.cashier, role: "cashier", status: "active" },
      { tenantId: ids.tenantB, userId: ids.outsider, role: "tenant_admin", status: "active" },
    ]);
    ids.product = (await db.insert(products).values({ tenantId: ids.tenantA, name: "Test Widget", sku: `${tag}-W`, costPrice: "50", sellingPrice: "100", stockQuantity: 10, minStockLevel: 2, status: "active" }).$returningId())[0].id;
    ids.customer = (await db.insert(customers).values({ tenantId: ids.tenantA, name: "Test Customer" }).$returningId())[0].id;
  });

  afterAll(async () => {
    const db = (await getDb())!;
    const tIds = [ids.tenantA, ids.tenantB];
    const saleRows = await db.select({ id: sales.id }).from(sales).where(inArray(sales.tenantId, tIds));
    if (saleRows.length) await db.delete(saleItems).where(inArray(saleItems.saleId, saleRows.map(s => s.id)));
    const poRows = await db.select({ id: purchases.id }).from(purchases).where(inArray(purchases.tenantId, tIds));
    if (poRows.length) await db.delete(purchaseItems).where(inArray(purchaseItems.purchaseId, poRows.map(s => s.id)));
    for (const t of [sales, purchases, registerShifts, inventoryMovements, auditLogs, products, customers, suppliers, tenantMemberships]) await db.delete(t as any).where(inArray((t as any).tenantId, tIds));
    await db.delete(tenants).where(inArray(tenants.id, tIds));
    await db.delete(users).where(inArray(users.id, [ids.admin, ids.cashier, ids.outsider]));
  });

  const stock = async () => (await (await getDb())!.select().from(products).where(eq(products.id, ids.product)))[0].stockQuantity;

  it("sells with a discount using the tenant tax rate, then refunds and restores stock", async () => {
    const sale = await caller(ids.cashier).pos.checkout({ items: [{ productId: ids.product, quantity: 3 }], discount: 50, paymentMethod: "cash", amountReceived: 500, customerId: ids.customer, clientRequestId: `${tag}-sale-1` });
    // subtotal 300 − 50 discount = 250, + 10% tax = 275
    expect(sale.subtotal).toBe("300.00"); expect(sale.discount).toBe("50.00"); expect(sale.tax).toBe("25.00"); expect(sale.total).toBe("275.00");
    expect(await stock()).toBe(7);

    // cashiers cannot refund
    await expect(caller(ids.cashier).salesHistory.refund({ id: sale.saleId, reason: "nope" })).rejects.toThrow(/permission/i);
    // another tenant cannot even see it
    await expect(caller(ids.outsider).salesHistory.detail({ id: sale.saleId })).rejects.toThrow(/not found/i);
    await expect(caller(ids.outsider).salesHistory.refund({ id: sale.saleId, reason: "steal" })).rejects.toThrow();

    await caller(ids.admin).salesHistory.refund({ id: sale.saleId, reason: "Customer changed mind" });
    expect(await stock()).toBe(10);
    const detail = await caller(ids.admin).salesHistory.detail({ id: sale.saleId });
    expect(detail.sale.status).toBe("refunded");
    const cust = (await (await getDb())!.select().from(customers).where(eq(customers.id, ids.customer)))[0];
    expect(Number(cust.totalSpent)).toBe(0);
    // double refund blocked
    await expect(caller(ids.admin).salesHistory.refund({ id: sale.saleId, reason: "again" })).rejects.toThrow(/completed/i);
  });

  it("checkout is idempotent for the same client request id", async () => {
    const a = await caller(ids.cashier).pos.checkout({ items: [{ productId: ids.product, quantity: 1 }], paymentMethod: "card", amountReceived: 110, clientRequestId: `${tag}-idem-xx` });
    const b = await caller(ids.cashier).pos.checkout({ items: [{ productId: ids.product, quantity: 1 }], paymentMethod: "card", amountReceived: 110, clientRequestId: `${tag}-idem-xx` });
    expect(b.saleId).toBe(a.saleId);
    expect(await stock()).toBe(9);
  });

  it("receives a purchase order into stock exactly once", async () => {
    const po = await caller(ids.admin).purchases.create({ items: [{ productId: ids.product, quantity: 20, unitCost: 60 }] });
    await caller(ids.admin).purchases.receive({ id: po.purchaseId });
    expect(await stock()).toBe(29);
    const p = (await (await getDb())!.select().from(products).where(eq(products.id, ids.product)))[0];
    expect(Number(p.costPrice)).toBe(60);
    await expect(caller(ids.admin).purchases.receive({ id: po.purchaseId })).rejects.toThrow(/already received/i);
    await expect(caller(ids.admin).purchases.cancel({ id: po.purchaseId })).rejects.toThrow();
  });

  it("reconciles a cash drawer shift and flags the variance", async () => {
    await caller(ids.cashier).shifts.open({ openingCash: 1000 });
    await expect(caller(ids.cashier).shifts.open({ openingCash: 5 })).rejects.toThrow(/already open/i);
    await caller(ids.cashier).pos.checkout({ items: [{ productId: ids.product, quantity: 2 }], paymentMethod: "cash", amountReceived: 300, clientRequestId: `${tag}-shift-1` }); // 200 + 20 tax = 220
    const cur = await caller(ids.cashier).shifts.current();
    expect(cur?.expectedCash).toBe(1220);
    const r = await caller(ids.cashier).shifts.close({ countedCash: 1200, notes: "short" });
    expect(r).toMatchObject({ expected: 1220, counted: 1200, variance: -20 });
    expect(await caller(ids.cashier).shifts.current()).toBeNull();
  });

  it("restricts reports and the activity log to tenant admins", async () => {
    const range = { from: Date.now() - 86400000, to: Date.now() + 86400000 };
    await expect(caller(ids.cashier).reports.overview(range)).rejects.toThrow(/permission/i);
    await expect(caller(ids.cashier).activity.list({ page: 1, pageSize: 10 })).rejects.toThrow(/permission/i);
    const rep = await caller(ids.admin).reports.overview(range);
    expect(rep.orders).toBeGreaterThan(0);
    expect(rep.refunds.count).toBe(1);
    const act = await caller(ids.admin).activity.list({ page: 1, pageSize: 20 });
    expect(act.rows.some(r => r.log.action === "refunded")).toBe(true);
  });
});
