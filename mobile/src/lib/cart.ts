import type { Product } from "./types";

/** Mirrors the server's checkout maths exactly (server/routers.ts pos.checkout): integer cents, discount capped at subtotal, tax on the discounted amount. */
export const toCents = (v: string | number | null | undefined) => Math.round(Number(v ?? 0) * 100);
export const unitCents = (p: Pick<Product, "sellingPrice" | "discountPrice">) => toCents(p.discountPrice ?? p.sellingPrice);

export interface CartLine { product: Product; qty: number }

export function computeTotals(lines: CartLine[], discount: number, taxRatePercent: number) {
  const subtotal = lines.reduce((s, l) => s + unitCents(l.product) * l.qty, 0);
  const discountCents = Math.min(Math.max(0, toCents(discount)), subtotal);
  const taxable = subtotal - discountCents;
  const tax = Math.round(taxable * (taxRatePercent / 100));
  const total = taxable + tax;
  return { subtotal: subtotal / 100, discount: discountCents / 100, tax: tax / 100, total: total / 100, totalCents: total, items: lines.reduce((s, l) => s + l.qty, 0) };
}

/** Handy "cash tendered" suggestions: exact, next 100/500/1000 above the total. */
export function cashSuggestions(total: number) {
  const ups = [100, 500, 1000, 5000].map(step => Math.ceil(total / step) * step);
  return Array.from(new Set([Math.ceil(total * 100) / 100, ...ups])).filter(v => v >= total).slice(0, 4);
}
