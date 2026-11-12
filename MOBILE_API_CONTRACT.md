# Karyano REST API v1 (mobile)

The phone app that consumes this API lives in [`mobile/`](mobile/README.md) (Ionic React + Capacitor).

Base URL: `https://<your-host>/api/v1` · Machine-readable spec: `GET /api/v1/openapi.json` · Health: `GET /api/v1/health`

Every endpoint calls the **same server procedures as the portal**, so data, validation, role checks and tenant isolation are identical. The tenant always comes from the token; never send a tenant ID.

## Conventions

- **Auth:** `POST /auth/login` → `{ data: { user, token } }`. Send `Authorization: Bearer <token>` on every other call. Store the token in secure storage.
- **Success:** `{ "data": ... }`. **Error:** `{ "error": { "code", "message", "details?" } }` with HTTP 400 (validation), 401 (no/invalid token), 403 (role/tenant), 404, 409, 500.
- **Dates:** send/receive ISO-8601 strings or epoch milliseconds for filters (`from`, `to`). Money is PKR; many amounts return as decimal strings (e.g. `"220.00"`).
- **Optional foreign keys:** omit or send `null`, never `""`.
- **Offline checkout:** send a stable `clientRequestId` (8–48 chars) per queued sale; replays return the original sale with `replayed: true` and never double-deduct stock.
- **PDFs:** `/customers/:id/statement` and `/reports/reconciliation` return `{filename,mimeType,base64}`; add `?format=pdf` to receive the binary file.
- **Roles:** `tenant_admin` (everything), `cashier` (POS, customers, shifts), `inventory_manager` (products, stock, purchasing). "any member" = any active tenant member.

## Endpoints


### Auth

| Method | Path | Roles | Notes |
|---|---|---|---|
| POST | `/auth/register` | public | Create account + business workspace. Body: {name,businessName,email,password}. Returns user, tenantId, token. |
| POST | `/auth/login` | public | Body: {email,password}. Returns {user, token}. Send token as Bearer. |
| POST | `/auth/logout` | public | Stateless for Bearer tokens: discard the token client-side. |
| GET | `/auth/me` | public | Current user (null if no valid token). |

### Tenant

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/tenant/context` | any member | Active tenant + membership (role). |
| GET | `/tenant/settings` | any member | Business name, currency, tax rate, logo, receipt footer. |
| PUT | `/tenant/settings` | tenant_admin | Body: {name,businessType,currency,taxRate,logoUrl?,receiptFooter?}. |
| POST | `/tenant/logo` | tenant_admin | Body: {filename,base64Data,contentType}. Max 5MB. |

### Dashboard

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/dashboard/stats` | any member | Headline KPIs. |
| GET | `/dashboard/low-stock` | any member | Products at/below minimum stock. |
| GET | `/dashboard/recent-sales` | any member | Latest sales. |
| GET | `/dashboard/sales-trend` | any member | ?days=7..90 (default 14). |
| GET | `/dashboard/top-products` | any member | ?days=1..90 (default 30). |
| GET | `/dashboard/payment-mix` | any member | ?days=1..90 (default 30). |

### Catalog

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/categories` | any member | List categories. |
| POST | `/categories` | tenant_admin | Body: {name,color?}. |
| PUT | `/categories/:id` | tenant_admin | Body: {name,color?}. |
| DELETE | `/categories/:id` | tenant_admin | Delete category. |
| GET | `/products` | any member | ?query=&categoryId=. Query matches name/SKU/barcode. |
| POST | `/products` | tenant_admin, inventory_manager | Body: {name,sellingPrice,stockQuantity,sku?,barcode?,categoryId?,costPrice?,discountPrice?,taxRate?,minStockLevel?,unit?,imageUrl?}. |
| PUT | `/products/:id` | tenant_admin, inventory_manager | Body: {name,sku,sellingPrice,stockQuantity,categoryId?,imageUrl?}. |
| DELETE | `/products/:id` | tenant_admin, inventory_manager | Delete product. |
| POST | `/products/image` | tenant_admin, inventory_manager | Body: {filename,base64Data,contentType}. Returns {url}. |
| GET | `/products/:id/variants` | any member | List variants of a product. |
| POST | `/products/:id/variants` | tenant_admin, inventory_manager | Body: {name,sku,additionalPrice?,stockQuantity?}. |
| DELETE | `/variants/:id` | tenant_admin, inventory_manager | Delete variant. |

### Customers

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/customers` | any member | ?query= |
| POST | `/customers` | tenant_admin, cashier | Body: {name,email?,phone?,groupId?}. Optional FKs: omit or null, never "". |
| GET | `/customers/:id/statement` | any member | ?from=&to= (ms or ISO). JSON {filename,mimeType,base64}; add &format=pdf for the binary PDF. |
| GET | `/customer-groups` | any member | List groups. |
| POST | `/customer-groups` | tenant_admin | Body: {name,discountPercent?}. |
| DELETE | `/customer-groups/:id` | tenant_admin | Delete group. |

