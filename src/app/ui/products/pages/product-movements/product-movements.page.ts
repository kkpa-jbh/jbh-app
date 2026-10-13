import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { ProductMovementUseCase } from '@core/domain/use-cases/product-movement.use-case';
import { ProductUseCase } from '@core/domain/use-cases/product.use-case';
import { ProductMovement } from '@core/domain/features/movements';
import { ProductListItem } from '@core/domain/features/products';
import { JBHError } from '@core/domain/models/jbh-error.model';
import { LoggerService } from '@core/infrastructure/logging/logger.service';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { HeaderActionsService } from '@core/infrastructure/header/header-actions.service';
import {
  JbhCardComponent,
  JbhEmptyStateComponent,
  JbhIconButtonComponent,
  JbhIconComponent,
  JbhPageHeaderComponent,
  JbhSkeletonComponent,
  JbhTableCardDirective,
  JbhTableCellComponent,
  JbhTableComponent,
  JbhTableHeadDirective,
  JbhTableRowComponent,
  JbhTableRowDirective
} from '@design-system/components';
import { DialogService, JbhPageComponent, ToastService } from '@design-system/platform';
import { AppHeaderComponent } from '@shared/components/app-header/app-header.component';
import { JbhDatePipe } from '@shared/pipes/jbh-date.pipe';
import { JbhCurrencyPipe } from '@shared/pipes/jbh-currency.pipe';
import { JbhDisplayNamePipe } from '@shared/pipes/jbh-display-name.pipe';
import { ProductSelectComponent } from '@shared/components/product-select/product-select.component';

@Component({
  selector: 'app-product-movements',
  templateUrl: './product-movements.page.html',
  styleUrls: ['./product-movements.page.scss'],
  standalone: true,
  imports: [
    NgClass,
    FormsModule,
    TranslateModule,
    AppHeaderComponent,
    JbhDatePipe,
    JbhCurrencyPipe,
    JbhDisplayNamePipe,
    ProductSelectComponent,
    JbhCardComponent,
    JbhEmptyStateComponent,
    JbhIconButtonComponent,
    JbhIconComponent,
    JbhPageComponent,
    JbhPageHeaderComponent,
    JbhSkeletonComponent,
    JbhTableCardDirective,
    JbhTableCellComponent,
    JbhTableComponent,
    JbhTableHeadDirective,
    JbhTableRowComponent,
    JbhTableRowDirective
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductMovementsPage implements OnInit, OnDestroy {
  products: ProductListItem[] = [];
  movements: ProductMovement[] = [];
  selectedProductId: string = '';
  isLoadingProducts = true;
  isLoadingMovements = false;

  private destroy$ = new Subject<void>();

  private readonly productMovementUseCase = inject(ProductMovementUseCase);
  private readonly productUseCase = inject(ProductUseCase);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(DialogService);
  private readonly logger = inject(LoggerService);
  private readonly translationService = inject(TranslationService);
  private readonly headerActions = inject(HeaderActionsService);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadProducts();
  }

  onPageEnter(): void {
    this.headerActions.setPageConfig({
      title: 'movements.title',
      actions: [
        {
          id: 'refresh',
          icon: 'refresh-outline',
          handler: () => this.refreshMovements()
        }
      ]
    });
  }

  onPageLeave(): void {
    this.headerActions.clearPageConfig();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProducts(): void {
    this.isLoadingProducts = true;
    this.cdr.markForCheck();

    this.productUseCase.getProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.products = products;
          this.isLoadingProducts = false;
          this.cdr.markForCheck();
          if (this.products.length === 1) {
            this.selectedProductId = this.products[0].id;
            this.loadMovements();
          }
        },
        error: (error: JBHError) => {
          this.logger.error('Error loading products', 'ProductMovementsPage', error);
          this.isLoadingProducts = false;
          this.cdr.markForCheck();
        }
      });
  }

  onProductChange(): void {
    if (this.selectedProductId) {
      this.loadMovements();
    } else {
      this.movements = [];
      this.cdr.markForCheck();
    }
  }

  private loadMovements(): void {
    if (!this.selectedProductId) return;

    this.isLoadingMovements = true;
    this.movements = [];
    this.cdr.markForCheck();

    this.productMovementUseCase.getMovementsByProduct(this.selectedProductId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (movements) => {
          this.movements = movements.sort((a, b) =>
            new Date(b.movementDate).getTime() - new Date(a.movementDate).getTime()
          );
          this.isLoadingMovements = false;
          this.cdr.markForCheck();
        },
        error: (error: JBHError) => {
          this.logger.error('Error loading movements', 'ProductMovementsPage', error);
          this.isLoadingMovements = false;
          this.cdr.markForCheck();

          const errorMessage = error.isValidationError
            ? error.message
            : this.translationService.instant('movements.errors.load');
          this.toast.show(errorMessage, 'error');
        }
      });
  }

  refreshMovements(): void {
    if (this.selectedProductId) {
      this.loadMovements();
    }
  }

  async confirmDelete(movement: ProductMovement): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: this.translationService.instant('movements.delete.title'),
      message: this.translationService.instant('movements.delete.message', {
        description: movement.description || this.translationService.instant('movements.noDescription')
      }),
      confirmText: this.translationService.instant('common.delete'),
      cancelText: this.translationService.instant('common.cancel'),
      destructive: true
    });
    if (confirmed) {
      this.deleteMovement(movement);
    }
  }

  private deleteMovement(movement: ProductMovement): void {
    this.productMovementUseCase.deleteMovement(this.selectedProductId, movement.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.show(this.translationService.instant('movements.delete.success'), 'success');
          this.loadMovements();
        },
        error: (error: JBHError) => {
          this.logger.error('Error deleting movement', 'ProductMovementsPage', error);
          this.cdr.markForCheck();
          const errorMessage = error.isValidationError
            ? error.message
            : this.translationService.instant('movements.errors.delete');
          this.toast.show(errorMessage, 'error');
        }
      });
  }

  getMovementTypeClass(movement: ProductMovement): string {
    if (movement.isDeposit) return 'deposit';
    if (movement.isWithdrawal) return 'withdrawal';
    return 'snapshot';
  }

  getMovementIcon(movement: ProductMovement): string {
    if (movement.isDeposit) return 'arrow-up-circle';
    if (movement.isWithdrawal) return 'arrow-down-circle';
    return 'information-circle';
  }

  trackByMovement = (_index: number, movement: ProductMovement): string => movement.id;

  get hasSelectedProduct(): boolean {
    return !!this.selectedProductId;
  }

  get hasMovements(): boolean {
    return this.movements.length > 0;
  }

  get showEmptyState(): boolean {
    return !this.isLoadingMovements && this.hasSelectedProduct && !this.hasMovements;
  }
}
