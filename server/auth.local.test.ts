import { describe, expect, it } from "vitest";
import { createLocalOpenId, hashPassword, verifyPassword } from "./db";

describe("direct account authentication", () => {
  it("hashes passwords and verifies only the correct password", () => {
    const password = "OmniPOS-secure-2026";
    const storedHash = hashPassword(password);

    expect(storedHash).not.toContain(password);
    expect(verifyPassword(password, storedHash)).toBe(true);
    expect(verifyPassword("wrong-password", storedHash)).toBe(false);
  });

  it("creates a local open id with a bounded safe prefix", () => {
    const openId = createLocalOpenId();
    expect(openId.startsWith("local:")).toBe(true);
    expect(openId.length).toBeLessThanOrEqual(64);
  });
});
