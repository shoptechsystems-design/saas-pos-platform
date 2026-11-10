const whole = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 });
const fractional = new Intl.NumberFormat("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Format an amount as PKR with thousands separators, e.g. ₨ 2,188 or ₨ 43.76. */
export function money(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  const safe = Number.isFinite(n) ? n : 0;
  return `₨ ${Number.isInteger(safe) ? whole.format(safe) : fractional.format(safe)}`;
}

/** Whole-rupee format for dashboards and summaries, e.g. ₨ 83,473. */
export function moneyWhole(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return `₨ ${whole.format(Number.isFinite(n) ? Math.round(n) : 0)}`;
}
