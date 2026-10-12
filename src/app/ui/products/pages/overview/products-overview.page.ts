import { Component, OnInit, OnDestroy, ViewChildren, QueryList, ChangeDetectorRef, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { ProductUseCase } from '@core/domain/use-cases/product.use-case';
import { ProductListItem } from '@core/domain/features/products';
import { JBHError } from '@core/domain/models/jbh-error.model';
import { LoggerService } from '@core/infrastructure/logging/logger.service';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { PortfolioContextService } from '@core/infrastructure/context/portfolio-context.service';
import { HeaderActionsService } from '@core/infrastructure/header/header-actions.service';
import {
  JbhButtonComponent,
  JbhEmptyStateComponent,
  JbhPageHeaderComponent,
  JbhSkeletonComponent
} from '@design-system/components';
import { DialogService, JbhPageComponent, ToastService } from '@design-system/platform';
import { AppHeaderComponent } from '@shared/components/app-header/app-header.component';

@Component({
  selector: 'app-products-overview',
  templateUrl: './products-overview.page.html',
  styleUrls: ['./products-overview.page.scss'],
  standalone: true,
  imports: [
    TranslateModule,
    JbhButtonComponent,
    JbhEmptyStateComponent,
    JbhPageComponent,
    JbhPageHeaderComponent,
    JbhSkeletonComponent,
    ProductCardComponent,
    AppHeaderComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsOverviewPage implements OnInit, OnDestroy {
  @ViewChildren(ProductCardComponent) productCards!: QueryList<ProductCardComponent>;

  products: ProductListItem[] = [];
  isLoading = true;
  isPersonalContext = true;
  private destroy$ = new Subject<void>();

  private readonly productUseCase = inject(ProductUseCase);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(DialogService);
  private readonly logger = inject(LoggerService);
  private readonly translationService = inject(TranslationService);
  private readonly portfolioContext = inject(PortfolioContextService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly headerActions = inject(HeaderActionsService);

  currentContext$ = this.portfolioContext.context$;

  ngOnInit(): void {
    this.loadProducts();

    this.currentContext$
      .pipe(takeUntil(this.destroy$))
      .subscribe(context => {
        this.isPersonalContext = context.isPersonal;
        this.cdr.markForCheck();
      });
  }

  onPageEnter(): void {
    this.headerActions.setPageConfig({
      title: 'products.overview.title',
      actions: [
        {
          id: 'refresh',
          icon: 'refresh-outline',
          handler: () => this.refreshProducts()
        }
      ]
    });
    this.refreshProducts();
  }

  onPageLeave(): void {
    this.headerActions.clearPageConfig();
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
          this.toast.show(this.translationService.instant('products.overview.errors.load'), 'error');
          this.cdr.markForCheck();
        }
      });
  }

  refreshProducts(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
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
          this.toast.show(this.translationService.instant('products.overview.errors.load'), 'error');
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
    const confirmed = await this.dialog.confirm({
      title: this.translationService.instant('products.deleteProduct.title'),
      message: this.translationService.instant('products.deleteProduct.message', { name: product.name }),
      confirmText: this.translationService.instant('common.delete'),
      cancelText: this.translationService.instant('common.cancel'),
      destructive: true
    });
    if (confirmed) {
      this.deleteProduct(product);
    }
  }

  private deleteProduct(product: ProductListItem): void {
    this.productUseCase.deleteProduct(product.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.show(this.translationService.instant('products.deleteProduct.success'), 'success');
          this.refreshProducts();
        },
        error: (error: JBHError) => {
          this.logger.error('Error deleting product:', 'ProductsOverviewPage', error);
          const errorMessage = error.isValidationError
            ? error.message
            : this.translationService.instant('products.deleteProduct.error');
          this.toast.show(errorMessage, 'error');
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
          this.toast.show(errorMessage, 'error');
        }
      });
  }
}
