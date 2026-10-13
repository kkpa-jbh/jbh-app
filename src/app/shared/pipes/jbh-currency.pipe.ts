import { Pipe, PipeTransform } from '@angular/core';
import { formatCurrency } from '@core/formatting';

@Pipe({
  name: 'jbhCurrency',
  standalone: true
})
export class JbhCurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined, currency = 'USD'): string {
    return formatCurrency(value, currency);
  }
}
