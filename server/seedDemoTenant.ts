/**
 * Fill an existing workspace with realistic PKR demo data.
 *
 *   pnpm seed:demo <owner-email> [--force]
 *
 * Creates categories, products, customers, suppliers, ~60 days of sales (with
 * line items) and expenses. Skips a workspace that already has products
 * unless --force is passed (which only ADDS data; it never deletes anything).
 */
import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { getDb } from "./db";
import { auditLogs, categories, customerLedger, customers, expenses, inventoryMovements, products, purchaseItems, purchases, registerShifts, saleItems, sales, suppliers, tenantMemberships, users } from "../drizzle/schema";
import { sql } from "drizzle-orm";

// Deterministic PRNG so repeated runs look the same.
let seed = 20260101;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const money = (n: number) => n.toFixed(2);

const CATEGORIES = [
  ["Coffee & Espresso", "#8B5CF6"], ["Tea & Chai", "#10B981"], ["Bakery", "#EC4899"], ["Sandwiches & Wraps", "#F59E0B"],
  ["Cold Drinks", "#3B82F6"], ["Desserts", "#A855F7"], ["Snacks", "#F97316"], ["Whole Beans & Retail", "#14B8A6"],
] as const;

// [name, sku, category, cost, price, stock, popularity weight]
const PRODUCTS: [string, string, number, number, number, number, number][] = [
  ["Signature Latte", "COF-LAT", 0, 220, 550, 180, 10], ["Double Espresso", "COF-ESP", 0, 150, 380, 220, 6],
  ["Cappuccino", "COF-CAP", 0, 200, 520, 160, 8], ["Cold Brew", "COF-CLD", 0, 240, 620, 90, 6],
  ["Caramel Macchiato", "COF-MAC", 0, 260, 650, 120, 5], ["Karak Chai", "TEA-KAR", 1, 60, 220, 300, 12],
  ["Kashmiri Chai", "TEA-KSH", 1, 110, 350, 140, 5], ["Green Tea", "TEA-GRN", 1, 70, 250, 160, 3],
  ["Butter Croissant", "BAK-CRO", 2, 120, 320, 60, 9], ["Chocolate Danish", "BAK-DAN", 2, 140, 380, 40, 6],
  ["Blueberry Muffin", "BAK-MUF", 2, 110, 300, 4, 5], ["Sourdough Loaf", "BAK-SOU", 2, 280, 650, 22, 2],
  ["Grilled Chicken Panini", "SND-PAN", 3, 330, 780, 35, 7], ["Club Sandwich", "SND-CLB", 3, 300, 720, 3, 6],
  ["Chicken Tikka Wrap", "SND-TIK", 3, 260, 650, 45, 7], ["Veggie Pesto Wrap", "SND-VEG", 3, 220, 580, 28, 3],
  ["Mint Margarita", "CLD-MNT", 4, 90, 320, 200, 8], ["Mango Smoothie", "CLD-MNG", 4, 180, 480, 75, 6],
  ["Iced Lemon Tea", "CLD-LEM", 4, 80, 290, 6, 5], ["Fresh Orange Juice", "CLD-ORG", 4, 160, 420, 50, 4],
  ["Chocolate Brownie", "DES-BRN", 5, 130, 350, 55, 7], ["Cheesecake Slice", "DES-CHS", 5, 240, 580, 18, 5],
  ["Tiramisu Cup", "DES-TIR", 5, 220, 540, 2, 3], ["Sea Salt Chips", "SNK-CHP", 6, 60, 160, 150, 4],
  ["Protein Bar", "SNK-PRO", 6, 140, 340, 100, 3], ["Mixed Nuts 200g", "SNK-NUT", 6, 380, 850, 40, 2],
  ["House Blend Beans 250g", "RET-HSB", 7, 750, 1650, 48, 2], ["Single Origin Beans 250g", "RET-SGO", 7, 950, 2100, 30, 1],
  ["Ceramic Mug", "RET-MUG", 7, 420, 990, 35, 1], ["Travel Tumbler", "RET-TMB", 7, 800, 1890, 7, 1],
];

