/** "Rs" instead of the rupee glyph: it renders on every Android font and matches the PDFs. */
export function money(value: string | number | null | undefined, currency = "PKR") {
  const n = Number(value ?? 0);
  const symbol = currency === "PKR" ? "Rs" : currency;
  const body = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${n < 0 ? "-" : ""}${symbol} ${body}`;
}
export const moneyShort = (value: number, currency = "PKR") => {
  const symbol = currency === "PKR" ? "Rs" : currency;
  if (Math.abs(value) >= 1_000_000) return `${symbol} ${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 10_000) return `${symbol} ${(value / 1000).toFixed(1)}k`;
  return `${symbol} ${Math.round(value).toLocaleString("en-US")}`;
};
export const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
export const dateTime = (iso: string | Date | number) => new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
export const dateOnly = (iso: string | Date) => new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
export const initials = (name?: string | null) => (name ?? "?").split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]!.toUpperCase()).join("") || "?";
export const roleLabel = (role?: string) => ({ tenant_admin: "Owner / Admin", cashier: "Cashier", inventory_manager: "Inventory manager" } as Record<string, string>)[role ?? ""] ?? "Member";
export const titleCase = (s: string) => s.replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase());
export const startOfDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
export const daysAgo = (n: number) => startOfDay(new Date(Date.now() - n * 86_400_000));
