import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { walletOutline, trendingUpOutline, statsChartOutline, swapVerticalOutline } from 'ionicons/icons';
import { BalanceHistorySummaryModel } from '@core/domain/models/balance-history.model';
import { JbhCurrencyPipe, JbhProfitPipe, JbhGrowthPipe } from '@shared/pipes';

@Component({
  selector: 'app-balance-summary-cards',
  templateUrl: './balance-summary-cards.component.html',
  styleUrls: ['./balance-summary-cards.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule, JbhCurrencyPipe, JbhProfitPipe, JbhGrowthPipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BalanceSummaryCardsComponent {
  @Input({ required: true }) summary!: BalanceHistorySummaryModel;
  @Input() currency = 'USD';

  constructor() {
    addIcons({ walletOutline, trendingUpOutline, statsChartOutline, swapVerticalOutline });
  }

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
