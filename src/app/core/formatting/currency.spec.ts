import { formatCurrency, formatProfit } from './currency';

describe('formatCurrency', () => {
  it('formats positive, negative and zero amounts in USD', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.50');
    expect(formatCurrency(-50)).toBe('-$50.00');
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('returns an empty string for null and undefined', () => {
    expect(formatCurrency(null)).toBe('');
    expect(formatCurrency(undefined)).toBe('');
  });

  it('uses the given currency', () => {
    expect(formatCurrency(1234.5, 'EUR')).toBe('€1,234.50');
  });

  it('uses the given fraction digits', () => {
    expect(formatCurrency(1234.56, 'USD', 0)).toBe('$1,235');
  });
});

describe('formatProfit', () => {
  it('adds a plus sign only for positive values', () => {
    expect(formatProfit(100)).toBe('+$100.00');
    expect(formatProfit(-100)).toBe('-$100.00');
    expect(formatProfit(0)).toBe('$0.00');
  });

  it('treats null as zero', () => {
    expect(formatProfit(null)).toBe('$0.00');
  });

  it('uses the given currency', () => {
    expect(formatProfit(1234.5, 'EUR')).toBe('+€1,234.50');
  });
});
