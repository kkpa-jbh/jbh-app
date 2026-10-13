import { Component, OnInit, Output, EventEmitter, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ProductListItem } from '@core/domain/features/products';
import { MonthlyBalanceRequest } from '@core/domain/features/balance-history';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { normalizePeriod, toPeriod } from '@core/formatting';
import { JbhButtonComponent, JbhDateFieldComponent } from '@design-system/components';
import { ProductSelectComponent } from '@shared/components/product-select/product-select.component';

export interface BalanceFilterEvent {
  productId: string | null;
  request: MonthlyBalanceRequest;
}

@Component({
  selector: 'app-balance-history-filter',
  templateUrl: './balance-history-filter.component.html',
  styleUrls: ['./balance-history-filter.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TranslateModule, JbhButtonComponent, JbhDateFieldComponent, ProductSelectComponent]
})
export class BalanceHistoryFilterComponent implements OnInit {
  @Input() products: ProductListItem[] = [];
  @Input() initialProductId: string | null = null;
  @Output() filterApplied = new EventEmitter<BalanceFilterEvent>();

  filterForm!: FormGroup;
  maxDate: string;
  minStartDate: string;

  private readonly fb = inject(FormBuilder);
  private readonly translationService = inject(TranslationService);

  constructor() {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    this.maxDate = toPeriod(date);
    this.minStartDate = '2020-01';
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    const now = new Date();
    const lastMonth = new Date(now);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const endPeriod = toPeriod(lastMonth);

    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    const startPeriod = toPeriod(sixMonthsAgo);

    this.filterForm = this.fb.group({
      productId: [this.initialProductId || ''],
      startPeriod: [startPeriod, [Validators.required]],
      endPeriod: [endPeriod, [Validators.required]]
    }, { validators: this.dateRangeValidator.bind(this) });
  }

  private dateRangeValidator(group: FormGroup): { [key: string]: boolean } | null {
    const startRaw = group.get('startPeriod')?.value;
    const endRaw = group.get('endPeriod')?.value;

    const start = startRaw ? normalizePeriod(startRaw) : null;
    const end = endRaw ? normalizePeriod(endRaw) : null;

    if (start && end && start > end) {
      return { startAfterEnd: true };
    }

    const maxPeriod = toPeriod(new Date());
    if (end && end > maxPeriod) {
      return { endInFuture: true };
    }

    return null;
  }

  onApplyFilter(): void {
    if (this.filterForm.valid) {
      const formValue = this.filterForm.value;
      this.filterApplied.emit({
        productId: formValue.productId || null,
        request: {
          startPeriod: normalizePeriod(formValue.startPeriod),
          endPeriod: normalizePeriod(formValue.endPeriod)
        }
      });
    }
  }

  hasError(field: string): boolean {
    const control = this.filterForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  hasFormError(error: string): boolean {
    return this.filterForm.hasError(error);
  }

  getStartPeriodError(): string {
    if (this.hasError('startPeriod')) {
      return this.translationService.instant('products.balanceHistory.startPeriod.required');
    }
    if (this.hasFormError('startAfterEnd')) {
      return this.translationService.instant('products.balanceHistory.startPeriod.afterEndError');
    }
    return '';
  }

  getEndPeriodError(): string {
    if (this.hasError('endPeriod')) {
      return this.translationService.instant('products.balanceHistory.endPeriod.required');
    }
    if (this.hasFormError('endInFuture')) {
      return this.translationService.instant('products.balanceHistory.endPeriod.futureError');
    }
    return '';
  }
}
