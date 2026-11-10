# OmniPOS Mobile API Synchronization & Security Report

**Target system:** OmniPOS SaaS Platform (`https://omnipos-hjcb6uyk.manus.space`)
**Mobile repository:** `shoptechsystems-design/omnipos-mobile`

## Executive summary

The Expo mobile client shares the OmniPOS tenant-scoped tRPC backend, PKR calculations, authentication, inventory rules, customer history, and receipt branding. This release adds Bluetooth HID barcode scanning, offline SQLite transaction persistence with idempotent replay, visible synchronization status, and branded customer/reconciliation PDFs.

## Authentication and tenant isolation

`auth.login` returns `{ success, user, token }` for native clients. The mobile app stores the token in secure storage and sends `Authorization: Bearer <token>` on subsequent requests. Tenant context is derived from the session membership; mobile input never supplies a tenant ID. Product, customer, checkout, inventory, sales, and report procedures filter by the active tenant.

## Barcode scanning

The Sell screen uses a normal text input, which supports Bluetooth scanners operating in HID/keyboard-wedge mode. A scanner types a barcode and sends Enter; the app performs an exact barcode/SKU lookup and adds the matching product directly to the cart. Manual name/SKU/barcode search remains available.

## Offline checkout and synchronization

Native builds store queued sales in `expo-sqlite` (`omnipos-offline.db`); web preview uses an AsyncStorage fallback. Each queued sale stores a client request ID, cart/payment/customer payload, attempt count, status, and last error. `pos.checkout` accepts `clientRequestId`, derives a deterministic sale number from it, and returns the existing sale on replay so stock and customer totals are not duplicated.

The mobile sync runner retries on app foreground, network reconnect, app-state transitions, and a 30-second active interval. A visible banner reports pending count, failed count, the latest error, syncing state, and a manual Retry action. Entries remain available for retry and become `failed` after five attempts.

## Report procedures

- `reports.customerStatementPdf` takes `{ customerId, from?, to? }` and returns `{ filename, mimeType, base64 }`.
- `reports.reconciliationPdf` takes `{ from?, to? }` and returns a branded PDF plus gross sales, expense, net, and order-count summary.

Documents include the tenant name, saved logo when reachable, receipt footer, payment method totals, customer/sale rows, expenses, and PKR values. PDF standard fonts render the rupee symbol as `Rs`; web and mobile UI formatting remains PKR/₨.

## Verification completed

- Web TypeScript check: passed.
- Web Vitest suite: 5 files / 11 tests passed.
- Web production build: passed.
- Mobile TypeScript check: passed.
- Mobile focused Vitest suite: 2 files / 3 tests passed, including enqueue → failure metadata → completion removal.
- Mobile Expo lint: passed.
- Mobile Expo web export: passed with 21 static routes.

## Remaining device validation

HID scanning should be validated on the store’s supported Android/iOS hardware. Full OS-level execution while the app is force-closed requires a platform-specific background task and should be enabled only after device testing. Camera barcode scanning remains a separate future enhancement.
