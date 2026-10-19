/** Formats a growth rate with 2 decimals and '%', with '+' for positive values. Null counts as 0. */
export function formatGrowth(value: number | null | undefined): string {
  const rate = value ?? 0;
  const prefix = rate > 0 ? '+' : '';
  return prefix + rate.toFixed(2) + '%';
}
