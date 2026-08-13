# OmniPOS Mobile Application - Complete API & Integration Contract

This document provides the complete, self-contained API contract and implementation guidelines for building the **OmniPOS Mobile Application** (React Native / Expo) in a separate chat session. It mirrors the exact tRPC routes, authentication rules, tenant isolation, and PKR currency behaviors of the live web portal (`https://omnipos-hjcb6uyk.manus.space`).

---

## 1. Authentication & Tenant Context

OmniPOS uses direct email/password authentication with secure session cookies.

### Procedures (`auth.*`)
- **`auth.login`** (`publicProcedure`):
  - **Input:** `{ email: string, password: string }`
  - **Output:** `{ success: true, user: UserObject }`
  - **Behavior:** Sets the `omnipos_session` cookie automatically.
- **`auth.me`** (`publicProcedure`):
  - **Input:** None
  - **Output:** `UserObject | null`
  - **Behavior:** Returns current authenticated user profile.
- **`tenant.context`** (`tenantProcedure`):
  - **Input:** None
  - **Output:** `{ tenant: TenantObject, membership: MembershipObject }`
  - **Behavior:** Provides active tenant ID, business name, currency (`PKR`), and staff role (`tenant_admin`, `cashier`, `inventory_manager`).

---

## 2. Catalog & Products (`catalog.*`)

- **`catalog.products`** (`tenantProcedure`):
  - **Input:** `{ search?: string, categoryId?: number }`
  - **Output:** Array of product objects:
    ```ts
    {
      id: number;
      name: string;
      sku: string;
      barcode: string | null;
      price: number; // in PKR
      stock: number;
      categoryId: number | null;
      imageUrl: string | null;
    }
    ```
- **`catalog.categories`** (`tenantProcedure`):
  - **Output:** Array of categories: `{ id: number; name: string; color: string }`

---

## 3. Customer Directory & Loyalty (`customers.*`, `customerGroups.*`)

- **`customers.list`** (`tenantProcedure`):
  - **Input:** `{ search?: string }`
  - **Output:** Array of customer objects:
    ```ts
    {
      id: number;
      name: string;
      email: string | null;
      phone: string | null;
      loyaltyPoints: number;
      totalSpent: number; // in PKR
      groupId: number | null;
    }
    ```
- **`customers.create`** (`tenantProcedure`):
  - **Input:** `{ name: string, email?: string | null, phone?: string | null, groupId?: number | null }`
  - **Output:** Created customer record.
- **`customerGroups.list`** (`tenantProcedure`):
  - **Output:** Array of customer tiers: `{ id: number; name: string; discountPercent: number }`

---

## 4. POS Checkout & Sales History (`pos.*`, `sales.*`)

- **`pos.checkout`** (`tenantProcedure`):
  - **Input:**
    ```ts
    {
      items: Array<{ productId: number; quantity: number; price: number }>;
      customerId?: number | null;
      paymentMethod: "cash" | "card" | "transfer" | "other";
      amountReceived: number; // in PKR
      discountTotal?: number;
      taxTotal?: number;
    }
    ```
  - **Output:**
    ```ts
    {
      success: true;
      orderNumber: string; // e.g. "SALE-MSRGNNKZ"
      total: number;
      changeDue: number;
      loyaltyPointsEarned: number;
    }
    ```
- **`sales.list`** (`tenantProcedure`):
  - **Input:** `{ startDate?: number, endDate?: number, customerId?: number }`
  - **Output:** Array of completed orders with items, totals in PKR, payment method, and timestamp.

---

## 5. Inventory Tracking (`inventory.*`)

- **`inventory.list`** (`tenantProcedure`):
  - **Output:** Array of inventory levels, low-stock alerts, and variant options.
- **`inventory.adjust`** (`inventoryProcedure`):
  - **Input:** `{ productId: number; adjustment: number; reason: string }`
  - **Output:** Updated stock level and movement audit entry.

---

## 6. Recommended Mobile App Architecture for New Chat
1. **API Client:** Use `@trpc/client` and `@tanstack/react-query` configured with `https://omnipos-hjcb6uyk.manus.space/api/trpc`.
2. **UI Framework:** Expo Router + React Native with NativeWind (Tailwind CSS).
3. **Design System:** White-led aesthetic (`#ffffff` card surfaces, `#f8fafc` backgrounds, `#0f172a` primary text/buttons, `#0f766e` teal accent for prices and badges, PKR currency formatting).