const CUSTOMERS: [string, string, string][] = [
  ["Ayesha Khan", "ayesha.khan@example.com", "+92 300 1234501"], ["Hamza Ali", "hamza.ali@example.com", "+92 301 2345602"],
  ["Fatima Noor", "fatima.noor@example.com", "+92 302 3456703"], ["Bilal Ahmed", "bilal.ahmed@example.com", "+92 303 4567804"],
  ["Sara Malik", "sara.malik@example.com", "+92 304 5678905"], ["Usman Tariq", "usman.tariq@example.com", "+92 305 6789006"],
  ["Zainab Sheikh", "zainab.sheikh@example.com", "+92 306 7890107"], ["Ali Raza", "ali.raza@example.com", "+92 307 8901208"],
  ["Maryam Iqbal", "maryam.iqbal@example.com", "+92 308 9012309"], ["Omar Farooq", "omar.farooq@example.com", "+92 309 0123410"],
  ["Hira Aslam", "hira.aslam@example.com", "+92 310 1234511"], ["Daniyal Chaudhry", "daniyal.c@example.com", "+92 311 2345612"],
];

const SUPPLIERS: [string, string, string, string][] = [
  ["Karachi Roasters Co.", "orders@karachiroasters.example", "+92 21 3555 0101", "Coffee beans, weekly delivery"],
  ["Lahore Fresh Bakery", "sales@lahorefresh.example", "+92 42 3555 0102", "Daily bread and pastries"],
  ["Al-Madina Dairy", "dairy@almadina.example", "+92 51 3555 0103", "Milk, cream, yogurt"],
  ["PackRight Supplies", "hello@packright.example", "+92 21 3555 0104", "Cups, lids, packaging"],
];

const EXPENSES: [string, number, number, string][] = [
  ["Rent", 185000, 0, "Monthly shop rent"], ["Salaries", 240000, 0, "Staff payroll"], ["Utilities", 38000, 0, "Electricity and gas"],
  ["Internet & Phone", 6500, 0, "Fiber + landline"], ["Supplies", 24000, 1, "Cups, napkins, cleaning"], ["Marketing", 15000, 1, "Social media ads"],
  ["Maintenance", 9500, 2, "Espresso machine service"],
];


async function seedMovements(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, tenantId: number, userId: number) {
  const have = await db.select({ id: inventoryMovements.id }).from(inventoryMovements).where(eq(inventoryMovements.tenantId, tenantId)).limit(1);
  if (have.length) return 0;
  const prods = await db.select({ id: products.id }).from(products).where(eq(products.tenantId, tenantId));
  const rows: (typeof inventoryMovements.$inferInsert)[] = [];
  // Daily sales per product, taken from real sale lines.
  const sold = await db.select({ productId: saleItems.productId, day: sql<string>`DATE(${sales.createdAt})`, qty: sql<string>`SUM(${saleItems.quantity})` })
    .from(saleItems).innerJoin(sales, sql`${sales.id} = ${saleItems.saleId}`)
    .where(eq(saleItems.tenantId, tenantId)).groupBy(saleItems.productId, sql`DATE(${sales.createdAt})`);
  for (const r of sold) rows.push({ tenantId, productId: r.productId, type: "sale", quantity: -Number(r.qty), reason: "POS sales", createdByUserId: userId, createdAt: new Date(`${r.day}T21:30:00`) });
  // Weekly restocks, occasional wastage / count adjustments.
  const now = new Date();
  for (const p of prods) {
    for (let w = 8; w >= 0; w--) {
      const when = new Date(now.getFullYear(), now.getMonth(), now.getDate() - w * 7 - int(0, 2), int(8, 11), int(0, 59));
      if (when > now) continue;
      rows.push({ tenantId, productId: p.id, type: "purchase", quantity: int(20, 80), reason: `Weekly restock · ${pick(SUPPLIERS)[0]}`, createdByUserId: userId, createdAt: when });
    }
    if (rand() < 0.5) rows.push({ tenantId, productId: p.id, type: "adjustment", quantity: -int(1, 4), reason: pick(["Damaged in handling", "Expired stock written off", "Stock count correction"]), createdByUserId: userId, createdAt: new Date(now.getTime() - int(1, 40) * 86400000) });
  }
  for (let i = 0; i < rows.length; i += 500) await db.insert(inventoryMovements).values(rows.slice(i, i + 500));
  return rows.length;
}

