import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { calendarOutline, cubeOutline, searchOutline } from 'ionicons/icons';
import { ProductListItem } from '@core/domain/models/product-list-item.model';
import { MonthlyBalanceRequest } from '@core/domain/models/monthly-balance.model';

export interface BalanceFilterEvent {
  productId: string | null;
  request: MonthlyBalanceRequest;
}

@Component({
  selector: 'app-balance-history-filter',
  templateUrl: './balance-history-filter.component.html',
  styleUrls: ['./balance-history-filter.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, TranslateModule]
})
export class BalanceHistoryFilterComponent implements OnInit {
  @Input() products: ProductListItem[] = [];
  @Input() initialProductId: string | null = null;
  @Output() filterApplied = new EventEmitter<BalanceFilterEvent>();

  filterForm!: FormGroup;
  maxDate: string;
  minStartDate: string;

  constructor(private fb: FormBuilder) {
    addIcons({ calendarOutline, cubeOutline, searchOutline });

    const now = new Date();
    this.maxDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.minStartDate = '2020-01';
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    const now = new Date();
    const endPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    const startPeriod = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}`;

    this.filterForm = this.fb.group({
      productId: [this.initialProductId || ''],
      startPeriod: [startPeriod, [Validators.required]],
      endPeriod: [endPeriod, [Validators.required]]
    }, { validators: this.dateRangeValidator.bind(this) });
  }

  private dateRangeValidator(group: FormGroup): { [key: string]: boolean } | null {
    const start = group.get('startPeriod')?.value;
    const end = group.get('endPeriod')?.value;

    if (start && end && start > end) {
      return { startAfterEnd: true };
    }

    const now = new Date();
    const maxPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
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
          startPeriod: formValue.startPeriod,
          endPeriod: formValue.endPeriod
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
    if (!period) return '';
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
}
