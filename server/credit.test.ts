import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { auditLogs, customerLedger, customers, inventoryMovements, products, registerShifts, saleItems, sales, tenantMemberships, tenants, users } from "../drizzle/schema";

/**
 * Udhaar (customer credit), tested against the real database with throwaway tenants.
 * Skipped automatically when DATABASE_URL is not configured.
 */
const RUN = !!process.env.DATABASE_URL;
const tag = `c${Date.now().toString(36)}`;

describe.skipIf(!RUN)("udhaar: credit sales, repayments, limits, refunds", () => {
  const ids = { tenantA: 0, tenantB: 0, admin: 0, cashier: 0, outsider: 0, product: 0, ali: 0, sara: 0, bCustomer: 0 };
  const caller = (userId: number) => appRouter.createCaller({ req: {} as any, res: { cookie() {} } as any, user: { id: userId, role: "user" } as any });
  const admin = () => caller(ids.admin);
  const cashier = () => caller(ids.cashier);
  const row = async (customerId: number) => (await (await getDb())!.select().from(customers).where(eq(customers.id, customerId)))[0];
  let n = 0;
  const req = () => `${tag}-req-${++n}`;
  const sell = (customerId: number | null | undefined, paymentMethod: "cash" | "credit", amountReceived: number, qty = 2) =>
    cashier().pos.checkout({ items: [{ productId: ids.product, quantity: qty }], paymentMethod, amountReceived, customerId, clientRequestId: req() });

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
    ids.product = (await db.insert(products).values({ tenantId: ids.tenantA, name: "Rice 1kg", sku: `${tag}-R`, costPrice: "50", sellingPrice: "100", stockQuantity: 500, minStockLevel: 2, status: "active" }).$returningId())[0].id;
    ids.ali = (await db.insert(customers).values({ tenantId: ids.tenantA, name: "Ali (udhaar)" }).$returningId())[0].id;
    ids.sara = (await db.insert(customers).values({ tenantId: ids.tenantA, name: "Sara" }).$returningId())[0].id;
    ids.bCustomer = (await db.insert(customers).values({ tenantId: ids.tenantB, name: "Other shop customer" }).$returningId())[0].id;
  });

  afterAll(async () => {
    const db = (await getDb())!;
    const tIds = [ids.tenantA, ids.tenantB];
    const saleRows = await db.select({ id: sales.id }).from(sales).where(inArray(sales.tenantId, tIds));
    if (saleRows.length) await db.delete(saleItems).where(inArray(saleItems.saleId, saleRows.map(s => s.id)));
    for (const t of [customerLedger, sales, registerShifts, inventoryMovements, auditLogs, products, customers, tenantMemberships]) await db.delete(t as any).where(inArray((t as any).tenantId, tIds));
    await db.delete(tenants).where(inArray(tenants.id, tIds));
    await db.delete(users).where(inArray(users.id, [ids.admin, ids.cashier, ids.outsider]));
  });

  it("puts a whole sale on credit and records it in the ledger", async () => {
    const r = await sell(ids.ali, "credit", 0); // 2 × 100 + 10% tax = 220
    expect(r.total).toBe("220.00"); expect(r.creditAmount).toBe("220.00"); expect(r.balance).toBe("220.00"); expect(r.change).toBe("0.00");
    expect(Number((await row(ids.ali)).balance)).toBe(220);
    const led = await cashier().credit.ledger({ customerId: ids.ali });
    expect(led.rows[0].entry).toMatchObject({ type: "credit_sale", amount: "220.00", balanceAfter: "220.00" });
    expect(led.rows[0].saleNumber).toBeTruthy();
  });

  it("splits a part-payment: paid now + the rest on credit", async () => {
    const r = await sell(ids.ali, "credit", 100); // 220 total, 100 paid now
    expect(r.creditAmount).toBe("120.00"); expect(r.balance).toBe("340.00");
    const sale = (await (await getDb())!.select().from(sales).where(eq(sales.id, r.saleId)))[0];
    expect(sale).toMatchObject({ paymentMethod: "credit", amountReceived: "100.00", creditAmount: "120.00" });
  });

  it("rejects credit without a customer, with nothing left on credit, or for another business's customer", async () => {
    await expect(sell(null, "credit", 0)).rejects.toThrow(/choose a customer/i);
    await expect(sell(ids.ali, "credit", 220)).rejects.toThrow(/nothing is left on credit/i);
    await expect(sell(ids.bCustomer, "credit", 0)).rejects.toThrow(/customer not found/i);
    await expect(sell(ids.bCustomer, "cash", 300)).rejects.toThrow(/customer not found/i);
  });

  it("is safe to retry: the same request id never adds credit twice", async () => {
    const before = Number((await row(ids.sara)).balance);
    const reqId = req();
    const input = { items: [{ productId: ids.product, quantity: 1 }], paymentMethod: "credit" as const, amountReceived: 0, customerId: ids.sara, clientRequestId: reqId };
    const a = await cashier().pos.checkout(input);
    const b = await cashier().pos.checkout(input);
    expect(b.saleId).toBe(a.saleId); expect(b.replayed).toBe(true);
    expect(Number((await row(ids.sara)).balance)).toBe(before + 110);
  });

  it("enforces the credit limit, and only admins can set it", async () => {
    await expect(cashier().credit.setLimit({ customerId: ids.sara, creditLimit: 150 })).rejects.toThrow(/permission/i);
    await admin().credit.setLimit({ customerId: ids.sara, creditLimit: 150 }); // owes 110 already
    await expect(sell(ids.sara, "credit", 0)).rejects.toThrow(/credit limit exceeded/i); // +220 would be 330
    const ok = await sell(ids.sara, "credit", 190, 2); // 220 total, 190 now → only 30 more on credit: 140 <= 150
    expect(ok.balance).toBe("140.00");
    await admin().credit.setLimit({ customerId: ids.sara, creditLimit: null }); // remove limit
    await expect(sell(ids.sara, "credit", 0)).resolves.toBeTruthy();
  });

  it("records repayments, refuses overpayment, and keeps the ledger equal to the balance", async () => {
    const owed = Number((await row(ids.ali)).balance); // 340
    await expect(cashier().credit.receive({ customerId: ids.ali, amount: owed + 1, method: "cash" })).rejects.toThrow(/more than/i);
    await expect(cashier().credit.receive({ customerId: ids.ali, amount: 0, method: "cash" })).rejects.toThrow();
    const r = await cashier().credit.receive({ customerId: ids.ali, amount: 140, method: "cash", note: "weekly" });
    expect(r.balance).toBe("200.00");
    const ledger = await (await getDb())!.select().from(customerLedger).where(and(eq(customerLedger.tenantId, ids.tenantA), eq(customerLedger.customerId, ids.ali)));
    const sum = ledger.reduce((t, e) => t + Number(e.amount), 0);
    expect(sum).toBeCloseTo(Number((await row(ids.ali)).balance), 2);
  });

  it("other businesses cannot see or touch this customer's account", async () => {
    await expect(caller(ids.outsider).credit.ledger({ customerId: ids.ali })).rejects.toThrow(/not found/i);
    await expect(caller(ids.outsider).credit.receive({ customerId: ids.ali, amount: 10, method: "cash" })).rejects.toThrow(/not found/i);
    await expect(caller(ids.outsider).credit.setLimit({ customerId: ids.ali, creditLimit: 1 })).rejects.toThrow(/not found/i);
  });

  it("summarises what is owed, to whom, and how old", async () => {
    const sum = await cashier().credit.summary();
    expect(sum.debtors).toBeGreaterThanOrEqual(2);
    expect(sum.outstanding).toBeGreaterThan(0);
    expect(sum.top[0].balance).toBeGreaterThanOrEqual(sum.top[sum.top.length - 1].balance); // largest first
    const ali = sum.top.find(t => t.id === ids.ali)!;
    expect(ali.balance).toBe(200); expect(ali.ageDays).toBe(0); expect(ali.overdue).toBe(false);
    expect((await cashier().dashboard.stats()).outstandingCredit).toBeDefined();
  });

  it("counts only cash actually taken in the drawer (not credit given)", async () => {
    // Timestamps have one-second precision: let earlier sales fall in a previous second so they are not counted in this shift.
    await new Promise(r => setTimeout(r, 1100));
    await cashier().shifts.open({ openingCash: 1000 });
    await sell(ids.ali, "cash", 220);                                  // +220 cash
    await sell(ids.ali, "credit", 0);                                  // +0 (all credit)
    await sell(ids.ali, "credit", 50);                                 // +50 (cash part only)
    await cashier().credit.receive({ customerId: ids.ali, amount: 60, method: "cash" });   // +60 repayment
    await cashier().credit.receive({ customerId: ids.ali, amount: 40, method: "transfer" }); // not cash
    const cur = await cashier().shifts.current();
    expect(cur?.cashSales).toBe(270); expect(cur?.repayments).toBe(60); expect(cur?.expectedCash).toBe(1330);
    const closed = await cashier().shifts.close({ countedCash: 1330 });
    expect(closed).toMatchObject({ expected: 1330, variance: 0 });
  });

  it("splits the payment mix into cash and credit", async () => {
    const mix = await cashier().dashboard.paymentMix({ days: 30 });
    const credit = mix.find(m => m.method === "credit")!;
    const cash = mix.find(m => m.method === "cash")!;
    expect(credit.total).toBeGreaterThan(0); expect(cash.total).toBeGreaterThan(0);
    expect(mix.some(m => m.method === "credit" && m.orders === 0)).toBe(false);
  });

  it("refunding a credit sale clears that debt and logs it", async () => {
    const before = Number((await row(ids.sara)).balance);
    const r = await sell(ids.sara, "credit", 0);        // +220
    expect(Number((await row(ids.sara)).balance)).toBe(before + 220);
    await admin().salesHistory.refund({ id: r.saleId, reason: "Customer returned the goods" });
    expect(Number((await row(ids.sara)).balance)).toBe(before);
    const led = await cashier().credit.ledger({ customerId: ids.sara });
    expect(led.rows[0].entry.type).toBe("refund");
  });

  it("reports credit given, repayments received and what is outstanding", async () => {
    const range = { from: Date.now() - 86400000, to: Date.now() + 86400000 };
    const rep = await admin().reports.overview(range);
    expect(rep.creditGiven).toBeGreaterThan(0);
    expect(rep.paymentsReceived).toBeGreaterThan(0);
    expect(rep.outstanding).toBeGreaterThan(0);
    const list = await cashier().customers.list();
    const ali = list.find(c => c.id === ids.ali)!;
    expect(Number(ali.balance)).toBeGreaterThanOrEqual(0);
  });
});
