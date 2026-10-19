import {
  formatDate,
  formatFullDate,
  formatMonthYear,
  formatPeriod,
  formatShortDate,
  normalizePeriod,
  periodToDate,
  toDateValue,
  toPeriod
} from './date';

describe('period helpers', () => {
  it('toPeriod gives YYYY-MM', () => {
    expect(toPeriod(new Date(2024, 0, 15))).toBe('2024-01');
  });

  it('periodToDate gives the first day of the month', () => {
    expect(periodToDate('2024-03')).toEqual(new Date(2024, 2, 1));
  });

  it('periodToDate returns null for invalid input', () => {
    expect(periodToDate('2024-13')).toBeNull();
    expect(periodToDate('')).toBeNull();
  });

  it('formatPeriod gives a month and year, or the input when invalid', () => {
    expect(formatPeriod('2024-01')).toBe('Jan 2024');
    expect(formatPeriod('bad')).toBe('bad');
  });
});

describe('date formats', () => {
  it('formatMonthYear', () => {
    expect(formatMonthYear(new Date(2024, 11, 1))).toBe('Dec 2024');
  });

  it('formatFullDate and formatShortDate', () => {
    const date = new Date(2024, 0, 15);
    expect(formatFullDate(date)).toBe('January 15, 2024');
    expect(formatShortDate(date)).toBe('01/15/2024');
  });
});

describe('normalizePeriod', () => {
  it('accepts date-times, periods and empty text', () => {
    expect(normalizePeriod('2025-12-28T23:59:00')).toBe('2025-12');
    expect(normalizePeriod('2024-05')).toBe('2024-05');
    expect(normalizePeriod('')).toBe('');
  });
});

describe('formatDate', () => {
  it('formats a period string with the default format', () => {
    expect(formatDate('2024-01')).toBe('Jan 2024');
  });

  it('keeps a period string for the period format', () => {
    expect(formatDate('2024-01', 'period')).toBe('2024-01');
  });

  it('formats a Date object', () => {
    expect(formatDate(new Date(2024, 0, 15), 'fullDate')).toBe('January 15, 2024');
  });

  it('returns an empty string for empty input', () => {
    expect(formatDate(null)).toBe('');
  });
});

describe('toDateValue', () => {
  it('cuts a date value to YYYY-MM-DD in date mode', () => {
    expect(toDateValue('2025-10-11T10:20:00', 'date')).toBe('2025-10-11');
    expect(toDateValue('2025-10-11', 'date')).toBe('2025-10-11');
  });

  it('cuts a date value to YYYY-MM in month mode', () => {
    expect(toDateValue('2025-10-11T10:20:00', 'month')).toBe('2025-10');
    expect(toDateValue('2025-10', 'month')).toBe('2025-10');
  });

  it('returns null for empty input', () => {
    expect(toDateValue('', 'date')).toBeNull();
    expect(toDateValue(null, 'month')).toBeNull();
  });
});
