import { Component, Input, Output, EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { JbhCurrencyPipe, JbhProfitPipe, JbhGrowthPipe, JbhRelativeTimePipe } from '@shared/pipes';
import { ProductListItem } from '@core/domain/features/products';
import { JbhIconButtonComponent, JbhIconComponent, JbhSpinnerComponent, JbhToggleComponent } from '@design-system/components';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    TranslateModule,
    JbhCurrencyPipe,
    JbhProfitPipe,
    JbhGrowthPipe,
    JbhRelativeTimePipe,
    JbhIconComponent,
    JbhIconButtonComponent,
    JbhSpinnerComponent,
    JbhToggleComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductCardComponent {
  @Input({ required: true }) product!: ProductListItem;
  @Input() currency = 'USD';
  @Input() showActions = true;
  @Output() edit = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() statusChange = new EventEmitter<boolean>();
  @Output() viewHistory = new EventEmitter<void>();
  @Output() addMovement = new EventEmitter<void>();

  isTogglingStatus = false;

  private readonly cdr = inject(ChangeDetectorRef);

  onEdit(event: Event): void {
    event.stopPropagation();
    this.edit.emit();
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.delete.emit();
  }

  onStatusToggle(checked: boolean): void {
    this.statusChange.emit(checked);
  }

  onViewHistory(event: Event): void {
    event.stopPropagation();
    this.viewHistory.emit();
  }

  onAddMovement(event: Event): void {
    event.stopPropagation();
    this.addMovement.emit();
  }

  setTogglingStatus(value: boolean): void {
    this.isTogglingStatus = value;
    this.cdr.markForCheck();
  }

  getGrowthRateClass(): string {
    if (this.product.netGrowthRate > 0) return 'positive';
    if (this.product.netGrowthRate < 0) return 'negative';
    return 'neutral';
  }

  getGrowthIcon(): string {
    if (this.product.netGrowthRate > 0) return 'trending-up-outline';
    if (this.product.netGrowthRate < 0) return 'trending-down-outline';
    return 'remove-outline';
  }

  getProfitClass(): string {
    if (this.product.isProfitable) return 'positive';
    if (this.product.isLoss) return 'negative';
    return '';
  }
}
