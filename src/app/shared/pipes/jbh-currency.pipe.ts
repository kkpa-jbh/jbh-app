import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'jbhCurrency',
  standalone: true
})
export class JbhCurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined, currency = 'USD'): string {
    if (value === null || value === undefined) return '';

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }
}
