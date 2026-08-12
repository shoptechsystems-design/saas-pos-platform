import { and, asc, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  auditLogs,
  categories,
  customers,
  expenses,
  inventoryMovements,
  products,
  purchases,
  saleItems,
  sales,
  suppliers,
  tenantMemberships,
  tenants,
  users,
  type InsertUser,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= new Date();
  updateSet.lastSignedIn ??= new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export type ProductRow = typeof products.$inferSelect;
export type TenantRole = "tenant_admin" | "cashier" | "inventory_manager";

export async function getMembershipForUser(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({ membership: tenantMemberships, tenant: tenants })
    .from(tenantMemberships)
    .innerJoin(tenants, eq(tenants.id, tenantMemberships.tenantId))
    .where(and(eq(tenantMemberships.userId, userId), eq(tenantMemberships.status, "active")))
    .orderBy(asc(tenantMemberships.id))
    .limit(1);
  return result[0];
}

export async function getTenantById(tenantId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  return result[0];
}

export async function getProductsForTenant(tenantId: number, query?: string, categoryId?: number) {
  const db = await getDb();
  if (!db) return [];
  const predicates = [eq(products.tenantId, tenantId), eq(products.status, "active")];
  if (categoryId) predicates.push(eq(products.categoryId, categoryId));
  if (query) {
    const search = `%${query}%`;
    predicates.push(or(like(products.name, search), like(products.sku, search), like(products.barcode, search))!);
  }
  return db.select().from(products).where(and(...predicates)).orderBy(asc(products.name));
}

export async function getCategoriesForTenant(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).where(eq(categories.tenantId, tenantId)).orderBy(asc(categories.name));
}

export async function getCustomersForTenant(tenantId: number, query?: string) {
  const db = await getDb();
  if (!db) return [];
  const predicate = query
    ? and(eq(customers.tenantId, tenantId), or(like(customers.name, `%${query}%`), like(customers.email, `%${query}%`), like(customers.phone, `%${query}%`)))
    : eq(customers.tenantId, tenantId);
  return db.select().from(customers).where(predicate).orderBy(desc(customers.totalSpent));
}

export async function getLowStockProducts(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(and(eq(products.tenantId, tenantId), eq(products.status, "active"), sql`${products.stockQuantity} <= ${products.minStockLevel}`)).orderBy(asc(products.stockQuantity));
}

export async function getRecentSales(tenantId: number, limit = 8) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ sale: sales, customer: customers })
    .from(sales)
    .leftJoin(customers, eq(customers.id, sales.customerId))
    .where(eq(sales.tenantId, tenantId))
    .orderBy(desc(sales.createdAt))
    .limit(limit);
}

export async function getSalesForTenant(tenantId: number, from?: Date, to?: Date) {
  const db = await getDb();
  if (!db) return [];
  const predicates = [eq(sales.tenantId, tenantId)];
  if (from) predicates.push(gte(sales.createdAt, from));
  if (to) predicates.push(lte(sales.createdAt, to));
  return db.select({ sale: sales, customer: customers })
    .from(sales)
    .leftJoin(customers, eq(customers.id, sales.customerId))
    .where(and(...predicates))
    .orderBy(desc(sales.createdAt));
}

export async function getTenantStats(tenantId: number) {
  const db = await getDb();
  if (!db) return { todaySales: "0", todayOrders: 0, monthSales: "0", products: 0, lowStock: 0, customers: 0 };
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [today, month, productCount, lowStock, customerCount] = await Promise.all([
    db.select({ total: sql<string>`COALESCE(SUM(${sales.total}), 0)`, orders: sql<number>`COUNT(*)` }).from(sales).where(and(eq(sales.tenantId, tenantId), eq(sales.status, "completed"), gte(sales.createdAt, todayStart))),
    db.select({ total: sql<string>`COALESCE(SUM(${sales.total}), 0)` }).from(sales).where(and(eq(sales.tenantId, tenantId), eq(sales.status, "completed"), gte(sales.createdAt, monthStart))),
    db.select({ count: sql<number>`COUNT(*)` }).from(products).where(and(eq(products.tenantId, tenantId), eq(products.status, "active"))),
    db.select({ count: sql<number>`COUNT(*)` }).from(products).where(and(eq(products.tenantId, tenantId), eq(products.status, "active"), sql`${products.stockQuantity} <= ${products.minStockLevel}`)),
    db.select({ count: sql<number>`COUNT(*)` }).from(customers).where(eq(customers.tenantId, tenantId)),
  ]);
  return {
    todaySales: today[0]?.total ?? "0",
    todayOrders: Number(today[0]?.orders ?? 0),
    monthSales: month[0]?.total ?? "0",
    products: Number(productCount[0]?.count ?? 0),
    lowStock: Number(lowStock[0]?.count ?? 0),
    customers: Number(customerCount[0]?.count ?? 0),
  };
}

export async function writeAuditLog(input: { tenantId?: number; userId: number; action: string; entity: string; entityId?: number; metadata?: Record<string, unknown> }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values({
    tenantId: input.tenantId,
    userId: input.userId,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId,
    metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
  });
}

export const dbTables = { categories, customers, expenses, inventoryMovements, products, purchases, saleItems, sales, suppliers, tenantMemberships, tenants, users, auditLogs };
