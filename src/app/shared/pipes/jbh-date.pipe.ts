import { Pipe, PipeTransform } from '@angular/core';

export type JbhDateFormat = 'monthYear' | 'fullDate' | 'shortDate' | 'period';

/**
 * Pipe for formatting dates consistently across the application.
 *
 * @description
 * Provides date formatting for both templates and TypeScript code.
 * Use the pipe in templates or call static methods directly in TS.
 *
 * @usageNotes
 *
 * ### Template Usage
 *
 * ```html
 * <!-- Format period string "2024-01" to "Jan 2024" -->
 * {{ balance.period | jbhDate:'monthYear' }}
 *
 * <!-- Format Date object to "January 15, 2024" -->
 * {{ someDate | jbhDate:'fullDate' }}
 *
 * <!-- Format Date object to "01/15/2024" -->
 * {{ someDate | jbhDate:'shortDate' }}
 * ```
 *
 * ### TypeScript Usage
 *
 * ```typescript
 * // Convert Date to period string "YYYY-MM"
 * const period = JbhDatePipe.toPeriod(new Date()); // "2024-01"
 *
 * // Format period string to display label
 * const label = JbhDatePipe.formatPeriod('2024-01'); // "Jan 2024"
 *
 * // Format Date to month/year label
 * const label = JbhDatePipe.formatMonthYear(new Date()); // "Jan 2024"
 * ```
 *
 * @selector jbhDate
 * @standalone true
 */
@Pipe({
  name: 'jbhDate',
  standalone: true
})
export class JbhDatePipe implements PipeTransform {

  /**
   * Transforms a date value to a formatted string.
   * @param value - Date object or period string (YYYY-MM format)
   * @param format - Output format type (default: 'monthYear')
   * @returns Formatted date string
   */
  transform(value: Date | string | null | undefined, format: JbhDateFormat = 'monthYear'): string {
    if (!value) return '';

    if (typeof value === 'string') {
      return this.transformPeriodString(value, format);
    }

    return this.transformDate(value, format);
  }

  private transformPeriodString(period: string, format: JbhDateFormat): string {
    if (format === 'period') {
      return period;
    }

    const date = JbhDatePipe.periodToDate(period);
    if (!date) return period;

    return this.transformDate(date, format);
  }

  private transformDate(date: Date, format: JbhDateFormat): string {
    switch (format) {
      case 'monthYear':
        return JbhDatePipe.formatMonthYear(date);
      case 'fullDate':
        return JbhDatePipe.formatFullDate(date);
      case 'shortDate':
        return JbhDatePipe.formatShortDate(date);
      case 'period':
        return JbhDatePipe.toPeriod(date);
      default:
        return JbhDatePipe.formatMonthYear(date);
    }
  }

  /**
   * Converts a Date object to period string format (YYYY-MM).
   * @param date - Date object to convert
   * @returns Period string in "YYYY-MM" format (e.g., "2024-01")
   */
  static toPeriod(date: Date): string {
if (!date) return '';

if (!(date instanceof Date)) {
  return date;
}

    try {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
    }catch(err){
      // Error converting date to period - return string representation as fallback
      return date.toString();
    }
  }

  /**
   * Converts a period string (YYYY-MM) to a Date object.
   * @param period - Period string in "YYYY-MM" format
   * @returns Date object set to the first day of the month, or null if invalid
   */
  static periodToDate(period: string): Date | null {
    if (!period || !period.includes('-')) return null;

    const [yearStr, monthStr] = period.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;

    if (isNaN(year) || isNaN(month) || month < 0 || month > 11) return null;

    return new Date(year, month, 1);
  }

  /**
   * Formats a Date to "Mon YYYY" format (e.g., "Jan 2024").
   * @param date - Date object to format
   * @returns Formatted string
   */
  static formatMonthYear(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  /**
   * Formats a period string to "Mon YYYY" format.
   * @param period - Period string in "YYYY-MM" format
   * @returns Formatted string (e.g., "Jan 2024")
   */
  static formatPeriod(period: string): string {
    const date = JbhDatePipe.periodToDate(period);
    if (!date) return period;
    return JbhDatePipe.formatMonthYear(date);
  }

  /**
   * Formats a Date to full date format (e.g., "January 15, 2024").
   * @param date - Date object to format
   * @returns Formatted string
   */
  static formatFullDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Formats a Date to short date format (e.g., "01/15/2024").
   * @param date - Date object to format
   * @returns Formatted string
   */
  static formatShortDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Normalizes a date string to period format (YYYY-MM).
   * Handles both "YYYY-MM" and ISO datetime formats (e.g., "2025-12-28T23:59:00").
   * @param value - Date string in any format
   * @returns Period string in "YYYY-MM" format
   */
  static normalizePeriod(value: string): string {
    if (!value) return '';

    if (value.includes('T')) {
      const date = new Date(value);
      return JbhDatePipe.toPeriod(date);
    }

    if (/^\d{4}-\d{2}$/.test(value)) {
      return value;
    }

    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return JbhDatePipe.toPeriod(date);
    }

    return value;
  }
}
