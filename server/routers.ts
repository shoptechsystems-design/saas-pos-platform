import { COOKIE_NAME } from "@shared/const";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import type { User } from "../drizzle/schema";
import { and, asc, desc, eq, gte, like, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import {
  adminProcedure,
  cashierProcedure,
  inventoryProcedure,
  protectedProcedure,
  publicProcedure,
  router,
  tenantAdminProcedure,
  tenantProcedure,
} from "./_core/trpc";
import {
  auditLogs,
  categories,
  customers,
  expenses,
  inventoryMovements,
  products,
  productVariants,
  purchases,
  purchaseItems,
  saleItems,
  sales,
  suppliers,
  tenantMemberships,
  tenants,
  users,
} from "../drizzle/schema";
import {
  getCategoriesForTenant,
  getCustomersForTenant,
  getDb,
  getLowStockProducts,
  getProductsForTenant,
  getRecentSales,
  getSalesForTenant,
  getTenantStats,
  getMembershipForUser,
  writeAuditLog,
  createLocalOpenId,
  getUserByEmail,
  hashPassword,
  verifyPassword,
} from "./db";
import { storagePut } from "./storage";
import { systemRouter } from "./_core/systemRouter";

const money = z.coerce.number().finite().nonnegative();
const tenantName = z.string().trim().min(2).max(160);

function toCents(value: string | number | null | undefined) {
  return Math.round(Number(value ?? 0) * 100);
}

function formatMoney(cents: number) {
  return (cents / 100).toFixed(2);
}

export function toSafeUser(user: User | null | undefined) {
  if (!user) return null;
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => toSafeUser(opts.ctx.user as User | null | undefined)),
    register: publicProcedure
      .input(z.object({
        name: z.string().trim().min(2).max(120),
        businessName: z.string().trim().min(2).max(160),
        email: z.string().trim().email().max(320),
        password: z.string().min(8).max(128),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        const email = input.email.toLowerCase();
        let existingUser;
        try {
          existingUser = await getUserByEmail(email);
        } catch {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The workspace database is temporarily unavailable. Please retry in a moment." });
        }
        if (existingUser) {
          throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists." });
        }
        const openId = createLocalOpenId();
        const userResult = await db.insert(users).values({
          openId,
          name: input.name,
          email,
          loginMethod: "local",
          passwordHash: hashPassword(input.password),
          role: "user",
        }).$returningId();
        const userId = userResult[0]?.id;
        if (!userId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not create account." });
        const slug = `${input.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${nanoid(6).toLowerCase()}`;
        const tenantResult = await db.insert(tenants).values({
          name: input.businessName,
          slug,
          businessType: "Retail",
          currency: "PKR",
          taxRate: "18.000",
          receiptFooter: "Thank you for shopping with us.",
          status: "active",
          ownerUserId: userId,
        }).$returningId();
        const tenantId = tenantResult[0]?.id;
        if (!tenantId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not create business workspace." });
        await db.insert(tenantMemberships).values({ tenantId, userId, role: "tenant_admin", status: "active" });
        const createdUser = await getUserByEmail(email);
        const token = await sdk.createSessionToken(openId, { name: input.name });
        ctx.res.cookie(COOKIE_NAME, token, getSessionCookieOptions(ctx.req));
        return { success: true, user: toSafeUser(createdUser), tenantId } as const;
      }),
    login: publicProcedure
      .input(z.object({ email: z.string().trim().email().max(320), password: z.string().min(1).max(128) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        let user;
        try {
          user = await getUserByEmail(input.email.toLowerCase());
        } catch {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The workspace database is temporarily unavailable. Please retry in a moment." });
        }
        if (!user || !verifyPassword(input.password, user.passwordHash)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Email or password is incorrect." });
        }
        await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
        const token = await sdk.createSessionToken(user.openId, { name: user.name ?? input.email });
        ctx.res.cookie(COOKIE_NAME, token, getSessionCookieOptions(ctx.req));
        return { success: true, user: toSafeUser(user), } as const;
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  tenant: router({
    context: tenantProcedure.query(({ ctx }) => ({ tenant: ctx.tenant, membership: ctx.membership })),
    settings: tenantProcedure.query(({ ctx }) => ({
      name: ctx.tenant.name,
      businessType: ctx.tenant.businessType,
      logoUrl: ctx.tenant.logoUrl,
      currency: ctx.tenant.currency,
      taxRate: Number(ctx.tenant.taxRate),
      receiptFooter: ctx.tenant.receiptFooter,
    })),
    uploadLogo: tenantAdminProcedure
      .input(z.object({ filename: z.string(), base64Data: z.string(), contentType: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const matches = input.base64Data.match(/^data:(.+);base64,(.+)$/);
        const rawBase64 = matches ? matches[2] : input.base64Data;
        const buffer = Buffer.from(rawBase64, "base64");
        if (buffer.length > 5 * 1024 * 1024) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Logo image must be under 5MB." });
        }
        const safeName = input.filename.replace(/[^a-zA-Z0-9.-]/g, "_");
        const stored = await storagePut(`tenants/${ctx.tenant.id}/logo_${safeName}`, buffer, input.contentType);
        const db = await getDb();
        if (db) {
          await db.update(tenants).set({ logoUrl: stored.url }).where(eq(tenants.id, ctx.tenant.id));
        }
        return { url: stored.url };
      }),
    updateSettings: tenantAdminProcedure
      .input(z.object({ name: tenantName, businessType: z.string().trim().min(2).max(80), currency: z.string().trim().min(3).max(8), taxRate: z.number().min(0).max(100), logoUrl: z.string().nullable().optional(), receiptFooter: z.string().max(500).nullable().optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        await db.update(tenants).set({ ...input, taxRate: input.taxRate.toFixed(3) }).where(eq(tenants.id, ctx.tenant.id));
        await writeAuditLog({ tenantId: ctx.tenant.id, userId: ctx.user.id, action: "updated", entity: "tenant_settings", metadata: input });
        return { success: true } as const;
      }),
  }),

  dashboard: router({
    stats: tenantProcedure.query(({ ctx }) => getTenantStats(ctx.tenant.id)),
    lowStock: tenantProcedure.query(({ ctx }) => getLowStockProducts(ctx.tenant.id)),
    recentSales: tenantProcedure.query(({ ctx }) => getRecentSales(ctx.tenant.id)),
    salesTrend: tenantProcedure
      .input(z.object({ days: z.number().int().min(7).max(90).default(14) }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return [];
        const from = new Date();
        from.setDate(from.getDate() - input.days + 1);
        const rows = await db.select({ day: sql<string>`DATE(${sales.createdAt})`, total: sql<string>`COALESCE(SUM(${sales.total}), 0)`, orders: sql<number>`COUNT(*)` })
          .from(sales)
          .where(and(eq(sales.tenantId, ctx.tenant.id), eq(sales.status, "completed"), gte(sales.createdAt, from)))
          .groupBy(sql`DATE(${sales.createdAt})`)
          .orderBy(asc(sql`DATE(${sales.createdAt})`));
        return rows.map(row => ({ day: String(row.day), total: Number(row.total), orders: Number(row.orders) }));
      }),
  }),

  catalog: router({
    categories: tenantProcedure.query(({ ctx }) => getCategoriesForTenant(ctx.tenant.id)),
    createCategory: tenantAdminProcedure
      .input(z.object({ name: z.string().trim().min(2).max(120), color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#5B6CFF") }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        await db.insert(categories).values({ tenantId: ctx.tenant.id, ...input });
        return { success: true } as const;
      }),
    updateCategory: tenantAdminProcedure
      .input(z.object({ id: z.number().int().positive(), name: z.string().trim().min(2).max(120), color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#5B6CFF") }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        await db.update(categories).set({ name: input.name, color: input.color }).where(and(eq(categories.id, input.id), eq(categories.tenantId, ctx.tenant.id)));
        return { success: true } as const;
      }),
    deleteCategory: tenantAdminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        await db.delete(categories).where(and(eq(categories.id, input.id), eq(categories.tenantId, ctx.tenant.id)));
        return { success: true } as const;
      }),
    products: tenantProcedure
      .input(z.object({ query: z.string().trim().optional(), categoryId: z.number().int().positive().optional() }).optional())
      .query(({ ctx, input }) => getProductsForTenant(ctx.tenant.id, input?.query, input?.categoryId)),
    createProduct: inventoryProcedure
      .input(z.object({ name: z.string().trim().min(1).max(180), sku: z.string().trim().min(1).max(80), barcode: z.string().trim().max(80).nullable().optional(), categoryId: z.number().int().positive().nullable().optional(), costPrice: money, sellingPrice: money, discountPrice: money.nullable().optional(), taxRate: z.number().min(0).max(100).nullable().optional(), stockQuantity: z.number().int().min(0), minStockLevel: z.number().int().min(0), unit: z.string().trim().min(1).max(32).default("each"), imageUrl: z.string().url().nullable().optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        await db.insert(products).values({ ...input, tenantId: ctx.tenant.id, costPrice: input.costPrice.toFixed(2), sellingPrice: input.sellingPrice.toFixed(2), discountPrice: input.discountPrice?.toFixed(2), taxRate: input.taxRate?.toFixed(3) });
        await writeAuditLog({ tenantId: ctx.tenant.id, userId: ctx.user.id, action: "created", entity: "product", metadata: { sku: input.sku } });
        return { success: true } as const;
      }),
    deleteProduct: inventoryProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        await db.delete(products).where(and(eq(products.id, input.id), eq(products.tenantId, ctx.tenant.id)));
        await writeAuditLog({ tenantId: ctx.tenant.id, userId: ctx.user.id, action: "deleted", entity: "product", metadata: { productId: input.id } });
        return { success: true } as const;
      }),
    uploadProductImage: inventoryProcedure
      .input(z.object({ filename: z.string(), base64Data: z.string(), contentType: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const matches = input.base64Data.match(/^data:(.+);base64,(.+)$/);
        const rawBase64 = matches ? matches[2] : input.base64Data;
        const buffer = Buffer.from(rawBase64, "base64");
        if (buffer.length > 5 * 1024 * 1024) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Product image must be under 5MB." });
        }
        const safeName = input.filename.replace(/[^a-zA-Z0-9.-]/g, "_");
        const stored = await storagePut(`tenants/${ctx.tenant.id}/products/prod_${safeName}`, buffer, input.contentType);
        return { url: stored.url };
      }),
    updateProduct: inventoryProcedure
      .input(z.object({ id: z.number().int().positive(), name: z.string().trim().min(1).max(180), sku: z.string().trim().min(1).max(80), categoryId: z.number().int().positive().nullable().optional(), sellingPrice: money, stockQuantity: z.number().int().min(0), imageUrl: z.string().url().nullable().optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        await db.update(products).set({ name: input.name, sku: input.sku, categoryId: input.categoryId, sellingPrice: input.sellingPrice.toFixed(2), stockQuantity: input.stockQuantity, imageUrl: input.imageUrl }).where(and(eq(products.id, input.id), eq(products.tenantId, ctx.tenant.id)));
        await writeAuditLog({ tenantId: ctx.tenant.id, userId: ctx.user.id, action: "updated", entity: "product", metadata: { productId: input.id, sku: input.sku } });
        return { success: true } as const;
      }),
  }),

  customers: router({
    list: tenantProcedure.input(z.object({ query: z.string().trim().optional() }).optional()).query(({ ctx, input }) => getCustomersForTenant(ctx.tenant.id, input?.query)),
    create: cashierProcedure
      .input(z.object({ name: z.string().trim().min(2).max(160), email: z.string().email().nullable().optional(), phone: z.string().trim().max(40).nullable().optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        await db.insert(customers).values({ tenantId: ctx.tenant.id, ...input });
        return { success: true } as const;
      }),
  }),

  pos: router({
    checkout: cashierProcedure
      .input(z.object({ items: z.array(z.object({ productId: z.number().int().positive(), quantity: z.number().int().positive().max(999) })).min(1), discount: money.default(0), paymentMethod: z.enum(["cash", "card", "transfer", "other"]), amountReceived: money, customerId: z.number().int().positive().nullable().optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        return db.transaction(async tx => {
          const ids = input.items.map(item => item.productId);
          const productRows = await tx.select().from(products).where(and(eq(products.tenantId, ctx.tenant.id), eq(products.status, "active"), sql`${products.id} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`));
          const productMap = new Map(productRows.map(product => [product.id, product]));
          const lines = input.items.map(item => {
            const product = productMap.get(item.productId);
            if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "One or more products are unavailable." });
            if (product.stockQuantity < item.quantity) throw new TRPCError({ code: "BAD_REQUEST", message: `${product.name} only has ${product.stockQuantity} in stock.` });
            const unitPrice = toCents(product.discountPrice ?? product.sellingPrice);
            return { product, quantity: item.quantity, unitPrice, lineTotal: unitPrice * item.quantity };
          });
          const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotal, 0);
          const discountCents = Math.min(toCents(input.discount), subtotalCents);
          const taxableCents = subtotalCents - discountCents;
          const taxCents = Math.round(taxableCents * (Number(ctx.tenant.taxRate) / 100));
          const totalCents = taxableCents + taxCents;
          const receivedCents = toCents(input.amountReceived);
          if (input.paymentMethod === "cash" && receivedCents < totalCents) throw new TRPCError({ code: "BAD_REQUEST", message: "Amount received is less than the total." });
          const changeCents = Math.max(0, receivedCents - totalCents);
          const saleNumber = `SALE-${Date.now().toString(36).toUpperCase()}`;
          const saleIds = await tx.insert(sales).values({ tenantId: ctx.tenant.id, customerId: input.customerId, saleNumber, status: "completed", subtotal: formatMoney(subtotalCents), discount: formatMoney(discountCents), tax: formatMoney(taxCents), total: formatMoney(totalCents), paymentMethod: input.paymentMethod, amountReceived: formatMoney(receivedCents), changeAmount: formatMoney(changeCents), createdByUserId: ctx.user.id }).$returningId();
          const saleId = saleIds[0]?.id;
          if (!saleId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not create sale." });
          await tx.insert(saleItems).values(lines.map(line => ({ tenantId: ctx.tenant.id, saleId, productId: line.product.id, productName: line.product.name, sku: line.product.sku, quantity: line.quantity, unitPrice: formatMoney(line.unitPrice), lineTotal: formatMoney(line.lineTotal) })));
          for (const line of lines) {
            await tx.update(products).set({ stockQuantity: sql`${products.stockQuantity} - ${line.quantity}` }).where(and(eq(products.id, line.product.id), eq(products.tenantId, ctx.tenant.id)));
            await tx.insert(inventoryMovements).values({ tenantId: ctx.tenant.id, productId: line.product.id, type: "sale", quantity: -line.quantity, reason: `Sale ${saleNumber}`, referenceId: saleId, createdByUserId: ctx.user.id });
          }
          if (input.customerId) {
            await tx.update(customers).set({ loyaltyPoints: sql`${customers.loyaltyPoints} + ${Math.floor(totalCents / 100)}`, totalSpent: sql`${customers.totalSpent} + ${formatMoney(totalCents)}`, lastPurchaseAt: new Date() }).where(and(eq(customers.id, input.customerId), eq(customers.tenantId, ctx.tenant.id)));
          }
          await tx.insert(auditLogs).values({ tenantId: ctx.tenant.id, userId: ctx.user.id, action: "completed", entity: "sale", entityId: saleId, metadata: JSON.stringify({ saleNumber, total: formatMoney(totalCents) }) });
          return { saleId, saleNumber, subtotal: formatMoney(subtotalCents), discount: formatMoney(discountCents), tax: formatMoney(taxCents), total: formatMoney(totalCents), change: formatMoney(changeCents), footer: ctx.tenant.receiptFooter };
        });
      }),
    history: tenantProcedure.input(z.object({ query: z.string().trim().optional() }).optional()).query(async ({ ctx, input }) => {
      const rows = await getSalesForTenant(ctx.tenant.id);
      if (!input?.query) return rows;
      const normalized = input.query.toLowerCase();
      return rows.filter(row => row.sale.saleNumber.toLowerCase().includes(normalized) || row.customer?.name?.toLowerCase().includes(normalized));
    }),
  }),

  inventory: router({
    lowStock: tenantProcedure.query(({ ctx }) => getLowStockProducts(ctx.tenant.id)),
    adjust: inventoryProcedure
      .input(z.object({ productId: z.number().int().positive(), quantity: z.number().int(), reason: z.string().trim().min(2).max(220) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        const product = await db.select().from(products).where(and(eq(products.id, input.productId), eq(products.tenantId, ctx.tenant.id))).limit(1);
        if (!product[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found." });
        const nextQuantity = product[0].stockQuantity + input.quantity;
        if (nextQuantity < 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Stock cannot go below zero." });
        await db.update(products).set({ stockQuantity: nextQuantity }).where(and(eq(products.id, input.productId), eq(products.tenantId, ctx.tenant.id)));
        await db.insert(inventoryMovements).values({ tenantId: ctx.tenant.id, productId: input.productId, type: "adjustment", quantity: input.quantity, reason: input.reason, createdByUserId: ctx.user.id });
        return { success: true, stockQuantity: nextQuantity } as const;
      }),
    movements: inventoryProcedure.input(z.object({ productId: z.number().int().positive().optional() }).optional()).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const predicates = [eq(inventoryMovements.tenantId, ctx.tenant.id)];
      if (input?.productId) predicates.push(eq(inventoryMovements.productId, input.productId));
      return db.select().from(inventoryMovements).where(and(...predicates)).orderBy(desc(inventoryMovements.createdAt)).limit(100);
    }),
    variants: tenantProcedure.input(z.object({ productId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(productVariants).where(and(eq(productVariants.tenantId, ctx.tenant.id), eq(productVariants.productId, input.productId)));
    }),
    createVariant: inventoryProcedure
      .input(z.object({ productId: z.number().int().positive(), name: z.string().trim().min(1).max(120), sku: z.string().trim().min(1).max(80), additionalPrice: money.default(0), stockQuantity: z.number().int().min(0).default(0) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        await db.insert(productVariants).values({ tenantId: ctx.tenant.id, productId: input.productId, name: input.name, sku: input.sku, additionalPrice: input.additionalPrice.toFixed(2), stockQuantity: input.stockQuantity });
        return { success: true } as const;
      }),
    deleteVariant: inventoryProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        await db.delete(productVariants).where(and(eq(productVariants.id, input.id), eq(productVariants.tenantId, ctx.tenant.id)));
        return { success: true } as const;
      }),
  }),

  suppliers: router({
    list: tenantProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(suppliers).where(eq(suppliers.tenantId, ctx.tenant.id)).orderBy(asc(suppliers.name));
    }),
    create: inventoryProcedure.input(z.object({ name: z.string().trim().min(2).max(160), email: z.string().email().nullable().optional(), phone: z.string().trim().max(40).nullable().optional(), notes: z.string().max(500).nullable().optional() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await db.insert(suppliers).values({ tenantId: ctx.tenant.id, ...input });
      return { success: true } as const;
    }),
  }),

  purchases: router({
    list: inventoryProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select({ purchase: purchases, supplier: suppliers }).from(purchases).leftJoin(suppliers, eq(suppliers.id, purchases.supplierId)).where(eq(purchases.tenantId, ctx.tenant.id)).orderBy(desc(purchases.createdAt));
    }),
    create: inventoryProcedure.input(z.object({ supplierId: z.number().int().positive().nullable().optional(), notes: z.string().max(500).nullable().optional(), items: z.array(z.object({ productId: z.number().int().positive(), quantity: z.number().int().positive(), unitCost: money })).min(1) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      return db.transaction(async tx => {
        const purchaseNumber = `PO-${Date.now().toString(36).toUpperCase()}`;
        const totalCents = input.items.reduce((sum, item) => sum + toCents(item.unitCost) * item.quantity, 0);
        const purchaseIds = await tx.insert(purchases).values({ tenantId: ctx.tenant.id, supplierId: input.supplierId, purchaseNumber, status: "ordered", total: formatMoney(totalCents), notes: input.notes, createdByUserId: ctx.user.id }).$returningId();
        const purchaseId = purchaseIds[0]?.id;
        if (!purchaseId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not create purchase order." });
        await tx.insert(purchaseItems).values(input.items.map(item => ({ tenantId: ctx.tenant.id, purchaseId, productId: item.productId, quantity: item.quantity, unitCost: item.unitCost.toFixed(2), lineTotal: formatMoney(toCents(item.unitCost) * item.quantity) })));
        return { purchaseId, purchaseNumber, total: formatMoney(totalCents) };
      });
    }),
  }),

  expenses: router({
    list: tenantProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(expenses).where(eq(expenses.tenantId, ctx.tenant.id)).orderBy(desc(expenses.expenseDate)).limit(100);
    }),
    create: tenantAdminProcedure.input(z.object({ category: z.string().trim().min(2).max(100), amount: money, notes: z.string().max(500).nullable().optional(), expenseDate: z.date().optional() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await db.insert(expenses).values({ tenantId: ctx.tenant.id, category: input.category, amount: input.amount.toFixed(2), notes: input.notes, expenseDate: input.expenseDate, createdByUserId: ctx.user.id });
      return { success: true } as const;
    }),
  }),

  team: router({
    list: tenantAdminProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select({ membership: tenantMemberships, user: { id: users.id, name: users.name, email: users.email, role: users.role, loginMethod: users.loginMethod } }).from(tenantMemberships).innerJoin(users, eq(users.id, tenantMemberships.userId)).where(eq(tenantMemberships.tenantId, ctx.tenant.id)).orderBy(asc(users.name));
    }),
    invite: tenantAdminProcedure.input(z.object({ email: z.string().email(), name: z.string().trim().min(2).max(160), role: z.enum(["cashier", "inventory_manager"]) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const matching = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      const user = matching[0];
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "This user must sign in once before they can be added." });
      await db.insert(tenantMemberships).values({ tenantId: ctx.tenant.id, userId: user.id, role: input.role, status: "active" });
      return { success: true } as const;
    }),
  }),

  admin: router({
    platformStats: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { tenants: 0, activeTenants: 0, users: 0, revenue: "0" };
      const [tenantCount, activeCount, userCount, revenue] = await Promise.all([
        db.select({ count: sql<number>`COUNT(*)` }).from(tenants),
        db.select({ count: sql<number>`COUNT(*)` }).from(tenants).where(eq(tenants.status, "active")),
        db.select({ count: sql<number>`COUNT(*)` }).from(users),
        db.select({ total: sql<string>`COALESCE(SUM(${sales.total}), 0)` }).from(sales).where(eq(sales.status, "completed")),
      ]);
      return { tenants: Number(tenantCount[0]?.count ?? 0), activeTenants: Number(activeCount[0]?.count ?? 0), users: Number(userCount[0]?.count ?? 0), revenue: revenue[0]?.total ?? "0" };
    }),
    tenants: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select({ tenant: tenants, owner: { id: users.id, name: users.name, email: users.email, role: users.role, loginMethod: users.loginMethod } }).from(tenants).innerJoin(users, eq(users.id, tenants.ownerUserId)).orderBy(desc(tenants.createdAt));
    }),
    setTenantStatus: adminProcedure.input(z.object({ tenantId: z.number().int().positive(), status: z.enum(["active", "suspended", "inactive"]) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await db.update(tenants).set({ status: input.status }).where(eq(tenants.id, input.tenantId));
      await writeAuditLog({ userId: ctx.user.id, action: "status_changed", entity: "tenant", entityId: input.tenantId, metadata: { status: input.status } });
      return { success: true } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
