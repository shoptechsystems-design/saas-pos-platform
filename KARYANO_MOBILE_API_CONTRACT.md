# Karyano Mobile Application - API & Integration Contract

> **Preferred for mobile: the REST API in `MOBILE_API_CONTRACT.md` (`/api/v1`).** The tRPC contract below remains valid for the web portal.

Base URL (tRPC): `https://karyano-hjcb6uyk.manus.space/api/trpc`

## Authentication

`auth.login` accepts `{ email: string, password: string }` and returns `{ success: true, user: UserObject, token: string }` for native clients. Store the token in secure storage and send `Authorization: Bearer <token>`. `auth.me` and `tenant.context` derive the active tenant from that session. Never send an untrusted tenant ID.

## Catalog and customers

`catalog.products` accepts `{ query?: string, categoryId?: number }`. Products include identifiers, barcode/SKU, PKR pricing, stock, category, and image fields. `catalog.categories`, `customers.list`, and customer groups are tenant-scoped. Optional customer foreign keys must be omitted or sent as `null`, never an empty string.

## Checkout and offline replay

`pos.checkout` accepts:

```ts
{
  items: Array<{ productId: number; quantity: number }>;
  customerId?: number | null;
  paymentMethod: "cash" | "card" | "transfer" | "other";
  amountReceived: number;
  discount?: number;
  clientRequestId?: string;
}
```

The mobile client should send a stable `clientRequestId` for every queued transaction. The server scopes the deterministic sale number to the tenant and returns the existing sale on replay. The response includes `saleId`, `saleNumber`, subtotal, discount, tax, total, change, receipt footer, logo URL, and `replayed`.

## Reports

- `reports.customerStatementPdf`: `{ customerId: number; from?: number; to?: number }` → `{ filename, mimeType: "application/pdf", base64 }`.
- `reports.reconciliationPdf`: `{ from?: number; to?: number }` → branded PDF plus `summary.grossSales`, `summary.expenses`, `summary.net`, and `summary.orderCount`.

Both procedures are tenant-scoped and include branding, receipt footer, PKR values, customer/sale rows, payment-method totals, and expenses.

## Scanner behavior

Bluetooth HID scanners are treated as keyboard input: focus the Sell search field, scan the barcode, and send Enter. The app performs an exact barcode/SKU lookup and adds the product to the cart. Manual search remains available.

## Offline storage and sync status

Native builds use the `expo-sqlite` `checkout_queue` table; web preview uses an AsyncStorage fallback. Entries store request ID, timestamps, retry count, status, last error, and checkout payload. The sync runner retries on foreground, network reconnect, app-state transitions, and a 30-second active interval. The visible banner reports pending/failed counts, latest error, syncing state, and a manual Retry action.
