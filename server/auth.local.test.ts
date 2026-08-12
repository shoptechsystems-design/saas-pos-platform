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
