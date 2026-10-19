import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgClass } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { BalanceHistoryEntryModel } from '@core/domain/features/balance-history';
import { JbhCurrencyPipe, JbhDatePipe, JbhGrowthPipe, JbhProfitPipe } from '@shared/pipes';
import {
  JbhTableCardDirective,
  JbhTableCellComponent,
  JbhTableComponent,
  JbhTableHeadDirective,
  JbhTableRowComponent,
  JbhTableRowDirective
} from '@design-system/components';

@Component({
  selector: 'app-balance-history-table',
  templateUrl: './balance-history-table.component.html',
  styleUrls: ['./balance-history-table.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    TranslateModule,
    JbhDatePipe,
    JbhCurrencyPipe,
    JbhProfitPipe,
    JbhGrowthPipe,
    JbhTableCardDirective,
    JbhTableCellComponent,
    JbhTableComponent,
    JbhTableHeadDirective,
    JbhTableRowComponent,
    JbhTableRowDirective
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BalanceHistoryTableComponent implements OnChanges {
  @Input({ required: true }) balances: BalanceHistoryEntryModel[] = [];
  @Input() currency = 'USD';
  @Input() showProductColumn = false;

  sortedBalances: BalanceHistoryEntryModel[] = [];

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

  trackByPeriod(_index: number, balance: BalanceHistoryEntryModel): string {
    return balance.period + balance.productId;
  }
}
