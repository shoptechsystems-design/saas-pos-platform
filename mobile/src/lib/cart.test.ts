import { describe, expect, it } from "vitest";
import { cashSuggestions, computeTotals } from "./cart";
import type { Product } from "./types";

const p = (price: string, discountPrice: string | null = null) => ({ sellingPrice: price, discountPrice }) as Product;

describe("cart maths matches the server", () => {
  it("applies discount before tax (server example: 300 - 50 + 10% = 275)", () => {
    const t = computeTotals([{ product: p("100"), qty: 3 }], 50, 10);
    expect(t).toMatchObject({ subtotal: 300, discount: 50, tax: 25, total: 275 });
  });
  it("uses the discount price when present", () => {
    expect(computeTotals([{ product: p("100", "80"), qty: 2 }], 0, 18).total).toBe(188.8);
  });
  it("caps the discount at the subtotal", () => {
    const t = computeTotals([{ product: p("10"), qty: 1 }], 999, 18);
    expect(t.discount).toBe(10); expect(t.total).toBe(0);
  });
  it("suggests cash amounts at or above the total", () => {
    expect(cashSuggestions(275).every(v => v >= 275)).toBe(true);
    expect(cashSuggestions(275)[0]).toBe(275);
  });
});
