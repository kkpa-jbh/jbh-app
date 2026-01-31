import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule, ViewWillEnter, ToastController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { ProductUseCase } from '@core/domain/use-cases/product.use-case';
import { ProductListItem } from '@core/domain/models/product-list-item.model';
import { LoggerService } from '@core/infrastructure/logging/logger.service';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { ProductCardComponent } from '../../components/product-card/product-card.component';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.page.html',
  styleUrls: ['./overview.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule,
    ProductCardComponent
  ]
})
export class OverviewPage implements OnInit, OnDestroy, ViewWillEnter {
  products: ProductListItem[] = [];
  isLoading = true;
  private destroy$ = new Subject<void>();

  constructor(
    private productUseCase: ProductUseCase,
    private router: Router,
    private toastController: ToastController,
    private logger: LoggerService,
    private translationService: TranslationService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  ionViewWillEnter(): void {
    this.refreshProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProducts(): void {
    this.isLoading = true;
    this.productUseCase.getProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.products = products;
          this.isLoading = false;
        },
        error: (error) => {
          this.logger.error('Error loading products', 'OverviewPage', error);
          this.isLoading = false;
          this.showToast(
            this.translationService.instant('products.overview.errors.load'),
            'danger'
          );
        }
      });
  }

  refreshProducts(): void {
    this.isLoading = true;
    this.productUseCase.refreshProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.products = products;
          this.isLoading = false;
        },
        error: (error) => {
          this.logger.error('Error refreshing products', 'OverviewPage', error);
          this.isLoading = false;
          this.showToast(
            this.translationService.instant('products.overview.errors.load'),
            'danger'
          );
        }
      });
  }

  navigateToCreate(): void {
    this.router.navigate(['/products/create']);
  }

  trackByProductId(index: number, product: ProductListItem): string {
    return product.id;
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color
    });
    await toast.present();
  }
}
