import { Pipe, PipeTransform } from '@angular/core';
import {
  DateFormat,
  formatDate,
  formatFullDate,
  formatMonthYear,
  formatPeriod,
  formatShortDate,
  normalizePeriod,
  periodToDate,
  toPeriod
} from '@core/formatting';

export type JbhDateFormat = DateFormat;

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
    return formatDate(value, format);
  }

  /** Delegates to the core. Callers move to `@core/formatting` in the feature wave; this goes after. */
  static toPeriod(date: Date): string {
    return toPeriod(date);
  }

  static periodToDate(period: string): Date | null {
    return periodToDate(period);
  }

  static formatMonthYear(date: Date): string {
    return formatMonthYear(date);
  }

  static formatPeriod(period: string): string {
    return formatPeriod(period);
  }

  static formatFullDate(date: Date): string {
    return formatFullDate(date);
  }

  static formatShortDate(date: Date): string {
    return formatShortDate(date);
  }

  static normalizePeriod(value: string): string {
    return normalizePeriod(value);
  }
}
