import { Pipe, PipeTransform } from '@angular/core';
import { DateFormat, formatDate } from '@core/formatting';

export type JbhDateFormat = DateFormat;

/**
 * Pipe for formatting dates consistently across the application.
 *
 * @description
 * Date formatting for templates. TypeScript code uses the functions of `@core/formatting`.
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
 * Import `toPeriod`, `formatPeriod`, `formatMonthYear` and the others from `@core/formatting`.
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
}