async function seedExtras(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, tenantId: number, userId: number) {
  let added = 0;
  const hasPO = await db.select({ id: purchases.id }).from(purchases).where(eq(purchases.tenantId, tenantId)).limit(1);
  if (!hasPO.length) {
    const prods = await db.select().from(products).where(eq(products.tenantId, tenantId)).limit(30);
    const sups = await db.select().from(suppliers).where(eq(suppliers.tenantId, tenantId));
    const statuses = ["received", "received", "received", "ordered", "ordered", "cancelled"] as const;
    for (let i = 0; i < statuses.length; i++) {
      const lines = Array.from({ length: int(2, 4) }, () => { const p = pick(prods); return { p, qty: int(20, 60) }; });
      const total = lines.reduce((n, l) => n + l.qty * Number(l.p.costPrice), 0);
      const when = new Date(Date.now() - (statuses.length - i) * 6 * 86400000);
      const r = await db.insert(purchases).values({ tenantId, supplierId: sups.length ? pick(sups).id : null, purchaseNumber: `PO-${(1000 + i).toString(36).toUpperCase()}`, status: statuses[i], total: money(total), notes: i % 2 ? "Weekly top-up" : null, createdByUserId: userId, createdAt: when }).$returningId();
      await db.insert(purchaseItems).values(lines.map(l => ({ tenantId, purchaseId: r[0].id, productId: l.p.id, quantity: l.qty, unitCost: l.p.costPrice, lineTotal: money(l.qty * Number(l.p.costPrice)) })));
      added++;
    }
  }
  const hasShift = await db.select({ id: registerShifts.id }).from(registerShifts).where(eq(registerShifts.tenantId, tenantId)).limit(3);
  if (hasShift.length < 3) {
    for (let d = 6; d >= 1; d--) {
      const day = new Date(); day.setDate(day.getDate() - d);
      const open = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 9, 0), close = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 22, int(0, 30));
      const expected = 10000 + int(60000, 140000), variance = pick([0, 0, 0, -200, 150, -500]);
      await db.insert(registerShifts).values({ tenantId, status: "closed", openedByUserId: userId, closedByUserId: userId, openingCash: "10000.00", expectedCash: money(expected), countedCash: money(expected + variance), variance: money(variance), notes: variance ? "Minor till difference" : null, openedAt: open, closedAt: close });
      added++;
    }
  }
  const hasAudit = await db.select({ id: auditLogs.id }).from(auditLogs).where(eq(auditLogs.tenantId, tenantId)).limit(5);
  if (hasAudit.length < 5) {
    const recent = await db.select().from(sales).where(eq(sales.tenantId, tenantId)).orderBy(sql`${sales.createdAt} DESC`).limit(40);
    for (const sl of recent) { await db.insert(auditLogs).values({ tenantId, userId, action: "completed", entity: "sale", entityId: sl.id, metadata: JSON.stringify({ saleNumber: sl.saleNumber, total: sl.total }), createdAt: sl.createdAt }); added++; }
  }
  return added;
}

