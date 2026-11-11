// Shapes returned by the REST API. Money columns are decimal strings.
export type Role = "tenant_admin" | "cashier" | "inventory_manager";
export type PaymentMethod = "cash" | "card" | "transfer" | "other";

export interface User { id: number; name: string | null; email: string | null; role: "user" | "admin"; loginMethod: string | null }
export interface Tenant { id: number; name: string; slug: string; businessType: string; logoUrl: string | null; currency: string; taxRate: string; receiptFooter: string | null; status: string }
export interface TenantContext { tenant: Tenant; membership: { id: number; role: Role; status: string } }
export interface TenantSettings { name: string; businessType: string; logoUrl: string | null; currency: string; taxRate: number; receiptFooter: string | null }

export interface Category { id: number; name: string; color: string }
export interface Product {
  id: number; categoryId: number | null; name: string; sku: string; barcode: string | null; description: string | null;
  costPrice: string; sellingPrice: string; discountPrice: string | null; taxRate: string | null;
  stockQuantity: number; minStockLevel: number; unit: string; imageUrl: string | null; status: string;
}
export interface Variant { id: number; productId: number; name: string; sku: string; additionalPrice: string; stockQuantity: number }
export interface CustomerGroup { id: number; name: string; discountPercent: string }
export interface Customer { id: number; groupId: number | null; name: string; email: string | null; phone: string | null; loyaltyPoints: number; totalSpent: string; lastPurchaseAt: string | null; orderCount: number }

export interface Sale {
  id: number; customerId: number | null; saleNumber: string; status: "completed" | "held" | "cancelled" | "refunded";
  subtotal: string; discount: string; tax: string; total: string; paymentMethod: string; amountReceived: string; changeAmount: string; createdAt: string;
}
export interface SaleItem { id: number; productId: number; productName: string; sku: string; quantity: number; unitPrice: string; lineTotal: string }
export interface SaleRow { sale: Sale; customer: { id: number; name: string } | null; itemCount: number }
export interface SalesPage { rows: SaleRow[]; total: number; revenue: number; avgOrder: number; refundedCount: number }
export interface SaleDetail { sale: Sale; customer: { id: number; name: string; phone: string | null; email: string | null } | null; cashier: { name: string | null } | null; items: SaleItem[] }
export interface CheckoutResult { saleId: number; saleNumber: string; subtotal: string; discount: string; tax: string; total: string; change: string; footer: string | null; logoUrl: string | null; replayed: boolean }

export interface Stats { todaySales: string; todayOrders: number; monthSales: string; products: number; lowStock: number; customers: number }
export interface TrendPoint { day: string; total: number; orders: number }
export interface TopProduct { productId: number; name: string; units: number; revenue: number }
export interface PaymentMix { method: string; total: number; orders: number }

export interface Supplier { id: number; name: string; email: string | null; phone: string | null; notes: string | null }
export interface PurchaseRow { purchase: { id: number; supplierId: number | null; purchaseNumber: string; status: "draft" | "ordered" | "received" | "cancelled"; total: string; notes: string | null; createdAt: string }; supplier: Supplier | null; itemCount: number }
export interface PurchaseItemRow { item: { id: number; productId: number; quantity: number; unitCost: string; lineTotal: string }; product: { name: string; sku: string } | null }
export interface Expense { id: number; category: string; amount: string; notes: string | null; expenseDate: string }
export interface Movement { id: number; productId: number; type: string; quantity: number; reason: string | null; createdAt: string }
export interface Shift { id: number; status: "open" | "closed"; openingCash: string; expectedCash: string | null; countedCash: string | null; variance: string | null; notes: string | null; openedAt: string; closedAt: string | null }
export interface ShiftCurrent { shift: Shift; cashSales: number; expectedCash: number; totalSales: number; orders: number }
export interface ShiftRow { shift: Shift; opener: { name: string | null } | null }
export interface TeamRow { membership: { id: number; role: Role; status: string }; user: { id: number; name: string | null; email: string | null } }
export interface ActivityRow { log: { id: number; action: string; entity: string; entityId: number | null; metadata: string | null; createdAt: string }; user: { name: string | null } | null }

export interface Overview {
  revenue: number; orders: number; avgOrder: number; tax: number; discounts: number; cogs: number; grossProfit: number; expenses: number; netProfit: number;
  refunds: { count: number; total: number };
  byCategory: { name: string; revenue: number; units: number }[]; byHour: { hour: number; total: number; orders: number }[];
  topCustomers: { id: number; name: string; total: number; orders: number }[]; daily: { day: string; total: number; orders: number }[];
  expenseByCategory: { name: string; total: number }[];
}
export interface PdfResult { filename: string; mimeType: string; base64: string; summary?: { grossSales: number; expenses: number; net: number; orderCount: number } }
export interface SearchResults { products: { id: number; name: string; sku: string; price: string; stock: number }[]; customers: { id: number; name: string; email: string | null; phone: string | null }[]; sales: { id: number; saleNumber: string; total: string; createdAt: string }[] }