### POS

| Method | Path | Roles | Notes |
|---|---|---|---|
| POST | `/pos/checkout` | tenant_admin, cashier | Body: {items:[{productId,quantity}],paymentMethod,amountReceived,discount?,customerId?,clientRequestId?}. Send a stable clientRequestId (8-48 chars) for idempotent offline replay; replays return replayed:true. |

### Sales

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/sales` | any member | ?search&customerId&paymentMethod&status=completed\|refunded\|all&from&to&page&pageSize. Returns {rows,total,revenue,avgOrder,refundedCount}. |
| GET | `/sales/export` | any member | Same filters as /sales; up to 5000 flat rows for export. |
| GET | `/sales/:id` | any member | Sale with customer, cashier and line items. |
| POST | `/sales/:id/refund` | tenant_admin | Body: {reason}. Restocks items. |

### Reports

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/reports/overview` | tenant_admin | ?from=&to= (required, ms or ISO). |
| GET | `/reports/reconciliation` | any member | ?from&to. JSON with base64 + summary; add &format=pdf for binary. |

### Inventory

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/inventory` | any member | ?query= |
| GET | `/inventory/low-stock` | any member | Low-stock products. |
| POST | `/inventory/adjust` | tenant_admin, inventory_manager | Body: {productId,quantity(+/-),reason}. |
| GET | `/inventory/movements` | tenant_admin, inventory_manager | ?productId= (last 500). |

### Purchasing

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/suppliers` | any member | List suppliers. |
| POST | `/suppliers` | tenant_admin, inventory_manager | Body: {name,email?,phone?,notes?}. |
| GET | `/purchases` | tenant_admin, inventory_manager | List purchase orders. |
| POST | `/purchases` | tenant_admin, inventory_manager | Body: {supplierId?,notes?,items:[{productId,quantity,unitCost}]}. |
| GET | `/purchases/:id/items` | tenant_admin, inventory_manager | PO line items. |
| POST | `/purchases/:id/receive` | tenant_admin, inventory_manager | Receive stock into inventory. |
| POST | `/purchases/:id/cancel` | tenant_admin, inventory_manager | Cancel an open PO. |

### Expenses

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/expenses` | any member | Last 500 expenses. |
| POST | `/expenses` | tenant_admin | Body: {category,amount,notes?,expenseDate? (ISO or ms)}. |

### Team

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/team` | tenant_admin | Members of the tenant. |
| POST | `/team/invite` | tenant_admin | Body: {email,name,role: cashier\|inventory_manager}. |
| GET | `/activity` | tenant_admin | Audit log. ?page&pageSize&entity. |

### Shifts

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/shifts` | any member | Recent shifts. |
| GET | `/shifts/current` | any member | Open shift with expected cash, or null. |
| POST | `/shifts/open` | tenant_admin, cashier | Body: {openingCash}. |
| POST | `/shifts/close` | tenant_admin, cashier | Body: {countedCash,notes?}. Returns expected/counted/variance. |

### Search

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/search` | any member | ?q= (2-60 chars). Products, customers, sales. |

### Platform admin

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/admin/stats` | platform admin | Platform totals. |
| GET | `/admin/tenants` | platform admin | All tenants. |
| PUT | `/admin/tenants/:id/status` | platform admin | Body: {status: active\|suspended\|inactive}. |
