import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { BalanceHistorySummaryModel } from '@core/domain/features/balance-history';
import { JbhCurrencyPipe, JbhProfitPipe, JbhGrowthPipe } from '@shared/pipes';
import { JbhIconComponent } from '@design-system/components';

@Component({
  selector: 'app-balance-summary-cards',
  templateUrl: './balance-summary-cards.component.html',
  styleUrls: ['./balance-summary-cards.component.scss'],
  standalone: true,
  imports: [NgClass, TranslateModule, JbhCurrencyPipe, JbhProfitPipe, JbhGrowthPipe, JbhIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BalanceSummaryCardsComponent {
  @Input({ required: true }) summary!: BalanceHistorySummaryModel;
  @Input() currency = 'USD';

  getPeriodChangeClass(): string {
    if (this.summary.periodChange > 0) return 'positive';
    if (this.summary.periodChange < 0) return 'negative';
    return '';
  }

  getAvgGrowthClass(): string {
    if (this.summary.avgGrowthRate > 0) return 'positive';
    if (this.summary.avgGrowthRate < 0) return 'negative';
    return '';
  }
}
