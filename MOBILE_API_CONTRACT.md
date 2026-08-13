# OmniPOS Mobile API Contract

This document defines the tRPC and REST synchronization contracts between the **OmniPOS Mobile App (Expo)** and the shared **OmniPOS Backend** (`https://omnipos-hjcb6uyk.manus.space`).

---

## 1. Authentication & Tenant Context
- **Endpoint:** `auth.me` (tRPC query) / `/api/trpc/auth.me`
- **Response:** Current user profile, role (`admin`, `cashier`, `inventory_manager`), and active tenant membership.
- **Tenant Isolation:** All subsequent tRPC procedures automatically inject `ctx.tenantId` and `ctx.user` via session cookies or Bearer tokens.

---

## 2. Catalog & Products
- **Endpoint:** `catalog.products` (tRPC query)
- **Parameters:** `search?: string`, `categoryId?: number`
- **Response:** List of products with id, name, SKU, barcode, price (in PKR), stock level, category, and image URL.
- **Endpoint:** `catalog.categories` (tRPC query)
- **Response:** List of active product categories with ID, name, and color code.

---

## 3. Customers & Loyalty
- **Endpoint:** `customers.list` (tRPC query)
- **Parameters:** `search?: string`
- **Response:** List of tenant customers with id, name, email, phone, loyaltyPoints, and totalSpent.
- **Endpoint:** `customers.create` (tRPC mutation)
- **Parameters:** `name: string`, `email?: string`, `phone?: string`, `groupId?: number`
- **Response:** Created customer record.

---

## 4. POS Checkout & Orders
- **Endpoint:** `pos.checkout` (tRPC mutation)
- **Parameters:**
  ```ts
  {
    items: Array<{ productId: number; quantity: number; price: number }>;
    customerId?: number;
    paymentMethod: 'cash' | 'card' | 'transfer' | 'other';
    amountReceived: number;
    discountTotal?: number;
    taxTotal?: number;
  }
  ```
- **Response:** Completed order summary, order number (`SALE-XXXX`), change due, loyalty points earned, and timestamp.

---

## 5. Sales History & Analytics
- **Endpoint:** `sales.list` (tRPC query)
- **Parameters:** `startDate?: number`, `endDate?: number`, `customerId?: number`
- **Response:** Filtered transaction history with items, totals in PKR, payment method, and cashier details.

---

## 6. Inventory Tracking
- **Endpoint:** `inventory.adjust` (tRPC mutation)
- **Parameters:** `productId: number`, `adjustment: number`, `reason: string`
- **Response:** Updated stock level and audit log entry.
