import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxChartsModule, Color, ScaleType, LegendPosition } from '@swimlane/ngx-charts';
import { MonthlyBalance } from '@core/domain/models/monthly-balance.model';

interface ChartDataPoint {
  name: string;
  value: number;
}

interface ChartSeries {
  name: string;
  series: ChartDataPoint[];
}

@Component({
  selector: 'app-balance-chart',
  templateUrl: './balance-chart.component.html',
  styleUrls: ['./balance-chart.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule, NgxChartsModule]
})
export class BalanceChartComponent implements OnChanges {
  @Input({ required: true }) balances: MonthlyBalance[] = [];
  @Input() currency = 'USD';

  chartData: ChartSeries[] = [];
  showLegend = false;
  legendPosition = LegendPosition.Below;

  colorScheme: Color = {
    name: 'jbh',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#667eea', '#764ba2', '#48bb78', '#4299e1']
  };

  constructor(private translateService: TranslateService) {}

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
      const balanceSeries: ChartDataPoint[] = sortedBalances.map(balance => ({
        name: balance.periodLabel,
        value: balance.closingBalance
      }));

      this.chartData = [
        {
          name: this.translateService.instant('products.balanceHistory.chart.balance'),
          series: balanceSeries
        }
      ];
    } else {
      this.showLegend = true;
      this.chartData = Array.from(productGroups.entries()).map(([, balances]) => {
        const sortedBalances = [...balances].sort((a, b) => a.period.localeCompare(b.period));
        const productName = sortedBalances[0]?.productName || '';

        return {
          name: productName,
          series: sortedBalances.map(b => ({
            name: b.periodLabel,
            value: b.closingBalance
          }))
        };
      });
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  yAxisTickFormat = (value: number): string => {
    return this.formatCurrency(value);
  };
}
