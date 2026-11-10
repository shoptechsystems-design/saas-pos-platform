# OmniPOS Mobile App Build Prompt

Build and maintain the production React Native Expo application in `omnipos-mobile-repo/` for the OmniPOS SaaS platform. Do not replace live data with mocks.

## Existing portal

- Live portal: `https://omnipos-hjcb6uyk.manus.space`
- API base: `https://omnipos-hjcb6uyk.manus.space/api/trpc`
- Read `OMNIPOS_MOBILE_API_CONTRACT.md` and `OMNIPOS_MOBILE_SYNC_REPORT.md` before changing contracts.

## Required behavior

1. Login with direct email/password, persist the native session token securely, and send it as a Bearer token.
2. Load the real tenant catalog and support name/SKU/barcode search plus Bluetooth HID scanners that send barcode + Enter.
3. Add the exact product to the cart, select a real customer or walk-in, calculate PKR totals, and complete checkout.
4. If the connection fails, persist the checkout payload in native SQLite, show pending/failed queue status with the latest error and Retry action, and retry on foreground, app-state changes, network reconnect, and the active interval.
5. Send a stable `clientRequestId` to `pos.checkout`; replaying the same request must not create a duplicate sale.
6. Keep the white-led screens for Sell, Orders, Customers, Inventory, More/Settings, Checkout, and Checkout Success. Loyalty points must not be presented.

## Technical requirements

Use Expo Router, TypeScript, safe-area handling, NativeWind, TanStack Query, and the existing portal adapter. Native offline persistence uses `expo-sqlite`; web preview uses an AsyncStorage fallback. Use FlatList for long lists and disable duplicate checkout taps. Preserve tenant isolation and never bundle server secrets. Keep PKR formatting consistent; PDF output may use `Rs` because bundled standard fonts do not include the rupee glyph.

## Validation

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm exec vitest run --config vitest.config.ts
pnpm lint
EXPO_EXPORT=1 pnpm exec expo export --platform web --clear
```

Also validate on real Android/iOS hardware with a Bluetooth HID scanner. Test invalid login, empty cart, insufficient cash, duplicate taps, offline enqueue, retry after reconnection, failed queue retention, expired session, API failure, cashier permissions, and tenant isolation. Do not claim an APK unless a real `.apk` is generated and verified with `file`.
