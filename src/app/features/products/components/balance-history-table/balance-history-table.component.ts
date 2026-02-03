import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { MonthlyBalance } from '@core/domain/models/monthly-balance.model';

@Component({
  selector: 'app-balance-history-table',
  templateUrl: './balance-history-table.component.html',
  styleUrls: ['./balance-history-table.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule]
})
export class BalanceHistoryTableComponent {
  @Input({ required: true }) balances: MonthlyBalance[] = [];
  @Input() currency = 'USD';
  @Input() showProductColumn = false;

  get sortedBalances(): MonthlyBalance[] {
    return [...this.balances].sort((a, b) => b.period.localeCompare(a.period));
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  formatProfit(value: number): string {
    const prefix = value > 0 ? '+' : '';
    if (!value) {
      value = 0;
    }
    return prefix + this.formatCurrency(value);
  }

  formatGrowth(value: number): string {
    if (!value) {
      value = 0;
    }
    const prefix = value > 0 ? '+' : '';
    return prefix + value.toFixed(2) + '%';
  }

  getProfitClass(value: number): string {
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return '';
  }

  getGrowthClass(value: number): string {
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return '';
  }

  trackByPeriod(_index: number, balance: MonthlyBalance): string {
    return balance.period + balance.productId;
  }
}
