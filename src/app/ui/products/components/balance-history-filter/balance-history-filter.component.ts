import { Component, OnInit, Output, EventEmitter, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { calendarOutline, cubeOutline, searchOutline } from 'ionicons/icons';
import { ProductListItem } from '@core/domain/features/products';
import { MonthlyBalanceRequest } from '@core/domain/features/balance-history';
import { ViewportService, SelectInterface } from '@core/infrastructure/viewport/viewport.service';
import { JbhDatePipe } from '@shared/pipes';

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
  imports: [CommonModule, IonicModule, ReactiveFormsModule, TranslateModule]
})
export class BalanceHistoryFilterComponent implements OnInit {
  @Input() products: ProductListItem[] = [];
  @Input() initialProductId: string | null = null;
  @Output() filterApplied = new EventEmitter<BalanceFilterEvent>();

  filterForm!: FormGroup;
  maxDate: string;
  minStartDate: string;
  selectInterface: SelectInterface = 'action-sheet';

  constructor(
    private fb: FormBuilder,
    private viewportService: ViewportService
  ) {
    addIcons({ calendarOutline, cubeOutline, searchOutline });
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    this.maxDate = JbhDatePipe.toPeriod(date);
    this.minStartDate = '2020-01';
    this.selectInterface = this.viewportService.selectInterface;
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    const now = new Date();
    const lastMonth = new Date(now);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const endPeriod = JbhDatePipe.toPeriod(lastMonth);

    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    const startPeriod = JbhDatePipe.toPeriod(sixMonthsAgo);

    this.filterForm = this.fb.group({
      productId: [this.initialProductId || ''],
      startPeriod: [startPeriod, [Validators.required]],
      endPeriod: [endPeriod, [Validators.required]]
    }, { validators: this.dateRangeValidator.bind(this) });
  }

  private dateRangeValidator(group: FormGroup): { [key: string]: boolean } | null {
    const startRaw = group.get('startPeriod')?.value;
    const endRaw = group.get('endPeriod')?.value;

    const start = startRaw ? JbhDatePipe.normalizePeriod(startRaw) : null;
    const end = endRaw ? JbhDatePipe.normalizePeriod(endRaw) : null;

    if (start && end && start > end) {
      return { startAfterEnd: true };
    }

    const maxPeriod = JbhDatePipe.toPeriod(new Date());
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
          startPeriod: JbhDatePipe.normalizePeriod(formValue.startPeriod),
          endPeriod: JbhDatePipe.normalizePeriod(formValue.endPeriod)
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

  formatPeriodDisplay(period: string): string {
    return JbhDatePipe.formatPeriod(period);
  }
}
