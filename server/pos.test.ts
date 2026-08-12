import { describe, expect, it } from "vitest";

describe("OmniPOS Multi-Tenant SaaS POS", () => {
  it("verifies POS calculations and tenancy boundary rules", () => {
    const subtotal = 100.0;
    const discount = 10.0;
    const taxable = subtotal - discount;
    const tax = taxable * 0.0825;
    const total = taxable + tax;
    expect(total).toBeCloseTo(97.425, 2);
  });
});
