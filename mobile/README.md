# OmniPOS Mobile

Phone app for OmniPOS: **Ionic React + Capacitor** (Android + iOS), talking to the portal's REST API (`/api/v1`, see `../MOBILE_API_CONTRACT.md`). It shows exactly the same tenant data as the web portal.

## Features
Onboarding · sign up (creates a business workspace) · sign in · role-aware tabs (owner/admin, cashier, inventory manager) · **Sell** (search, barcode/Bluetooth-scanner, cart, discount, cash/card/transfer, change, shareable receipt) · **offline checkout queue** (stable `clientRequestId`, auto-retry on reconnect/foreground/30 s, no duplicates) · Orders (filters, detail, refund) · Inventory (products, images, stock adjust, variants, movements) · Customers + groups + statement PDF · Suppliers · Purchase orders (create/receive/cancel) · Expenses · Shifts · Reports + reconciliation PDF · Team · Activity log · Business settings/logo.

## Develop
```bash
pnpm install
cp .env.example .env.local     # set VITE_API_URL=http://localhost:3000 (portal dev server)
pnpm dev                       # http://localhost:5196 (browser, phone-sized window)
pnpm check && pnpm test
```
The server address can also be changed in the app (sign-in screen -> gear icon).

## Build an Android APK
Needs Android Studio (JDK 21 + SDK). Then:
```bash
pnpm android:apk
# -> android/app/build/outputs/apk/debug/app-debug.apk   (install on a phone, or `adb install -r ...`)
```
Set the production server in `.env.production` (`VITE_API_URL`) before building. Debug APKs also allow plain-http LAN servers (for testing against your Mac); release builds do not.

Release/Play Store: create a keystore, add `android/keystore.properties`, then `pnpm android:aab`. Change `appId` in `capacitor.config.ts` first (it cannot change after the first upload). Regenerate icons/splash from `assets/` with `pnpm assets`.
