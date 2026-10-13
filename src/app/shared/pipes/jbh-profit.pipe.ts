import { Pipe, PipeTransform } from '@angular/core';
import { formatProfit } from '@core/formatting';

@Pipe({
  name: 'jbhProfit',
  standalone: true
})
export class JbhProfitPipe implements PipeTransform {
  transform(value: number | null | undefined, currency = 'USD'): string {
    return formatProfit(value, currency);
  }
}
