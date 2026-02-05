import { Component, OnInit, OnDestroy, ViewChildren, QueryList, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule, ViewWillEnter, ViewWillLeave, ToastController, AlertController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { addIcons } from 'ionicons';
import { refreshOutline, walletOutline, addOutline } from 'ionicons/icons';
import { ProductUseCase } from '@core/domain/use-cases/product.use-case';
import { ProductListItem } from '@core/domain/models/product-list-item.model';
import { JBHError } from '@core/domain/models/jbh-error.model';
import { LoggerService } from '@core/infrastructure/logging/logger.service';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { PortfolioContextService } from '@core/infrastructure/context/portfolio-context.service';

@Component({
  selector: 'app-products-overview',
  templateUrl: './products-overview.page.html',
  styleUrls: ['./products-overview.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule,
    ProductCardComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsOverviewPage implements OnInit, OnDestroy, ViewWillEnter, ViewWillLeave {
  @ViewChildren(ProductCardComponent) productCards!: QueryList<ProductCardComponent>;

  products: ProductListItem[] = [];
  isLoading = true;
  currentContext$ = this.portfolioContext.context$;
  isPersonalContext = true;
  private destroy$ = new Subject<void>();

  constructor(
    private productUseCase: ProductUseCase,
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController,
    private logger: LoggerService,
    private translationService: TranslationService,
    private portfolioContext: PortfolioContextService,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({ refreshOutline, walletOutline, addOutline });
  }

  ngOnInit(): void {
    this.loadProducts();

    this.currentContext$
      .pipe(takeUntil(this.destroy$))
      .subscribe(context => {
        this.isPersonalContext = context.isPersonal;
        this.cdr.markForCheck();
      });
  }

  ionViewWillEnter(): void {
    this.refreshProducts();
  }

  ionViewWillLeave(): void {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.blur) {
      activeElement.blur();
    }
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
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.logger.error('Error loading products', 'ProductsOverviewPage', error);
          this.isLoading = false;
          this.showToast(
            this.translationService.instant('products.overview.errors.load'),
            'danger'
          );
          this.cdr.markForCheck();
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
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.logger.error('Error refreshing products', 'ProductsOverviewPage', error);
          this.isLoading = false;
          this.showToast(
            this.translationService.instant('products.overview.errors.load'),
            'danger'
          );
          this.cdr.markForCheck();
        }
      });
  }

  canModifyProducts(): boolean {
    return this.isPersonalContext;
  }

  navigateToCreate(): void {
    if (this.canModifyProducts()) {
      this.router.navigate(['/portfolio/create']);
    }
  }

  navigateToEdit(product: ProductListItem): void {
    if (this.canModifyProducts()) {
      this.router.navigate(['/portfolio/edit', product.id]);
    }
  }

  navigateToBalanceHistory(product: ProductListItem): void {
    this.router.navigate(['/reports/balance-trends'], { queryParams: { productId: product.id } });
  }

  navigateToAddMovement(product: ProductListItem): void {
    if (this.canModifyProducts()) {
      this.router.navigate(['/transactions/record-movement', product.id]);
    }
  }

  async confirmDeleteProduct(product: ProductListItem): Promise<void> {
    const alert = await this.alertController.create({
      header: this.translationService.instant('products.deleteProduct.title'),
      message: this.translationService.instant('products.deleteProduct.message', { name: product.name }),
      buttons: [
        {
          text: this.translationService.instant('common.cancel'),
          role: 'cancel'
        },
        {
          text: this.translationService.instant('common.delete'),
          role: 'destructive',
          handler: () => this.deleteProduct(product)
        }
      ]
    });
    await alert.present();
  }

  private deleteProduct(product: ProductListItem): void {
    this.productUseCase.deleteProduct(product.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showToast(
            this.translationService.instant('products.deleteProduct.success'),
            'success'
          );
          this.refreshProducts();
        },
        error: (error: JBHError) => {
          this.logger.error('Error deleting product:', 'ProductsOverviewPage', error);
          const errorMessage = error.isValidationError
            ? error.message
            : this.translationService.instant('products.deleteProduct.error');
          this.showToast(errorMessage, 'danger');
        }
      });
  }

  onStatusChange(product: ProductListItem, newStatus: boolean): void {
    const cardComponent = this.productCards.find(
      card => card.product.id === product.id
    );

    if (cardComponent) {
      cardComponent.setTogglingStatus(true);
    }

    this.productUseCase.updateProductStatus(product.id, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const index = this.products.findIndex(p => p.id === product.id);
          if (index !== -1) {
            this.products[index] = new ProductListItem(
              product.id,
              product.name,
              product.type,
              product.userId,
              product.movementBalance,
              product.currentBalance,
              product.netProfitBalance,
              newStatus,
              product.createdAt,
              product.updatedAt,
              product.netGrowthRate,
              product.metadata
            );
            this.products = [...this.products];
          }
          if (cardComponent) {
            cardComponent.setTogglingStatus(false);
          }
          this.cdr.markForCheck();
        },
        error: (error: JBHError) => {
          this.logger.error('Error updating product status:', 'ProductsOverviewPage', error);
          if (cardComponent) {
            cardComponent.setTogglingStatus(false);
          }
          const errorMessage = error.isValidationError
            ? error.message
            : this.translationService.instant('products.card.status.error');
          this.showToast(errorMessage, 'danger');
        }
      });
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
