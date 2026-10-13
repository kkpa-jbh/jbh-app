import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BalanceHistoryEntryModel } from '@core/domain/features/balance-history';
import { formatCurrency, formatPeriod } from '@core/formatting';
import { JbhChartSeries, JbhEmptyStateComponent, JbhLineChartComponent } from '@design-system/components';

@Component({
  selector: 'app-balance-chart',
  templateUrl: './balance-chart.component.html',
  styleUrls: ['./balance-chart.component.scss'],
  standalone: true,
  imports: [TranslateModule, JbhLineChartComponent, JbhEmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BalanceChartComponent implements OnChanges {
  @Input({ required: true }) balances: BalanceHistoryEntryModel[] = [];
  @Input() currency = 'USD';

  chartData: JbhChartSeries[] = [];
  showLegend = false;

  private readonly translateService = inject(TranslateService);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['balances'] && this.balances) {
      this.prepareChartData();
    }
  }

  private prepareChartData(): void {
    const productGroups = new Map<string, typeof this.balances>();

    for (const balance of this.balances) {
      const key = balance.productId;
      if (!productGroups.has(key)) {
        productGroups.set(key, []);
      }
      productGroups.get(key)!.push(balance);
    }

    if (productGroups.size === 1) {
      this.showLegend = false;
      const sortedBalances = [...this.balances].sort((a, b) => a.period.localeCompare(b.period));

      this.chartData = [
        {
          name: this.translateService.instant('products.balanceHistory.chart.balance'),
          points: sortedBalances.map(balance => ({
            label: formatPeriod(balance.period),
            value: balance.closingBalance
          }))
        }
      ];
    } else {
      this.showLegend = true;
      this.chartData = Array.from(productGroups.entries()).map(([, balances]) => {
        const sortedBalances = [...balances].sort((a, b) => a.period.localeCompare(b.period));
        const productName = sortedBalances[0]?.productName || '';

        return {
          name: productName,
          points: sortedBalances.map(b => ({
            label: formatPeriod(b.period),
            value: b.closingBalance
          }))
        };
      });
    }
  }

  yAxisTickFormat = (value: number): string => formatCurrency(value, this.currency, 0);
}
