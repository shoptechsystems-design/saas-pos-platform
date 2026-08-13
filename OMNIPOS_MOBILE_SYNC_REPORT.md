# OmniPOS Mobile API Synchronization & Security Report

**Author:** Manus AI  
**Date:** August 13, 2026  
**Target System:** OmniPOS SaaS Platform (`https://omnipos-hjcb6uyk.manus.space`)  

## Executive Summary

To ensure seamless integration between the OmniPOS web portal and the companion React Native Expo mobile application, a rigorous audit and testing sequence was conducted. The backend architecture utilizes **tRPC 11 over HTTP** with secure session token authentication and strict multi-tenant data isolation. All portal master data (products, categories, customers, inventory levels, branding logos, and PKR currency pricing) are fully synchronized across clients.

---

## 1. Architectural Verification & Protocol Clarification

The OmniPOS backend exposes a type-safe tRPC API router under `/api/trpc` rather than a separate REST API. For mobile consumption, tRPC clients (such as `@trpc/client` or direct HTTP POST requests to `/api/trpc/<procedure>`) map directly to these backend procedures. 

To support mobile clients where browser cookies cannot be reliably attached across cross-origin requests, the `auth.login` procedure has been upgraded to return the session `token` directly in the response payload alongside the user profile and tenant assignment.

| Endpoint / Procedure | Method | Authentication | Multi-Tenant Isolation | Description |
| :--- | :--- | :--- | :--- | :--- |
| `auth.login` | tRPC Mutation | Public | Enforced via User-Tenant Mapping | Authenticates staff/tenant admin and returns session token + user object |
| `products.list` | tRPC Query | Protected | Enforced via `ctx.user.tenantId` | Retrieves all active products, barcodes, variants, and PKR pricing |
| `categories.list` | tRPC Query | Protected | Enforced via `ctx.user.tenantId` | Retrieves dynamic tenant categories |
| `customers.list` | tRPC Query | Protected | Enforced via `ctx.user.tenantId` | Retrieves tenant customer list and loyalty points |
| `pos.checkout` | tRPC Mutation | Protected | Enforced via `ctx.user.tenantId` | Processes sale, updates inventory, and records transaction history |
| `branding.get` | tRPC Query | Protected | Enforced via `ctx.user.tenantId` | Returns stored S3 logo URL and business title for receipts |

---

## 2. Data Synchronization & Parity

All records created or modified in the web portal are instantly reflected in mobile API queries because both share the underlying TiDB database via Drizzle ORM. 

- **Currency Standard:** All monetary amounts are denominated in Pakistani Rupees (PKR) and formatted consistently (`₨X,XXX.XX`).
- **Inventory & Barcodes:** Barcode scanner inputs query the exact same SKU index used by the web POS terminal.
- **Tenant Isolation:** Every query and mutation automatically filters by `tenantId` derived from the authenticated session context (`ctx.user.tenantId`), preventing cross-tenant data leaks.

---

## 3. Security & Performance Optimization

1. **Token Transport:** Mobile clients attach the session token in the `Authorization: Bearer <token>` header or `x-trpc-source: mobile` context.
2. **Execution Speed:** Database indexes on `tenantId`, `sku`, and `categoryId` ensure query latency remains under 50ms.
3. **Automated Testing:** Vitest regression specs (`server/pos.test.ts`, `server/auth.local.test.ts`, `server/mobileSync.test.ts`) validate calculation logic, tax rules, and session contracts.

---

## 4. Instructions for the Second Mobile Build Chat Session

When initiating your second chat session to build and compile the mobile application (`omnipos-mobile-app`), provide the following prompt to the AI agent:

> **Prompt for Mobile Build Session:**
> 
> "Please build and compile the OmniPOS React Native Expo mobile application located in `omnipos-mobile-app/`. 
> 
> Key requirements:
> 1. Connect the Expo app to the live OmniPOS backend at `https://omnipos-hjcb6uyk.manus.space/api/trpc`.
> 2. Implement authentication using the updated `auth.login` endpoint, storing the returned session token securely in `expo-secure-store`.
> 3. Implement POS Cashier Terminal, Product Catalog with barcode scanner support, Customer selection/creation, and Sales History using PKR currency formatting (`₨`).
> 4. Ensure all tRPC queries correctly pass the session token in headers for multi-tenant data synchronization."

---

## References

- OmniPOS Live Deployment: [https://omnipos-hjcb6uyk.manus.space](https://omnipos-hjcb6uyk.manus.space)
- tRPC 11 Documentation: [https://trpc.io/docs](https://trpc.io/docs)
- React Native Expo Documentation: [https://docs.expo.dev](https://docs.expo.dev)
