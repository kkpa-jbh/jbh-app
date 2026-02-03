import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { MonthlyBalance } from '@core/domain/models/monthly-balance.model';
import { JbhCurrencyPipe, JbhDatePipe, JbhGrowthPipe, JbhProfitPipe } from '@shared/pipes';

@Component({
  selector: 'app-balance-history-table',
  templateUrl: './balance-history-table.component.html',
  styleUrls: ['./balance-history-table.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule, JbhDatePipe, JbhCurrencyPipe, JbhProfitPipe, JbhGrowthPipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BalanceHistoryTableComponent implements OnChanges {
  @Input({ required: true }) balances: MonthlyBalance[] = [];
  @Input() currency = 'USD';
  @Input() showProductColumn = false;

  sortedBalances: MonthlyBalance[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['balances'] && this.balances) {
      this.sortedBalances = [...this.balances].sort((a, b) =>
        b.period.localeCompare(a.period)
      );
    }
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
