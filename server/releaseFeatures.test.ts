import { describe, expect, it } from "vitest";
import { buildBrandedPdf, createIdempotentSaleNumber } from "./routers";

describe("offline checkout and finance release", () => {
  it("creates a deterministic sanitized sale number for mobile retries", () => {
    const first = createIdempotentSaleNumber("mobile-abc/123");
    const second = createIdempotentSaleNumber("mobile-abc/123");
    expect(first).toBe("SALE-MOBILE-ABC123");
    expect(second).toBe(first);
    expect(first.length).toBeLessThanOrEqual(46);
  });

  it("generates a branded PDF payload with PKR-safe totals", async () => {
    const base64 = await buildBrandedPdf({
      title: "Financial reconciliation report",
      subtitle: "1 January 2026 - 9 October 2026",
      tenant: { name: "Demo Book Shop", receiptFooter: "Thank you" },
      rows: [{ label: "Sales - cash", value: "₨1,250.00" }],
      totals: [{ label: "Net reconciliation", value: "₨1,250.00" }],
    });
    const bytes = Buffer.from(base64, "base64");
    expect(bytes.subarray(0, 4).toString()).toBe("%PDF");
    expect(bytes.length).toBeGreaterThan(500);
  });
});