/** Demo udhaar: turn some past sales into credit, add repayments, leave a few balances overdue. */
async function seedCredit(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, tenantId: number, userId: number) {
  const have = await db.select({ id: customerLedger.id }).from(customerLedger).where(eq(customerLedger.tenantId, tenantId)).limit(1);
  if (have.length) return 0;
  const custs = await db.select().from(customers).where(eq(customers.tenantId, tenantId)).orderBy(customers.id).limit(7);
  // [credit sales, share of the debt repaid, days ago of the newest credit sale, credit limit]
  const profiles: [number, number, number, number | null][] = [[4, 0.5, 3, 50000], [3, 0.0, 41, 30000], [5, 0.8, 2, null], [3, 0.0, 55, 20000], [2, 1.0, 6, null], [4, 0.3, 9, 40000], [2, 0.0, 1, null]];
  let added = 0;
  for (let i = 0; i < custs.length; i++) {
    const [count, repaidShare, newestDaysAgo, limit] = profiles[i];
    const cutoff = new Date(Date.now() - (newestDaysAgo + count * 7) * 86400000);
    const upper = new Date(Date.now() - newestDaysAgo * 86400000);
    const rows = (await db.select().from(sales).where(eq(sales.customerId, custs[i].id)).orderBy(sales.createdAt))
      .filter(r => r.tenantId === tenantId && r.status === "completed" && r.createdAt >= cutoff && r.createdAt <= upper && r.paymentMethod !== "credit");
    const picked = rows.filter((_, k) => k % Math.max(1, Math.floor(rows.length / count)) === 0).slice(0, count);
    if (!picked.length) continue;
    type Ev = { at: Date; kind: "credit" | "pay"; amount: number; saleId?: number; note?: string };
    const events: Ev[] = [];
    for (let k = 0; k < picked.length; k++) {
      const sale = picked[k];
      const total = Number(sale.total), credit = k % 2 === 0 ? total : Math.round(total * 0.6);
      await db.update(sales).set({ paymentMethod: "credit", amountReceived: money(total - credit), changeAmount: "0", creditAmount: money(credit) }).where(eq(sales.id, sale.id));
      events.push({ at: sale.createdAt, kind: "credit", amount: credit, saleId: sale.id, note: credit < total ? `Part payment ${money(total - credit)} received now` : undefined });
    }
    const owedTotal = events.reduce((n, e) => n + e.amount, 0);
    if (repaidShare > 0) {
      const last = events[events.length - 1].at;
      const pay = repaidShare >= 1 ? owedTotal : Math.round(owedTotal * repaidShare);
      events.push({ at: new Date(Math.min(Date.now() - 3600000, last.getTime() + 2 * 86400000)), kind: "pay", amount: pay, note: repaidShare >= 1 ? "Cleared in full" : "Part payment" });
    }
    events.sort((a, b) => a.at.getTime() - b.at.getTime());
    let balance = 0;
    for (const e of events) {
      balance += e.kind === "credit" ? e.amount : -e.amount;
      await db.insert(customerLedger).values({ tenantId, customerId: custs[i].id, type: e.kind === "credit" ? "credit_sale" : "payment", amount: money(e.kind === "credit" ? e.amount : -e.amount), balanceAfter: money(balance), saleId: e.saleId, method: e.kind === "pay" ? pick(["cash", "cash", "transfer"]) : null, note: e.note ?? null, createdByUserId: userId, createdAt: e.at });
      added++;
    }
    await db.update(customers).set({ balance: money(Math.max(0, balance)), creditLimit: limit === null ? null : money(limit) }).where(eq(customers.id, custs[i].id));
  }
  return added;
}

