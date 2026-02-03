import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { walletOutline, trendingUpOutline, statsChartOutline, swapVerticalOutline } from 'ionicons/icons';
import { BalanceHistorySummary } from '@core/domain/models/monthly-balance.model';

@Component({
  selector: 'app-balance-summary-cards',
  templateUrl: './balance-summary-cards.component.html',
  styleUrls: ['./balance-summary-cards.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule]
})
export class BalanceSummaryCardsComponent {
  @Input({ required: true }) summary!: BalanceHistorySummary;
  @Input() currency = 'USD';

  constructor() {
    addIcons({ walletOutline, trendingUpOutline, statsChartOutline, swapVerticalOutline });
  }

  get formattedTotalBalance(): string {
    return this.formatCurrency(this.summary.totalBalance);
  }

  get formattedPeriodChange(): string {
    const prefix = this.summary.periodChange > 0 ? '+' : '';
    return prefix + this.formatCurrency(this.summary.periodChange);
  }

  get formattedPeriodChangePercent(): string {
    const prefix = this.summary.periodChangePercent > 0 ? '+' : '';
    return prefix + this.summary.periodChangePercent.toFixed(2) + '%';
  }

  get formattedAvgGrowth(): string {
    const prefix = this.summary.avgGrowthRate > 0 ? '+' : '';
    return prefix + this.summary.avgGrowthRate.toFixed(2) + '%';
  }

  get periodChangeClass(): string {
    if (this.summary.periodChange > 0) return 'positive';
    if (this.summary.periodChange < 0) return 'negative';
    return '';
  }

  get avgGrowthClass(): string {
    if (this.summary.avgGrowthRate > 0) return 'positive';
    if (this.summary.avgGrowthRate < 0) return 'negative';
    return '';
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }
}
