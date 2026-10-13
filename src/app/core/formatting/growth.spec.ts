import { formatGrowth } from './growth';

describe('formatGrowth', () => {
  it('formats with two decimals and a percent sign', () => {
    expect(formatGrowth(12.3)).toBe('+12.30%');
    expect(formatGrowth(-4.5)).toBe('-4.50%');
    expect(formatGrowth(0)).toBe('0.00%');
  });

  it('treats null as zero', () => {
    expect(formatGrowth(null)).toBe('0.00%');
  });
});
