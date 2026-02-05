import { Component, Input, Output, EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { JbhCurrencyPipe, JbhProfitPipe, JbhGrowthPipe, JbhRelativeTimePipe } from '@shared/pipes';
import {
  createOutline,
  trashOutline,
  walletOutline,
  homeOutline,
  cashOutline,
  cardOutline,
  trendingUpOutline,
  trendingDownOutline,
  timeOutline,
  cubeOutline,
  checkmarkCircleOutline,
  removeOutline,
  analyticsOutline,
  addCircleOutline
} from 'ionicons/icons';
import { ProductListItem } from '@core/domain/models/product-list-item.model';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule, JbhCurrencyPipe, JbhProfitPipe, JbhGrowthPipe, JbhRelativeTimePipe],
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

  constructor(private cdr: ChangeDetectorRef) {
    addIcons({
      createOutline,
      trashOutline,
      walletOutline,
      homeOutline,
      cashOutline,
      cardOutline,
      trendingUpOutline,
      trendingDownOutline,
      timeOutline,
      cubeOutline,
      checkmarkCircleOutline,
      removeOutline,
      analyticsOutline,
      addCircleOutline
    });
  }

  onEdit(event: Event): void {
    event.stopPropagation();
    this.edit.emit();
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.delete.emit();
  }

  onStatusToggle(event: Event): void {
    event.stopPropagation();
    const customEvent = event as CustomEvent;
    const newStatus = customEvent.detail.checked;
    this.statusChange.emit(newStatus);
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
