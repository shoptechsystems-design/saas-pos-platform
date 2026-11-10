import { COOKIE_NAME } from "@shared/const";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { User } from "../drizzle/schema";
import { and, asc, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
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
  customerGroups,
  customers,
  expenses,
  inventoryMovements,
  products,
  productVariants,
  purchases,
  purchaseItems,
  registerShifts,
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
import { storagePut, storageGetSignedUrl } from "./storage";
import { systemRouter } from "./_core/systemRouter";


const salesFilterInput = z.object({
  search: z.string().trim().max(80).optional(),
  customerId: z.number().int().optional(),
  paymentMethod: z.enum(["cash", "card", "transfer"]).optional(),
  status: z.enum(["completed", "refunded", "all"]).default("completed"),
  from: z.number().optional(),
  to: z.number().optional(),
});

function buildSalesWhere(tenantId: number, input: z.infer<typeof salesFilterInput>) {
  const conds = [eq(sales.tenantId, tenantId)];
  if (input.status !== "all") conds.push(eq(sales.status, input.status));
  if (input.customerId) conds.push(eq(sales.customerId, input.customerId));
  if (input.paymentMethod) conds.push(eq(sales.paymentMethod, input.paymentMethod));
  if (input.from) conds.push(gte(sales.createdAt, new Date(input.from)));
  if (input.to) conds.push(lte(sales.createdAt, new Date(input.to)));
  if (input.search) conds.push(or(like(sales.saleNumber, `%${input.search}%`), like(customers.name, `%${input.search}%`))!);
  return and(...conds);
}

const money = z.coerce.number().finite().nonnegative();
const tenantName = z.string().trim().min(2).max(160);

function toCents(value: string | number | null | undefined) {
  return Math.round(Number(value ?? 0) * 100);
}

function formatMoney(cents: number) {
  return (cents / 100).toFixed(2);
}

export function createIdempotentSaleNumber(clientRequestId?: string) {
  return `SALE-${(clientRequestId ?? nanoid(12)).replace(/[^a-zA-Z0-9-]/g, "").slice(0, 40).toUpperCase()}`;
}

export async function buildBrandedPdf(input: {
  title: string;
  subtitle: string;
  tenant: { name: string; logoUrl?: string | null; receiptFooter?: string | null };
  rows: Array<{ label: string; value: string }>;
  totals: Array<{ label: string; value: string }>;
}) {
  const pdfText = (value: string) => value.replaceAll("₨", "Rs");
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(0.059, 0.09, 0.165);
  const teal = rgb(0.059, 0.463, 0.431);
  const slate = rgb(0.35, 0.39, 0.46);
  let logo: any = null;
  if (input.tenant.logoUrl?.startsWith("http")) {
    try {
      const response = await fetch(input.tenant.logoUrl);
      if (response.ok) {
        const bytes = Buffer.from(await response.arrayBuffer());
        const contentType = response.headers.get("content-type") ?? "";
        logo = contentType.includes("png") ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
      }
    } catch {
      logo = null;
    }
  }
  let page = pdf.addPage([595, 842]);
  const drawHeader = () => {
    page.drawRectangle({ x: 0, y: 780, width: 595, height: 62, color: navy });
    page.drawText(input.tenant.name.slice(0, 42), { x: 36, y: 811, size: 17, font: bold, color: rgb(1, 1, 1) });
    page.drawText(input.title, { x: 36, y: 790, size: 11, font: regular, color: rgb(0.82, 0.88, 0.92) });
    if (logo) page.drawImage(logo, { x: 520, y: 792, width: 34, height: 34 });
    page.drawText(input.subtitle.slice(0, 90), { x: 36, y: 756, size: 9, font: regular, color: slate });
  };
  drawHeader();
  let y = 716;
  for (const row of input.rows) {
    page.drawText(pdfText(row.label).slice(0, 58), { x: 36, y, size: 10, font: regular, color: slate });
    page.drawText(pdfText(row.value).slice(0, 54), { x: 315, y, size: 10, font: bold, color: navy });
    page.drawLine({ start: { x: 36, y: y - 8 }, end: { x: 559, y: y - 8 }, thickness: 0.5, color: rgb(0.88, 0.9, 0.93) });
    y -= 26;
    if (y < 170) {
      page = pdf.addPage([595, 842]);
      drawHeader();
      y = 716;
    }
  }
  y -= 8;
  page.drawRectangle({ x: 36, y: y - 12, width: 523, height: 26 + input.totals.length * 23, color: rgb(0.96, 0.98, 0.98) });
  y -= 2;
  for (const total of input.totals) {
    page.drawText(pdfText(total.label), { x: 54, y, size: 11, font: regular, color: slate });
    page.drawText(pdfText(total.value), { x: 390, y, size: 11, font: bold, color: total.label.toLowerCase().includes("net") ? teal : navy });
    y -= 23;
  }
  page.drawText(input.tenant.receiptFooter?.slice(0, 100) || "Generated by OmniPOS", { x: 36, y: 46, size: 9, font: regular, color: slate });
  page.drawText("PKR - OmniPOS", { x: 470, y: 46, size: 9, font: bold, color: teal });
  return Buffer.from(await pdf.save()).toString("base64");
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
        return { success: true, user: toSafeUser(user), token } as const;
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
        // Obtain a fully signed, directly loadable URL so the browser loads it without 404 proxy misses
        const signedUrl = await storageGetSignedUrl(stored.key).catch(() => stored.url);
        const db = await getDb();
        if (db) {
          await db.update(tenants).set({ logoUrl: signedUrl }).where(eq(tenants.id, ctx.tenant.id));
        }
        return { url: signedUrl };
      }),
    updateSettings: tenantAdminProcedure
      .input(z.object({ name: tenantName, businessType: z.string().trim().min(2).max(80), currency: z.string().trim().min(3).max(8), taxRate: z.number().min(0).max(100), logoUrl: z.string().nullable().optional().or(z.literal("")), receiptFooter: z.string().max(500).nullable().optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        const normalizedLogo = input.logoUrl && input.logoUrl.trim() !== "" ? input.logoUrl.trim() : null;
        await db.update(tenants).set({
          name: input.name,
          businessType: input.businessType,
          currency: input.currency,
          taxRate: input.taxRate.toFixed(3),
          logoUrl: normalizedLogo,
          receiptFooter: input.receiptFooter,
        }).where(eq(tenants.id, ctx.tenant.id));
        await writeAuditLog({ tenantId: ctx.tenant.id, userId: ctx.user.id, action: "updated", entity: "tenant_settings", metadata: { ...input, logoUrl: normalizedLogo } });
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
        from.setHours(0, 0, 0, 0); // include the whole first day, not just its trailing hours
        const rows = await db.select({ day: sql<string>`DATE(${sales.createdAt})`, total: sql<string>`COALESCE(SUM(${sales.total}), 0)`, orders: sql<number>`COUNT(*)` })
          .from(sales)
          .where(and(eq(sales.tenantId, ctx.tenant.id), eq(sales.status, "completed"), gte(sales.createdAt, from)))
          .groupBy(sql`DATE(${sales.createdAt})`)
          .orderBy(asc(sql`DATE(${sales.createdAt})`));
        return rows.map(row => ({ day: String(row.day), total: Number(row.total), orders: Number(row.orders) }));
      }),
    topProducts: tenantProcedure
      .input(z.object({ days: z.number().int().min(1).max(90).default(30) }).default({ days: 30 }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return [];
        const from = new Date();
        from.setDate(from.getDate() - input.days + 1);
        from.setHours(0, 0, 0, 0);
        const rows = await db.select({ productId: saleItems.productId, name: saleItems.productName, units: sql<string>`SUM(${saleItems.quantity})`, revenue: sql<string>`SUM(${saleItems.lineTotal})` })
          .from(saleItems)
          .innerJoin(sales, eq(sales.id, saleItems.saleId))
          .where(and(eq(saleItems.tenantId, ctx.tenant.id), eq(sales.tenantId, ctx.tenant.id), eq(sales.status, "completed"), gte(sales.createdAt, from)))
          .groupBy(saleItems.productId, saleItems.productName)
          .orderBy(desc(sql`SUM(${saleItems.lineTotal})`))
          .limit(5);
        return rows.map(r => ({ productId: r.productId, name: r.name, units: Number(r.units), revenue: Number(r.revenue) }));
      }),
    paymentMix: tenantProcedure
      .input(z.object({ days: z.number().int().min(1).max(90).default(30) }).default({ days: 30 }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return [];
        const from = new Date();
        from.setDate(from.getDate() - input.days + 1);
        from.setHours(0, 0, 0, 0);
        const rows = await db.select({ method: sales.paymentMethod, total: sql<string>`SUM(${sales.total})`, orders: sql<number>`COUNT(*)` })
          .from(sales)
          .where(and(eq(sales.tenantId, ctx.tenant.id), eq(sales.status, "completed"), gte(sales.createdAt, from)))
          .groupBy(sales.paymentMethod);
        return rows.map(r => ({ method: r.method, total: Number(r.total), orders: Number(r.orders) }));
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
      .input(z.object({ name: z.string().trim().min(1).max(180), sku: z.string().trim().max(80).optional(), barcode: z.string().trim().max(80).nullable().optional(), categoryId: z.number().int().positive().nullable().optional(), costPrice: money.optional(), sellingPrice: money, discountPrice: money.nullable().optional(), taxRate: z.number().min(0).max(100).nullable().optional(), stockQuantity: z.number().int().min(0), minStockLevel: z.number().int().min(0).optional(), unit: z.string().trim().min(1).max(32).default("each"), imageUrl: z.string().url().nullable().optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        const finalSku = input.sku && input.sku.trim().length > 0 ? input.sku.trim() : `SKU-${Math.floor(1000 + Math.random() * 9000)}`;
        await db.insert(products).values({
          ...input,
          sku: finalSku,
          tenantId: ctx.tenant.id,
          costPrice: (input.costPrice ?? 0).toFixed(2),
          sellingPrice: input.sellingPrice.toFixed(2),
          discountPrice: input.discountPrice?.toFixed(2),
          taxRate: input.taxRate?.toFixed(3),
          minStockLevel: input.minStockLevel ?? 5,
        });
        await writeAuditLog({ tenantId: ctx.tenant.id, userId: ctx.user.id, action: "created", entity: "product", metadata: { sku: finalSku } });
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
        const signedUrl = await storageGetSignedUrl(stored.key).catch(() => stored.url);
        return { url: signedUrl };
      }),
    updateProduct: inventoryProcedure
      .input(z.object({ id: z.number().int().positive(), name: z.string().trim().min(1).max(180), sku: z.string().trim().min(1).max(80), categoryId: z.number().int().positive().nullable().optional(), sellingPrice: money, stockQuantity: z.number().int().min(0), imageUrl: z.string().nullable().optional().or(z.literal("")) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        const normalizedImage = input.imageUrl && input.imageUrl.trim() !== "" ? input.imageUrl.trim() : null;
        await db.update(products).set({ name: input.name, sku: input.sku, categoryId: input.categoryId, sellingPrice: input.sellingPrice.toFixed(2), stockQuantity: input.stockQuantity, imageUrl: normalizedImage }).where(and(eq(products.id, input.id), eq(products.tenantId, ctx.tenant.id)));
        await writeAuditLog({ tenantId: ctx.tenant.id, userId: ctx.user.id, action: "updated", entity: "product", metadata: { productId: input.id, sku: input.sku } });
        return { success: true } as const;
      }),
  }),

  salesHistory: router({
    list: tenantProcedure
      .input(salesFilterInput.extend({ page: z.number().int().min(1).default(1), pageSize: z.number().int().min(5).max(100).default(15) }).default({ page: 1, pageSize: 15, status: "completed" }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return { rows: [], total: 0, revenue: 0, avgOrder: 0, refundedCount: 0 };
        const where = buildSalesWhere(ctx.tenant.id, input);
        const [agg] = await db.select({
            total: sql<number>`COUNT(*)`.mapWith(Number),
            revenue: sql<string>`COALESCE(SUM(CASE WHEN ${sales.status} = 'completed' THEN ${sales.total} ELSE 0 END), 0)`,
            completed: sql<number>`COALESCE(SUM(CASE WHEN ${sales.status} = 'completed' THEN 1 ELSE 0 END), 0)`.mapWith(Number),
            refunded: sql<number>`COALESCE(SUM(CASE WHEN ${sales.status} = 'refunded' THEN 1 ELSE 0 END), 0)`.mapWith(Number),
          }).from(sales).leftJoin(customers, eq(customers.id, sales.customerId)).where(where);
        const rows = await db.select({
            sale: sales,
            customer: { id: customers.id, name: customers.name },
            itemCount: sql<number>`(SELECT COALESCE(SUM(${saleItems.quantity}), 0) FROM ${saleItems} WHERE ${saleItems.saleId} = ${sales.id})`.mapWith(Number),
          })
          .from(sales).leftJoin(customers, eq(customers.id, sales.customerId)).where(where)
          .orderBy(desc(sales.createdAt)).limit(input.pageSize).offset((input.page - 1) * input.pageSize);
        const revenue = Number(agg?.revenue ?? 0);
        const completed = agg?.completed ?? 0;
        return { rows, total: agg?.total ?? 0, revenue, avgOrder: completed ? revenue / completed : 0, refundedCount: agg?.refunded ?? 0 };
      }),
    exportRows: tenantProcedure.input(salesFilterInput).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select({ saleNumber: sales.saleNumber, status: sales.status, createdAt: sales.createdAt, customer: customers.name, paymentMethod: sales.paymentMethod, subtotal: sales.subtotal, discount: sales.discount, tax: sales.tax, total: sales.total })
        .from(sales).leftJoin(customers, eq(customers.id, sales.customerId)).where(buildSalesWhere(ctx.tenant.id, input)).orderBy(desc(sales.createdAt)).limit(5000);
    }),
    detail: tenantProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [row] = await db.select({ sale: sales, customer: { id: customers.id, name: customers.name, phone: customers.phone, email: customers.email }, cashier: { name: users.name } })
        .from(sales).leftJoin(customers, eq(customers.id, sales.customerId)).leftJoin(users, eq(users.id, sales.createdByUserId))
        .where(and(eq(sales.id, input.id), eq(sales.tenantId, ctx.tenant.id))).limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Sale not found." });
      const items = await db.select().from(saleItems).where(and(eq(saleItems.saleId, input.id), eq(saleItems.tenantId, ctx.tenant.id)));
      return { ...row, items };
    }),
    refund: tenantAdminProcedure.input(z.object({ id: z.number().int().positive(), reason: z.string().trim().min(3).max(200) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      return db.transaction(async tx => {
        const [sale] = await tx.select().from(sales).where(and(eq(sales.id, input.id), eq(sales.tenantId, ctx.tenant.id))).limit(1);
        if (!sale) throw new TRPCError({ code: "NOT_FOUND", message: "Sale not found." });
        if (sale.status !== "completed") throw new TRPCError({ code: "BAD_REQUEST", message: "Only completed sales can be refunded." });
        const items = await tx.select().from(saleItems).where(and(eq(saleItems.saleId, sale.id), eq(saleItems.tenantId, ctx.tenant.id)));
        await tx.update(sales).set({ status: "refunded" }).where(eq(sales.id, sale.id));
        for (const item of items) {
          await tx.update(products).set({ stockQuantity: sql`${products.stockQuantity} + ${item.quantity}` }).where(and(eq(products.id, item.productId), eq(products.tenantId, ctx.tenant.id)));
          await tx.insert(inventoryMovements).values({ tenantId: ctx.tenant.id, productId: item.productId, type: "adjustment", quantity: item.quantity, reason: `Refund ${sale.saleNumber}`, referenceId: sale.id, createdByUserId: ctx.user.id });
        }
        if (sale.customerId) {
          await tx.update(customers).set({ totalSpent: sql`GREATEST(${customers.totalSpent} - ${sale.total}, 0)` }).where(and(eq(customers.id, sale.customerId), eq(customers.tenantId, ctx.tenant.id)));
        }
        await tx.insert(auditLogs).values({ tenantId: ctx.tenant.id, userId: ctx.user.id, action: "refunded", entity: "sale", entityId: sale.id, metadata: JSON.stringify({ saleNumber: sale.saleNumber, total: sale.total, reason: input.reason }) });
        return { success: true as const, saleNumber: sale.saleNumber, total: sale.total };
      });
    }),
  }),

  customerGroups: router({
    list: tenantProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(customerGroups).where(eq(customerGroups.tenantId, ctx.tenant.id)).orderBy(asc(customerGroups.name));
    }),
    create: tenantAdminProcedure
      .input(z.object({ name: z.string().trim().min(2).max(120), discountPercent: z.number().min(0).max(100).default(0) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        await db.insert(customerGroups).values({ tenantId: ctx.tenant.id, name: input.name, discountPercent: input.discountPercent.toFixed(2) });
        return { success: true } as const;
      }),
    delete: tenantAdminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        await db.delete(customerGroups).where(and(eq(customerGroups.id, input.id), eq(customerGroups.tenantId, ctx.tenant.id)));
        return { success: true } as const;
      }),
  }),

  customers: router({
    list: tenantProcedure.input(z.object({ query: z.string().trim().optional() }).optional()).query(({ ctx, input }) => getCustomersForTenant(ctx.tenant.id, input?.query)),
    create: cashierProcedure
      .input(z.object({ name: z.string().trim().min(2).max(160), email: z.string().trim().email().nullable().optional().or(z.literal("")), phone: z.string().trim().max(40).nullable().optional().or(z.literal("")), groupId: z.number().int().positive().nullable().optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        await db.insert(customers).values({
          tenantId: ctx.tenant.id,
          name: input.name,
          email: input.email && input.email.trim() !== "" ? input.email.trim() : null,
          phone: input.phone && input.phone.trim() !== "" ? input.phone.trim() : null,
          groupId: input.groupId || null,
        });
        return { success: true } as const;
      }),
  }),

  pos: router({
    checkout: cashierProcedure
      .input(z.object({ items: z.array(z.object({ productId: z.number().int().positive(), quantity: z.number().int().positive().max(999) })).min(1), discount: money.default(0), paymentMethod: z.enum(["cash", "card", "transfer", "other"]), amountReceived: money, customerId: z.number().int().positive().nullable().optional(), clientRequestId: z.string().trim().min(8).max(48).optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        const saleNumber = createIdempotentSaleNumber(input.clientRequestId);
        const existingSale = await db.select().from(sales).where(and(eq(sales.tenantId, ctx.tenant.id), eq(sales.saleNumber, saleNumber))).limit(1);
        if (existingSale[0]) {
          return { saleId: existingSale[0].id, saleNumber: existingSale[0].saleNumber, subtotal: String(existingSale[0].subtotal), discount: String(existingSale[0].discount), tax: String(existingSale[0].tax), total: String(existingSale[0].total), change: String(existingSale[0].changeAmount), footer: ctx.tenant.receiptFooter, logoUrl: ctx.tenant.logoUrl, replayed: true };
        }
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
          return { saleId, saleNumber, subtotal: formatMoney(subtotalCents), discount: formatMoney(discountCents), tax: formatMoney(taxCents), total: formatMoney(totalCents), change: formatMoney(changeCents), footer: ctx.tenant.receiptFooter, logoUrl: ctx.tenant.logoUrl, replayed: false };
        });
      }),
    history: tenantProcedure.input(z.object({ query: z.string().trim().optional() }).optional()).query(async ({ ctx, input }) => {
      const rows = await getSalesForTenant(ctx.tenant.id);
      if (!input?.query) return rows;
      const normalized = input.query.toLowerCase();
      return rows.filter(row => row.sale.saleNumber.toLowerCase().includes(normalized) || row.customer?.name?.toLowerCase().includes(normalized));
    }),
  }),

  reports: router({
    overview: tenantAdminProcedure.input(z.object({ from: z.number(), to: z.number() })).query(async ({ ctx, input }) => {
      const db = await getDb();
      const empty = { revenue: 0, orders: 0, avgOrder: 0, tax: 0, discounts: 0, cogs: 0, grossProfit: 0, expenses: 0, netProfit: 0, refunds: { count: 0, total: 0 }, byCategory: [], byHour: [], byWeekday: [], topCustomers: [], daily: [], expenseByCategory: [] };
      if (!db) return empty;
      const from = new Date(input.from), to = new Date(input.to), t = ctx.tenant.id;
      const inRange = and(eq(sales.tenantId, t), eq(sales.status, "completed"), gte(sales.createdAt, from), lte(sales.createdAt, to));
      const [agg] = await db.select({ revenue: sql<string>`COALESCE(SUM(${sales.total}),0)`, orders: sql<number>`COUNT(*)`.mapWith(Number), tax: sql<string>`COALESCE(SUM(${sales.tax}),0)`, discounts: sql<string>`COALESCE(SUM(${sales.discount}),0)` }).from(sales).where(inRange);
      const [ref] = await db.select({ total: sql<string>`COALESCE(SUM(${sales.total}),0)`, count: sql<number>`COUNT(*)`.mapWith(Number) }).from(sales).where(and(eq(sales.tenantId, t), eq(sales.status, "refunded"), gte(sales.createdAt, from), lte(sales.createdAt, to)));
      const [cg] = await db.select({ cogs: sql<string>`COALESCE(SUM(${saleItems.quantity} * ${products.costPrice}),0)` }).from(saleItems).innerJoin(sales, eq(sales.id, saleItems.saleId)).innerJoin(products, eq(products.id, saleItems.productId)).where(inRange);
      const [ex] = await db.select({ total: sql<string>`COALESCE(SUM(${expenses.amount}),0)` }).from(expenses).where(and(eq(expenses.tenantId, t), gte(expenses.expenseDate, from), lte(expenses.expenseDate, to)));
      const byCategory = await db.select({ name: sql<string>`COALESCE(${categories.name}, 'Uncategorised')`, revenue: sql<string>`SUM(${saleItems.lineTotal})`, units: sql<string>`SUM(${saleItems.quantity})` })
        .from(saleItems).innerJoin(sales, eq(sales.id, saleItems.saleId)).leftJoin(products, eq(products.id, saleItems.productId)).leftJoin(categories, eq(categories.id, products.categoryId))
        .where(inRange).groupBy(sql`COALESCE(${categories.name}, 'Uncategorised')`).orderBy(desc(sql`SUM(${saleItems.lineTotal})`)).limit(10);
      const byHour = await db.select({ h: sql<number>`HOUR(${sales.createdAt})`.mapWith(Number), total: sql<string>`SUM(${sales.total})`, orders: sql<number>`COUNT(*)`.mapWith(Number) }).from(sales).where(inRange).groupBy(sql`HOUR(${sales.createdAt})`);
      const byWeekday = await db.select({ d: sql<number>`DAYOFWEEK(${sales.createdAt})`.mapWith(Number), total: sql<string>`SUM(${sales.total})`, orders: sql<number>`COUNT(*)`.mapWith(Number) }).from(sales).where(inRange).groupBy(sql`DAYOFWEEK(${sales.createdAt})`);
      const topCustomers = await db.select({ id: customers.id, name: customers.name, total: sql<string>`SUM(${sales.total})`, orders: sql<number>`COUNT(*)`.mapWith(Number) }).from(sales).innerJoin(customers, eq(customers.id, sales.customerId)).where(inRange).groupBy(customers.id, customers.name).orderBy(desc(sql`SUM(${sales.total})`)).limit(5);
      const daily = await db.select({ day: sql<string>`DATE(${sales.createdAt})`, total: sql<string>`SUM(${sales.total})`, orders: sql<number>`COUNT(*)`.mapWith(Number) }).from(sales).where(inRange).groupBy(sql`DATE(${sales.createdAt})`).orderBy(asc(sql`DATE(${sales.createdAt})`));
      const expenseByCategory = await db.select({ name: expenses.category, total: sql<string>`SUM(${expenses.amount})` }).from(expenses).where(and(eq(expenses.tenantId, t), gte(expenses.expenseDate, from), lte(expenses.expenseDate, to))).groupBy(expenses.category).orderBy(desc(sql`SUM(${expenses.amount})`));
      const revenue = Number(agg?.revenue ?? 0), cogs = Number(cg?.cogs ?? 0), expensesTotal = Number(ex?.total ?? 0), orders = agg?.orders ?? 0;
      return {
        revenue, orders, avgOrder: orders ? revenue / orders : 0, tax: Number(agg?.tax ?? 0), discounts: Number(agg?.discounts ?? 0),
        cogs, grossProfit: revenue - Number(agg?.tax ?? 0) - cogs, expenses: expensesTotal, netProfit: revenue - Number(agg?.tax ?? 0) - cogs - expensesTotal,
        refunds: { count: ref?.count ?? 0, total: Number(ref?.total ?? 0) },
        byCategory: byCategory.map(r => ({ name: r.name, revenue: Number(r.revenue), units: Number(r.units) })),
        byHour: byHour.map(r => ({ hour: r.h, total: Number(r.total), orders: r.orders })),
        byWeekday: byWeekday.map(r => ({ day: r.d, total: Number(r.total), orders: r.orders })),
        topCustomers: topCustomers.map(r => ({ id: r.id, name: r.name, total: Number(r.total), orders: r.orders })),
        daily: daily.map(r => ({ day: String(r.day), total: Number(r.total), orders: r.orders })),
        expenseByCategory: expenseByCategory.map(r => ({ name: r.name, total: Number(r.total) })),
      };
    }),
    customerStatementPdf: tenantProcedure
      .input(z.object({ customerId: z.number().int().positive(), from: z.number().int().optional(), to: z.number().int().optional() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        const customer = (await db.select().from(customers).where(and(eq(customers.id, input.customerId), eq(customers.tenantId, ctx.tenant.id))).limit(1))[0];
        if (!customer) throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found." });
        const predicates = [eq(sales.tenantId, ctx.tenant.id), eq(sales.customerId, input.customerId), eq(sales.status, "completed")];
        if (input.from) predicates.push(gte(sales.createdAt, new Date(input.from)));
        if (input.to) predicates.push(lte(sales.createdAt, new Date(input.to)));
        const rows = await db.select().from(sales).where(and(...predicates)).orderBy(asc(sales.createdAt));
        const total = rows.reduce((sum, row) => sum + Number(row.total), 0);
        const pdf = await buildBrandedPdf({
          title: "Customer purchase statement",
          subtitle: `${customer.name}${customer.email ? ` - ${customer.email}` : ""}${customer.phone ? ` - ${customer.phone}` : ""}`,
          tenant: ctx.tenant,
          rows: rows.map(row => ({ label: `${row.saleNumber} - ${new Date(row.createdAt).toLocaleDateString()}`, value: `₨${Number(row.total).toFixed(2)} - ${row.paymentMethod}` })),
          totals: [{ label: "Orders", value: String(rows.length) }, { label: "Total purchases", value: `₨${total.toFixed(2)}` }],
        });
        return { filename: `omnipos-${customer.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-statement.pdf`, mimeType: "application/pdf", base64: pdf };
      }),
    reconciliationPdf: tenantProcedure
      .input(z.object({ from: z.number().int().optional(), to: z.number().int().optional() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        const salesPredicates = [eq(sales.tenantId, ctx.tenant.id), eq(sales.status, "completed")];
        const expensePredicates = [eq(expenses.tenantId, ctx.tenant.id)];
        if (input.from) { const from = new Date(input.from); salesPredicates.push(gte(sales.createdAt, from)); expensePredicates.push(gte(expenses.expenseDate, from)); }
        if (input.to) { const to = new Date(input.to); salesPredicates.push(lte(sales.createdAt, to)); expensePredicates.push(lte(expenses.expenseDate, to)); }
        const [saleRows, expenseRows] = await Promise.all([
          db.select().from(sales).where(and(...salesPredicates)).orderBy(asc(sales.createdAt)),
          db.select().from(expenses).where(and(...expensePredicates)).orderBy(asc(expenses.expenseDate)),
        ]);
        const grossSales = saleRows.reduce((sum, row) => sum + Number(row.total), 0);
        const expensesTotal = expenseRows.reduce((sum, row) => sum + Number(row.amount), 0);
        const byMethod = saleRows.reduce<Record<string, number>>((acc, row) => { acc[row.paymentMethod] = (acc[row.paymentMethod] ?? 0) + Number(row.total); return acc; }, {});
        const pdf = await buildBrandedPdf({
          title: "Financial reconciliation report",
          subtitle: `${input.from ? new Date(input.from).toLocaleDateString() : "All time"} - ${input.to ? new Date(input.to).toLocaleDateString() : new Date().toLocaleDateString()}`,
          tenant: ctx.tenant,
          rows: [...Object.entries(byMethod).map(([method, amount]) => ({ label: `Sales - ${method}`, value: `₨${amount.toFixed(2)}` })), ...expenseRows.map(row => ({ label: `Expense - ${row.category} - ${new Date(row.expenseDate).toLocaleDateString()}`, value: `₨${Number(row.amount).toFixed(2)}` }))],
          totals: [{ label: "Gross sales", value: `₨${grossSales.toFixed(2)}` }, { label: "Operating expenses", value: `₨${expensesTotal.toFixed(2)}` }, { label: "Net reconciliation", value: `₨${(grossSales - expensesTotal).toFixed(2)}` }],
        });
        return { filename: `omnipos-reconciliation-${new Date().toISOString().slice(0, 10)}.pdf`, mimeType: "application/pdf", base64: pdf, summary: { grossSales, expenses: expensesTotal, net: grossSales - expensesTotal, orderCount: saleRows.length } };
      }),
  }),

  inventory: router({
    list: tenantProcedure.input(z.object({ query: z.string().trim().optional() }).optional()).query(({ ctx, input }) => getProductsForTenant(ctx.tenant.id, input?.query)),
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
      return db.select().from(inventoryMovements).where(and(...predicates)).orderBy(desc(inventoryMovements.createdAt)).limit(500);
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
      return db.select({ purchase: purchases, supplier: suppliers, itemCount: sql<number>`(SELECT COALESCE(SUM(${purchaseItems.quantity}), 0) FROM ${purchaseItems} WHERE ${purchaseItems.purchaseId} = ${purchases.id})`.mapWith(Number) }).from(purchases).leftJoin(suppliers, eq(suppliers.id, purchases.supplierId)).where(eq(purchases.tenantId, ctx.tenant.id)).orderBy(desc(purchases.createdAt)).limit(300);
    }),
    items: inventoryProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select({ item: purchaseItems, product: { name: products.name, sku: products.sku } }).from(purchaseItems).leftJoin(products, eq(products.id, purchaseItems.productId)).where(and(eq(purchaseItems.purchaseId, input.id), eq(purchaseItems.tenantId, ctx.tenant.id)));
    }),
    receive: inventoryProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      return db.transaction(async tx => {
        const [po] = await tx.select().from(purchases).where(and(eq(purchases.id, input.id), eq(purchases.tenantId, ctx.tenant.id))).limit(1);
        if (!po) throw new TRPCError({ code: "NOT_FOUND", message: "Purchase order not found." });
        if (po.status !== "ordered" && po.status !== "draft") throw new TRPCError({ code: "BAD_REQUEST", message: `This order is already ${po.status}.` });
        const items = await tx.select().from(purchaseItems).where(and(eq(purchaseItems.purchaseId, po.id), eq(purchaseItems.tenantId, ctx.tenant.id)));
        for (const item of items) {
          await tx.update(products).set({ stockQuantity: sql`${products.stockQuantity} + ${item.quantity}`, costPrice: item.unitCost }).where(and(eq(products.id, item.productId), eq(products.tenantId, ctx.tenant.id)));
          await tx.insert(inventoryMovements).values({ tenantId: ctx.tenant.id, productId: item.productId, type: "purchase", quantity: item.quantity, reason: `Received ${po.purchaseNumber}`, referenceId: po.id, createdByUserId: ctx.user.id });
        }
        await tx.update(purchases).set({ status: "received" }).where(eq(purchases.id, po.id));
        await tx.insert(auditLogs).values({ tenantId: ctx.tenant.id, userId: ctx.user.id, action: "received", entity: "purchase", entityId: po.id, metadata: JSON.stringify({ purchaseNumber: po.purchaseNumber, items: items.length }) });
        return { success: true as const, units: items.reduce((n, i) => n + i.quantity, 0) };
      });
    }),
    cancel: inventoryProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [po] = await db.select().from(purchases).where(and(eq(purchases.id, input.id), eq(purchases.tenantId, ctx.tenant.id))).limit(1);
      if (!po || (po.status !== "ordered" && po.status !== "draft")) throw new TRPCError({ code: "BAD_REQUEST", message: "Only open orders can be cancelled." });
      await db.update(purchases).set({ status: "cancelled" }).where(eq(purchases.id, po.id));
      return { success: true as const };
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
      return db.select().from(expenses).where(eq(expenses.tenantId, ctx.tenant.id)).orderBy(desc(expenses.expenseDate)).limit(500);
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

  activity: router({
    list: tenantAdminProcedure.input(z.object({ page: z.number().int().min(1).default(1), pageSize: z.number().int().min(5).max(100).default(20), entity: z.string().max(40).optional() }).default({ page: 1, pageSize: 20 })).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { rows: [], total: 0 };
      const where = input.entity ? and(eq(auditLogs.tenantId, ctx.tenant.id), eq(auditLogs.entity, input.entity)) : eq(auditLogs.tenantId, ctx.tenant.id);
      const [{ total }] = await db.select({ total: sql<number>`COUNT(*)`.mapWith(Number) }).from(auditLogs).where(where);
      const rows = await db.select({ log: auditLogs, user: { name: users.name } }).from(auditLogs).leftJoin(users, eq(users.id, auditLogs.userId)).where(where).orderBy(desc(auditLogs.createdAt)).limit(input.pageSize).offset((input.page - 1) * input.pageSize);
      return { rows, total };
    }),
  }),

  shifts: router({
    current: tenantProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;
      const [shift] = await db.select().from(registerShifts).where(and(eq(registerShifts.tenantId, ctx.tenant.id), eq(registerShifts.status, "open"))).orderBy(desc(registerShifts.openedAt)).limit(1);
      if (!shift) return null;
      const [c] = await db.select({ cash: sql<string>`COALESCE(SUM(${sales.total}),0)`, orders: sql<number>`COUNT(*)`.mapWith(Number) }).from(sales).where(and(eq(sales.tenantId, ctx.tenant.id), eq(sales.status, "completed"), eq(sales.paymentMethod, "cash"), gte(sales.createdAt, shift.openedAt)));
      const [all] = await db.select({ total: sql<string>`COALESCE(SUM(${sales.total}),0)`, orders: sql<number>`COUNT(*)`.mapWith(Number) }).from(sales).where(and(eq(sales.tenantId, ctx.tenant.id), eq(sales.status, "completed"), gte(sales.createdAt, shift.openedAt)));
      const cashSales = Number(c?.cash ?? 0);
      return { shift, cashSales, expectedCash: Number(shift.openingCash) + cashSales, totalSales: Number(all?.total ?? 0), orders: all?.orders ?? 0 };
    }),
    open: cashierProcedure.input(z.object({ openingCash: money })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [open] = await db.select({ id: registerShifts.id }).from(registerShifts).where(and(eq(registerShifts.tenantId, ctx.tenant.id), eq(registerShifts.status, "open"))).limit(1);
      if (open) throw new TRPCError({ code: "CONFLICT", message: "A shift is already open." });
      await db.insert(registerShifts).values({ tenantId: ctx.tenant.id, openedByUserId: ctx.user.id, openingCash: input.openingCash.toFixed(2) });
      await writeAuditLog({ tenantId: ctx.tenant.id, userId: ctx.user.id, action: "opened", entity: "shift", metadata: { openingCash: input.openingCash } });
      return { success: true as const };
    }),
    close: cashierProcedure.input(z.object({ countedCash: money, notes: z.string().max(300).nullable().optional() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [shift] = await db.select().from(registerShifts).where(and(eq(registerShifts.tenantId, ctx.tenant.id), eq(registerShifts.status, "open"))).orderBy(desc(registerShifts.openedAt)).limit(1);
      if (!shift) throw new TRPCError({ code: "BAD_REQUEST", message: "There is no open shift." });
      const [c] = await db.select({ cash: sql<string>`COALESCE(SUM(${sales.total}),0)` }).from(sales).where(and(eq(sales.tenantId, ctx.tenant.id), eq(sales.status, "completed"), eq(sales.paymentMethod, "cash"), gte(sales.createdAt, shift.openedAt)));
      const expected = Number(shift.openingCash) + Number(c?.cash ?? 0);
      const variance = input.countedCash - expected;
      await db.update(registerShifts).set({ status: "closed", closedAt: new Date(), closedByUserId: ctx.user.id, expectedCash: expected.toFixed(2), countedCash: input.countedCash.toFixed(2), variance: variance.toFixed(2), notes: input.notes ?? null }).where(eq(registerShifts.id, shift.id));
      await writeAuditLog({ tenantId: ctx.tenant.id, userId: ctx.user.id, action: "closed", entity: "shift", entityId: shift.id, metadata: { expected, counted: input.countedCash, variance } });
      return { expected, counted: input.countedCash, variance };
    }),
    list: tenantProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select({ shift: registerShifts, opener: { name: users.name } }).from(registerShifts).leftJoin(users, eq(users.id, registerShifts.openedByUserId)).where(eq(registerShifts.tenantId, ctx.tenant.id)).orderBy(desc(registerShifts.openedAt)).limit(60);
    }),
  }),

  search: router({
    global: tenantProcedure.input(z.object({ q: z.string().trim().min(2).max(60) })).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { products: [], customers: [], sales: [] };
      const like_ = `%${input.q}%`;
      const [prods, custs, sls] = await Promise.all([
        db.select({ id: products.id, name: products.name, sku: products.sku, price: products.sellingPrice, stock: products.stockQuantity }).from(products).where(and(eq(products.tenantId, ctx.tenant.id), or(like(products.name, like_), like(products.sku, like_), like(products.barcode, like_)))).limit(6),
        db.select({ id: customers.id, name: customers.name, email: customers.email, phone: customers.phone }).from(customers).where(and(eq(customers.tenantId, ctx.tenant.id), or(like(customers.name, like_), like(customers.email, like_), like(customers.phone, like_)))).limit(5),
        db.select({ id: sales.id, saleNumber: sales.saleNumber, total: sales.total, createdAt: sales.createdAt }).from(sales).where(and(eq(sales.tenantId, ctx.tenant.id), like(sales.saleNumber, like_))).orderBy(desc(sales.createdAt)).limit(5),
      ]);
      return { products: prods, customers: custs, sales: sls };
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
