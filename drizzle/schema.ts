import {
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/** Core user table backing the managed authentication flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  /** The global admin value maps to the Super Admin product role. */
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const tenants = mysqlTable("tenants", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull(),
  businessType: varchar("businessType", { length: 80 }).default("Retail").notNull(),
  logoUrl: text("logoUrl"),
  currency: varchar("currency", { length: 8 }).default("USD").notNull(),
  taxRate: decimal("taxRate", { precision: 6, scale: 3 }).default("8.25").notNull(),
  receiptFooter: text("receiptFooter"),
  status: mysqlEnum("status", ["active", "suspended", "inactive"]).default("active").notNull(),
  ownerUserId: int("ownerUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  slugIdx: uniqueIndex("tenants_slug_idx").on(table.slug),
  ownerIdx: index("tenants_owner_idx").on(table.ownerUserId),
}));

export const tenantMemberships = mysqlTable("tenant_memberships", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["tenant_admin", "cashier", "inventory_manager"]).notNull(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  membershipIdx: uniqueIndex("tenant_membership_unique").on(table.tenantId, table.userId),
  userIdx: index("tenant_membership_user_idx").on(table.userId),
}));

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  color: varchar("color", { length: 16 }).default("#5B6CFF").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ tenantNameIdx: uniqueIndex("categories_tenant_name_idx").on(table.tenantId, table.name) }));

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  categoryId: int("categoryId"),
  name: varchar("name", { length: 180 }).notNull(),
  sku: varchar("sku", { length: 80 }).notNull(),
  barcode: varchar("barcode", { length: 80 }),
  description: text("description"),
  costPrice: decimal("costPrice", { precision: 12, scale: 2 }).default("0").notNull(),
  sellingPrice: decimal("sellingPrice", { precision: 12, scale: 2 }).default("0").notNull(),
  discountPrice: decimal("discountPrice", { precision: 12, scale: 2 }),
  taxRate: decimal("taxRate", { precision: 6, scale: 3 }),
  stockQuantity: int("stockQuantity").default(0).notNull(),
  minStockLevel: int("minStockLevel").default(5).notNull(),
  unit: varchar("unit", { length: 32 }).default("each").notNull(),
  imageUrl: text("imageUrl"),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  tenantSkuIdx: uniqueIndex("products_tenant_sku_idx").on(table.tenantId, table.sku),
  tenantBarcodeIdx: index("products_tenant_barcode_idx").on(table.tenantId, table.barcode),
  tenantCategoryIdx: index("products_tenant_category_idx").on(table.tenantId, table.categoryId),
}));

export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 40 }),
  loyaltyPoints: int("loyaltyPoints").default(0).notNull(),
  totalSpent: decimal("totalSpent", { precision: 12, scale: 2 }).default("0").notNull(),
  lastPurchaseAt: timestamp("lastPurchaseAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  tenantNameIdx: index("customers_tenant_name_idx").on(table.tenantId, table.name),
  tenantEmailIdx: index("customers_tenant_email_idx").on(table.tenantId, table.email),
}));

export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 40 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ tenantNameIdx: uniqueIndex("suppliers_tenant_name_idx").on(table.tenantId, table.name) }));

export const purchases = mysqlTable("purchases", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  supplierId: int("supplierId"),
  purchaseNumber: varchar("purchaseNumber", { length: 48 }).notNull(),
  status: mysqlEnum("status", ["draft", "ordered", "received", "cancelled"]).default("draft").notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).default("0").notNull(),
  notes: text("notes"),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  tenantNumberIdx: uniqueIndex("purchases_tenant_number_idx").on(table.tenantId, table.purchaseNumber),
  tenantStatusIdx: index("purchases_tenant_status_idx").on(table.tenantId, table.status),
}));

export const purchaseItems = mysqlTable("purchase_items", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  purchaseId: int("purchaseId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").notNull(),
  unitCost: decimal("unitCost", { precision: 12, scale: 2 }).notNull(),
  lineTotal: decimal("lineTotal", { precision: 12, scale: 2 }).notNull(),
}, table => ({ purchaseIdx: index("purchase_items_purchase_idx").on(table.tenantId, table.purchaseId) }));

export const sales = mysqlTable("sales", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  customerId: int("customerId"),
  saleNumber: varchar("saleNumber", { length: 48 }).notNull(),
  status: mysqlEnum("status", ["completed", "held", "cancelled", "refunded"]).default("completed").notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 12, scale: 2 }).default("0").notNull(),
  tax: decimal("tax", { precision: 12, scale: 2 }).default("0").notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: varchar("paymentMethod", { length: 32 }).notNull(),
  amountReceived: decimal("amountReceived", { precision: 12, scale: 2 }).default("0").notNull(),
  changeAmount: decimal("changeAmount", { precision: 12, scale: 2 }).default("0").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  tenantNumberIdx: uniqueIndex("sales_tenant_number_idx").on(table.tenantId, table.saleNumber),
  tenantDateIdx: index("sales_tenant_date_idx").on(table.tenantId, table.createdAt),
  tenantStatusIdx: index("sales_tenant_status_idx").on(table.tenantId, table.status),
}));

export const saleItems = mysqlTable("sale_items", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  saleId: int("saleId").notNull(),
  productId: int("productId").notNull(),
  productName: varchar("productName", { length: 180 }).notNull(),
  sku: varchar("sku", { length: 80 }).notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull(),
  lineTotal: decimal("lineTotal", { precision: 12, scale: 2 }).notNull(),
}, table => ({
  saleIdx: index("sale_items_sale_idx").on(table.tenantId, table.saleId),
  productIdx: index("sale_items_product_idx").on(table.tenantId, table.productId),
}));

export const inventoryMovements = mysqlTable("inventory_movements", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  productId: int("productId").notNull(),
  type: mysqlEnum("type", ["stock_in", "stock_out", "adjustment", "sale", "purchase"]).notNull(),
  quantity: int("quantity").notNull(),
  reason: varchar("reason", { length: 220 }),
  referenceId: int("referenceId"),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ productDateIdx: index("inventory_product_date_idx").on(table.tenantId, table.productId, table.createdAt) }));

export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  expenseDate: timestamp("expenseDate").defaultNow().notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ tenantDateIdx: index("expenses_tenant_date_idx").on(table.tenantId, table.expenseDate) }));

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId"),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  entity: varchar("entity", { length: 100 }).notNull(),
  entityId: int("entityId"),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  tenantDateIdx: index("audit_tenant_date_idx").on(table.tenantId, table.createdAt),
  userDateIdx: index("audit_user_date_idx").on(table.userId, table.createdAt),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Tenant = typeof tenants.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Sale = typeof sales.$inferSelect;
export type SaleItem = typeof saleItems.$inferSelect;
export type TenantMembership = typeof tenantMemberships.$inferSelect;
