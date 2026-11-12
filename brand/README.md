# Karyano brand kit

**Name:** Karyano (from *karyana*, the neighbourhood shop). **Tagline:** "The smart point of sale for every shop."

## The mark
A striped shop awning over a bold **K**, on a teal gradient squircle. The awning says "shop"; the K says "Karyano".
Readable down to ~20px. Never recolour the awning stripes (coral + white) or stretch the mark.

| File | Use |
|---|---|
| `karyano-mark.svg` | App icon / avatar (squircle) |
| `karyano-glyph-white.svg` | Awning + K only, transparent (single-colour contexts) |
| `karyano-lockup.svg` | Horizontal logo, dark text, for light backgrounds |
| `karyano-lockup-white.svg` | Horizontal logo, white text, for dark backgrounds |
| `store/play-icon-512.png` | Google Play listing icon (512×512) |
| `store/play-feature-graphic-1024x500.png` | Google Play feature graphic |

The wordmark is outlined Inter ExtraBold (no font needed). Keep clear space around the lockup equal to the height of the awning.

## Colours
| Token | Hex |
|---|---|
| Teal (light → dark gradient) | `#34E3CC` → `#0F9E92` → `#0A5D57` |
| Awning coral | `#FF7A62` |
| Navy (backgrounds, text) | `#0B1220` |

## Where the logo is used
- **Portal:** `client/src/components/Logo.tsx` (`KaryanoMark`, `KaryanoLogo`), `client/public/` favicons, manifest, `og-image.png`.
- **Mobile:** `mobile/src/components/Logo.tsx`; native icon + splash sources in `mobile/assets/` (regenerate with
  `npx capacitor-assets generate --android --iconBackgroundColor '#0B1220' --splashBackgroundColor '#0B1220' --splashBackgroundColorDark '#0B1220'`).
- Android package / application ID: `com.karyano.app` (set before first upload; cannot be changed after publishing).

## Before publishing
Confirm the domain, search the Pakistan IPO and USPTO trademark registers for "Karyano", and register the Play package ID.
