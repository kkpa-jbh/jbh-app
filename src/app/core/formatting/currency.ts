/** Formats an amount in en-US currency style. Returns '' for null and undefined. */
export function formatCurrency(
  value: number | null | undefined,
  currency = 'USD',
  fractionDigits = 2
): string {
  if (value === null || value === undefined) return '';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(value);
}

/** Like formatCurrency, with a leading '+' for positive values. Null counts as 0. */
export function formatProfit(value: number | null | undefined, currency = 'USD'): string {
  const amount = value ?? 0;
  const prefix = amount > 0 ? '+' : '';
  return prefix + formatCurrency(amount, currency);
}
