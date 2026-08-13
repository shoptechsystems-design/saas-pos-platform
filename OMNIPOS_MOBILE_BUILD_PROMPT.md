# OmniPOS Mobile App Build Prompt

Build a real, production-ready React Native Expo mobile application for the existing OmniPOS SaaS POS platform. Do not create only mockups or static sample screens. The final app must connect to the real backend, use real tenant data, pass end-to-end tests, and include a real Android APK if the build environment supports it.

## Existing portal

Live portal: `https://omnipos-hjcb6uyk.manus.space`

Read the attached `OMNIPOS_MOBILE_API_CONTRACT.md` first, then validate every procedure against the actual backend source. Do not assume previous sessions completed the app. Inspect the backend and build the missing pieces yourself.

OmniPOS uses direct email/password login, secure session handling, multi-tenant isolation, and roles including Super Admin, Tenant Admin, Cashier, and Inventory Manager. The portal includes products, categories, barcodes, product images, variants, stock, customers, customer groups, loyalty points, checkout, sales history filters, inventory adjustments, tenant branding, receipt logo, and PKR currency.

## First end-to-end flow

Implement and test this flow before adding secondary screens:

`login → real products → search/barcode → cart → real customer or Walk-in Customer → checkout → branded receipt → verify sale, stock, and customer totals in the web portal`

A sale created on mobile must appear in the portal Sales History, reduce product stock, update the selected customer's total spent and loyalty points, and use the tenant's saved logo and receipt footer.

## Required screens

1. **Login:** email/password, validation, loading state, session persistence, authentication errors. Do not use the Manus OAuth portal.
2. **Sell / Mobile POS:** real product search by name, SKU, and barcode; category filter; product images with fallback; stock badges; add/remove/quantity controls; PKR subtotal, tax, discount, and total; disabled pending buttons.
3. **Customer Selector:** Walk-in Customer, real tenant customers, search by name/email/phone, loyalty points, and quick-add customer form. Empty optional values must be omitted or sent as `null`, never as an empty foreign-key string.
4. **Checkout:** order summary, selected customer, cash/card/transfer/other payment methods supported by the backend, cash received/change due, duplicate-submit prevention, success and error feedback.
5. **Receipt:** sale number, store name, tenant logo, receipt footer, cashier, items, quantity, tax, discount, total, payment method, and change. Support share/save/print where platform capabilities allow.
6. **Orders / Sales History:** real orders, order detail, receipt, customer filter, payment filter, and date filters: today, yesterday, last 3 days, week, month, and custom range.
7. **Customers:** real searchable tenant customers, contact information, group, loyalty points, total spent, last purchase, and customer order history. If order history is missing from the backend, add a safe typed procedure.
8. **Inventory:** real stock, low-stock warnings, variants, and role-restricted stock adjustments with audit reason.
9. **More / Settings:** tenant name, current role, logo, receipt settings, Master Data, and Team/Roles only where the role permits. Never expose Super Admin screens to tenant users.

## Technical requirements

- Use Expo Router, TypeScript, React Native, safe-area handling, and a shared white-led OmniPOS design system.
- Use `#ffffff` cards, `#f8fafc` backgrounds, `#0f172a` primary actions/text, `#0f766e` accent, accessible contrast, and PKR formatting (`Rs` or `₨` with two decimals).
- Use TanStack Query or the existing tRPC React Query integration. Do not create an unrelated API layer unless necessary and documented.
- Use `FlatList` for long lists, not large `ScrollView.map()` lists.
- Add loaders for all queries and mutations; disable pending buttons; show clear empty/error states.
- Never use mock products, customers, orders, sales, revenue, or stock in the final app.
- Never put database credentials, JWT secrets, Forge keys, or server-only secrets in the mobile bundle.
- Preserve tenant isolation by deriving tenant context from the authenticated session, not from an untrusted form value.
- Solve React Native session-cookie persistence correctly. If the current backend cannot support the required mobile session transport, add a secure minimal backend-compatible mobile session approach instead of pretending it works.

## API/backend rules

Use the existing typed tRPC routes from the attached contract wherever possible, including `auth.login`, `auth.me`, `tenant.context`, `tenant.settings`, `catalog.products`, `catalog.categories`, `customers.list`, `customers.create`, `customerGroups.list`, checkout, sales history, and inventory procedures. Any new procedure must use Zod validation, the correct RBAC guard, tenant-scoped queries, safe nullable handling, useful errors, and tests.

## Required verification

Run and report actual results for TypeScript, linting if available, unit tests, backend procedure tests, mobile flow tests, and Android build validation. Test invalid login, empty cart, insufficient cash, duplicate taps, expired session, API failure, cashier permissions, and tenant isolation.

Verify synchronization explicitly:

1. Create/update a product in the portal and confirm mobile refreshes it.
2. Create a customer in the portal and confirm mobile lists it.
3. Complete a real mobile sale for a selected customer.
4. Confirm the sale appears in portal Sales History.
5. Confirm stock decreases in both clients.
6. Confirm customer total spent and loyalty points update.
7. Confirm receipt uses saved tenant logo and PKR amounts.

## APK requirement

Configure the app as `OmniPOS Mobile`, package `com.omnipos.mobile`, portrait orientation, and approved branding. Run a real Android build such as `eas build -p android --profile preview` or a working local Gradle build. Do not claim an APK exists until a real `.apk` file has been generated and verified with `file` or equivalent. Attach the actual APK in the final response. If EAS credentials or Android tooling are unavailable, state the exact blocker and provide reproducible commands; do not claim the APK is complete.

## Deliverables

Provide the mobile source/project, the completed API contract, implemented screen list, actual test/build results, known limitations, and the real APK attachment if successfully generated. Start by inspecting the backend and the attached contract; do not stop at static screens or mock data.