async function main() {
  const email = process.argv[2];
  const force = process.argv.includes("--force");
  if (!email || email.startsWith("--")) {
    console.error("Usage: pnpm seed:demo <owner-email> [--force]");
    process.exit(1);
  }
  const db = await getDb();
  if (!db) throw new Error("Database unavailable. Check DATABASE_URL in .env");

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) throw new Error(`No user with email ${email}. Register in the app first.`);
  const [membership] = await db.select().from(tenantMemberships).where(and(eq(tenantMemberships.userId, user.id), eq(tenantMemberships.status, "active"))).limit(1);
  if (!membership) throw new Error(`${email} has no active workspace.`);
  const tenantId = membership.tenantId;

  const existing = await db.select({ id: products.id }).from(products).where(eq(products.tenantId, tenantId)).limit(1);
  if (existing.length && !force) {
    const added = (await seedMovements(db, tenantId, user.id)) + (await seedExtras(db, tenantId, user.id)) + (await seedCredit(db, tenantId, user.id));
    console.log(added
      ? `Workspace ${tenantId} already had products; added ${added} demo records (movements, purchase orders, shifts, activity, udhaar).`
      : `Workspace ${tenantId} already has products. Re-run with --force to add demo data anyway.`);
    process.exit(0);
  }

  // Categories
  const catIds: number[] = [];
  for (const [name, color] of CATEGORIES) {
    const found = await db.select().from(categories).where(and(eq(categories.tenantId, tenantId), eq(categories.name, name))).limit(1);
    if (found[0]) { catIds.push(found[0].id); continue; }
    const r = await db.insert(categories).values({ tenantId, name, color }).$returningId();
    catIds.push(r[0].id);
  }

  // Products
  const prods: { id: number; name: string; sku: string; price: number; weight: number }[] = [];
  for (const [name, sku, cat, cost, price, stock, weight] of PRODUCTS) {
    const found = await db.select().from(products).where(and(eq(products.tenantId, tenantId), eq(products.sku, sku))).limit(1);
    if (found[0]) { prods.push({ id: found[0].id, name, sku, price, weight }); continue; }
    const r = await db.insert(products).values({
      tenantId, categoryId: catIds[cat], name, sku, barcode: `8901${String(prods.length + 1).padStart(8, "0")}`,
      costPrice: money(cost), sellingPrice: money(price), stockQuantity: stock, minStockLevel: 10, unit: "each", status: "active",
    }).$returningId();
    prods.push({ id: r[0].id, name, sku, price, weight });
  }

  // Customers
  const custs: { id: number; spent: number; last: Date | null }[] = [];
  for (const [name, mail, phone] of CUSTOMERS) {
    const r = await db.insert(customers).values({ tenantId, name, email: mail, phone }).$returningId();
    custs.push({ id: r[0].id, spent: 0, last: null });
  }

  // Suppliers
  for (const [name, mail, phone, notes] of SUPPLIERS) {
    await db.insert(suppliers).values({ tenantId, name, email: mail, phone, notes }).catch(() => {});
  }

  // Sales: 60 days, weekend bump, gentle growth, today up to the current hour.
  const now = new Date();
  const pool = prods.flatMap(p => Array(p.weight).fill(p));
  const payments = ["cash", "cash", "card", "card", "card", "transfer"];
  let saleSeq = 1000 + (await db.select({ id: sales.id }).from(sales).where(eq(sales.tenantId, tenantId))).length;
  const stamp = String(now.getFullYear());

  for (let d = 59; d >= 0; d--) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d);
    const dow = day.getDay(); // 0 Sun
    const growth = 1 + (59 - d) / 120;
    const base = dow === 5 || dow === 6 ? 30 : dow === 0 ? 24 : 20;
    let orders = Math.round(base * growth * (0.8 + rand() * 0.4));
    const lastHour = d === 0 ? Math.max(now.getHours(), 9) : 22;
    if (d === 0) orders = Math.max(6, Math.round(orders * ((lastHour - 8) / 14)));

    for (let i = 0; i < orders; i++) {
      const hour = Math.min(lastHour, pick([9, 10, 11, 12, 13, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21]));
      const when = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, int(0, 59), int(0, 59));
      if (when > now) when.setTime(now.getTime() - int(1, 90) * 60000);

      const lines = new Map<number, { p: (typeof prods)[number]; qty: number }>();
      for (let k = int(1, 4); k > 0; k--) {
        const p = pick(pool) as (typeof prods)[number];
        const cur = lines.get(p.id);
        if (cur) cur.qty += 1; else lines.set(p.id, { p, qty: int(1, 2) });
      }
      const subtotal = Array.from(lines.values()).reduce((s, l) => s + l.p.price * l.qty, 0);
      const tax = Math.round(subtotal * 0.18 * 100) / 100;
      const total = subtotal + tax;
      const method = pick(payments);
      const received = method === "cash" ? Math.ceil(total / 100) * 100 : total;
      const cust = rand() < 0.45 ? pick(custs) : null;

      const r = await db.insert(sales).values({
        tenantId, customerId: cust?.id, saleNumber: `SALE-${stamp}-${++saleSeq}`, status: "completed",
        subtotal: money(subtotal), discount: "0", tax: money(tax), total: money(total), paymentMethod: method,
        amountReceived: money(received), changeAmount: money(received - total), createdByUserId: user.id, createdAt: when,
      }).$returningId();
      await db.insert(saleItems).values(Array.from(lines.values()).map(l => ({
        tenantId, saleId: r[0].id, productId: l.p.id, productName: l.p.name, sku: l.p.sku,
        quantity: l.qty, unitPrice: money(l.p.price), lineTotal: money(l.p.price * l.qty),
      })));
      if (cust) { cust.spent += total; if (!cust.last || when > cust.last) cust.last = when; }
    }
  }

  for (const c of custs) {
    await db.update(customers).set({ totalSpent: money(c.spent), lastPurchaseAt: c.last ?? undefined }).where(eq(customers.id, c.id));
  }

  // Expenses: last 3 months (monthly items) + a few ad-hoc
  for (let m = 2; m >= 0; m--) {
    for (const [category, amount, , notes] of EXPENSES) {
      const date = new Date(now.getFullYear(), now.getMonth() - m, int(1, 25));
      if (date > now) continue;
      await db.insert(expenses).values({ tenantId, category, amount: money(amount * (0.95 + rand() * 0.1)), notes, expenseDate: date, createdByUserId: user.id });
    }
  }

  const moves = (await seedMovements(db, tenantId, user.id)) + (await seedExtras(db, tenantId, user.id)) + (await seedCredit(db, tenantId, user.id));
  console.log(`Seeded workspace ${tenantId} for ${email}: ${prods.length} products, ${custs.length} customers, ${saleSeq - 1000} sales, ${moves} inventory movements.`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
