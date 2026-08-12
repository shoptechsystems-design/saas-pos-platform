import { describe, expect, it } from "vitest";
import { createLocalOpenId, hashPassword, verifyPassword } from "./db";
import { toSafeUser } from "./routers";

describe("direct account authentication", () => {
  it("hashes passwords and verifies only the correct password", () => {
    const password = "OmniPOS-secure-2026";
    const storedHash = hashPassword(password);

    expect(storedHash).not.toContain(password);
    expect(verifyPassword(password, storedHash)).toBe(true);
    expect(verifyPassword("wrong-password", storedHash)).toBe(false);
  });

  it("verifies the configured Super Admin password hash", () => {
    const configuredHash = "f862b71b3598d9a584114253b03e97f3:b0923b7aea9b34725d6851bc0fbc387fa68ecd06649851f17ff10854168f0909441cf7551ef9625297d4645205e8b90fb5e0ecc195ca01844f6a685d6b01dd5f";
    expect(verifyPassword("SuperAdmin@05", configuredHash)).toBe(true);
    expect(verifyPassword("wrong-password", configuredHash)).toBe(false);
  });

  it("never exposes passwordHash in a safe auth DTO", () => {
    const safeUser = toSafeUser({
      id: 42,
      openId: "local:test",
      name: "Super Admin",
      email: "shoptechsystems@gmail.com",
      loginMethod: "local",
      passwordHash: "scrypt$secret",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });

    expect(safeUser).not.toHaveProperty("passwordHash");
    expect(safeUser?.email).toBe("shoptechsystems@gmail.com");
  });

  it("creates a local open id with a bounded safe prefix", () => {
    const openId = createLocalOpenId();
    expect(openId.startsWith("local:")).toBe(true);
    expect(openId.length).toBeLessThanOrEqual(64);
  });
});
