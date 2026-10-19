export type DateFormat = 'monthYear' | 'fullDate' | 'shortDate' | 'period';

/** Value shape of a date field: 'date' is YYYY-MM-DD, 'month' is YYYY-MM. */
export type DateValueMode = 'date' | 'month';

/** Converts a Date to a period string (YYYY-MM). */
export function toPeriod(date: Date): string {
  if (!date) return '';
  if (!(date instanceof Date)) return String(date);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/** Converts a period string (YYYY-MM) to the first day of that month, or null when invalid. */
export function periodToDate(period: string): Date | null {
  if (!period || !period.includes('-')) return null;

  const [yearText, monthText] = period.split('-');
  const year = parseInt(yearText, 10);
  const month = parseInt(monthText, 10) - 1;

  if (isNaN(year) || isNaN(month) || month < 0 || month > 11) return null;

  return new Date(year, month, 1);
}

/** Formats a Date as 'Jan 2024'. */
export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/** Formats a period string as 'Jan 2024'. Returns the input when it is not a valid period. */
export function formatPeriod(period: string): string {
  const date = periodToDate(period);
  if (!date) return period;
  return formatMonthYear(date);
}

/** Formats a Date as 'January 15, 2024'. */
export function formatFullDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

/** Formats a Date as '01/15/2024'. */
export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
}

/** Turns 'YYYY-MM' or an ISO date-time into a period string (YYYY-MM). */
export function normalizePeriod(value: string): string {
  if (!value) return '';

  if (value.includes('T')) {
    return toPeriod(new Date(value));
  }

  if (/^\d{4}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return toPeriod(date);
  }

  return value;
}

function formatDateObject(date: Date, format: DateFormat): string {
  switch (format) {
    case 'fullDate':
      return formatFullDate(date);
    case 'shortDate':
      return formatShortDate(date);
    case 'period':
      return toPeriod(date);
    case 'monthYear':
    default:
      return formatMonthYear(date);
  }
}

/** Formats a Date or a period string. Returns '' for empty input. */
export function formatDate(
  value: Date | string | null | undefined,
  format: DateFormat = 'monthYear'
): string {
  if (!value) return '';

  if (typeof value === 'string') {
    if (format === 'period') return value;

    const date = periodToDate(value);
    if (!date) return value;
    return formatDateObject(date, format);
  }

  return formatDateObject(value, format);
}

/**
 * Cuts a date picker value to the shape the form stores:
 * YYYY-MM-DD for 'date', YYYY-MM for 'month'. Returns null when the text has no such prefix.
 */
export function toDateValue(
  value: string | null | undefined,
  mode: DateValueMode
): string | null {
  if (!value) return null;

  const pattern = mode === 'month' ? /^\d{4}-\d{2}/ : /^\d{4}-\d{2}-\d{2}/;
  const match = pattern.exec(value);
  return match ? match[0] : null;
}
