import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ProductListItem } from '@core/domain/models/product-list-item.model';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule]
})
export class ProductCardComponent {
  @Input({ required: true }) product!: ProductListItem;
  @Input() currency = 'USD';

  constructor(private translateService: TranslateService) {}

  get formattedCurrentBalance(): string {
    return this.formatCurrency(this.product.currentBalance);
  }

  get formattedMovementBalance(): string {
    return this.formatCurrency(this.product.movementBalance);
  }

  get formattedNetProfit(): string {
    const prefix = this.product.netProfitBalance > 0 ? '+' : '';
    return prefix + this.formatCurrency(this.product.netProfitBalance);
  }

  get formattedGrowthRate(): string {
    const prefix = this.product.netGrowthRate > 0 ? '+' : '';
    return prefix + this.product.netGrowthRate.toFixed(2) + '%';
  }

  get growthRateClass(): string {
    if (this.product.netGrowthRate > 0) return 'positive';
    if (this.product.netGrowthRate < 0) return 'negative';
    return 'neutral';
  }

  get growthIcon(): string {
    if (this.product.netGrowthRate > 0) return 'trending-up-outline';
    if (this.product.netGrowthRate < 0) return 'trending-down-outline';
    return 'remove-outline';
  }

  get profitClass(): string {
    if (this.product.isProfitable) return 'positive';
    if (this.product.isLoss) return 'negative';
    return '';
  }

  get productTypeLabel(): string {
    return this.translateService.instant(`products.types.${this.product.type}`);
  }

  get relativeUpdatedTime(): string {
    const now = new Date();
    const diff = now.getTime() - this.product.updatedAt.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return this.product.updatedAt.toLocaleDateString();
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    }
    return 'Just now';
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
