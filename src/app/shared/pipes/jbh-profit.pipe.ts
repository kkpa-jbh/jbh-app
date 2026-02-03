import { Pipe, PipeTransform } from '@angular/core';
import { JbhCurrencyPipe } from './jbh-currency.pipe';

@Pipe({
  name: 'jbhProfit',
  standalone: true
})
export class JbhProfitPipe implements PipeTransform {
  private currencyPipe = new JbhCurrencyPipe();

  transform(value: number | null | undefined, currency = 'USD'): string {
    const numValue = value ?? 0;
    const prefix = numValue > 0 ? '+' : '';
    return prefix + this.currencyPipe.transform(numValue, currency);
  }
}
