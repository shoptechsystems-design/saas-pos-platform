# OmniPOS SaaS Platform - Release Checklist

## Completed in this release

The web portal retains its premium white-led multi-tenant POS, RBAC, PKR pricing, barcode-ready catalog, branded receipts, inventory, customers, sales analytics, master data, and Super Admin organization management.

The mobile release now includes Bluetooth HID/keyboard-wedge barcode lookup, token-based cross-origin auth, native SQLite offline checkout persistence with AsyncStorage web fallback, deterministic idempotent checkout replay, reconnect/app-state/active-interval sync, visible pending/failed status with manual retry, and loyalty-points removal from the checkout experience.

The portal now exposes tenant-scoped customer statement and financial reconciliation PDF procedures. The Sales History view includes customer-statement and reconciliation download actions. PDFs include tenant name, reachable logo, receipt footer, payment breakdowns, expenses, and PKR-safe totals.

Validation completed: web TypeScript, 11 backend Vitest tests, and production build passed; mobile TypeScript, 3 focused queue/auth tests, lint, and Expo web export with 21 static routes passed. The mobile follow-up is pushed to GitHub at commit `d3a0a73`.

## Remaining device validation

Validate the native Android/iOS build with the store’s physical Bluetooth scanner hardware. Generate and verify a real APK only when Android build credentials/tooling are available. Consider OS-level execution while force-closed after device testing; current synchronization is network-aware during active/foreground/app-state operation.
