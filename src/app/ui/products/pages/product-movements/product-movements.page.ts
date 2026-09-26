import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ViewWillEnter, ViewWillLeave, ToastController, AlertController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  listOutline,
  refreshOutline,
  trashOutline,
  arrowUpCircle,
  arrowDownCircle,
  informationCircle,
  chevronForwardOutline,
  calendarOutline,
  walletOutline,
  documentTextOutline
} from 'ionicons/icons';
import { ProductMovementUseCase } from '@core/domain/use-cases/product-movement.use-case';
import { ProductUseCase } from '@core/domain/use-cases/product.use-case';
import { ProductMovement } from '@core/domain/features/movements';
import { ProductListItem } from '@core/domain/features/products';
import { JBHError } from '@core/domain/models/jbh-error.model';
import { LoggerService } from '@core/infrastructure/logging/logger.service';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { HeaderActionsService } from '@core/infrastructure/header/header-actions.service';
import { SelectInterface, ViewportService } from '@core/infrastructure/viewport/viewport.service';
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
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    AppHeaderComponent,
    JbhDatePipe,
    JbhCurrencyPipe,
    JbhDisplayNamePipe,
    ProductSelectComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductMovementsPage implements OnInit, OnDestroy, ViewWillEnter, ViewWillLeave {
  products: ProductListItem[] = [];
  movements: ProductMovement[] = [];
  selectedProductId: string = '';
  isLoadingProducts = true;
  isLoadingMovements = false;
  selectInterface: SelectInterface = 'action-sheet';

  private destroy$ = new Subject<void>();

  constructor(
    private productMovementUseCase: ProductMovementUseCase,
    private productUseCase: ProductUseCase,
    private toastController: ToastController,
    private alertController: AlertController,
    private logger: LoggerService,
    private translationService: TranslationService,
    private headerActions: HeaderActionsService,
    private viewportService: ViewportService,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      listOutline,
      refreshOutline,
      trashOutline,
      arrowUpCircle,
      arrowDownCircle,
      informationCircle,
      chevronForwardOutline,
      calendarOutline,
      walletOutline,
      documentTextOutline
    });
  }

  ngOnInit(): void {
    this.selectInterface = this.viewportService.selectInterface;
    this.loadProducts();
  }

  ionViewWillEnter(): void {
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

  ionViewWillLeave(): void {
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
          this.showToast(errorMessage, 'danger');
        }
      });
  }

  refreshMovements(): void {
    if (this.selectedProductId) {
      this.loadMovements();
    }
  }

  async confirmDelete(movement: ProductMovement): Promise<void> {
    const alert = await this.alertController.create({
      header: this.translationService.instant('movements.delete.title'),
      message: this.translationService.instant('movements.delete.message', {
        description: movement.description || this.translationService.instant('movements.noDescription')
      }),
      buttons: [
        {
          text: this.translationService.instant('common.cancel'),
          role: 'cancel'
        },
        {
          text: this.translationService.instant('common.delete'),
          role: 'destructive',
          handler: () => this.deleteMovement(movement)
        }
      ]
    });

    await alert.present();
  }

  private deleteMovement(movement: ProductMovement): void {
    this.productMovementUseCase.deleteMovement(this.selectedProductId, movement.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showToast(
            this.translationService.instant('movements.delete.success'),
            'success'
          );
          this.loadMovements();
        },
        error: (error: JBHError) => {
          this.logger.error('Error deleting movement', 'ProductMovementsPage', error);
          this.cdr.markForCheck();
          const errorMessage = error.isValidationError
            ? error.message
            : this.translationService.instant('movements.errors.delete');
          this.showToast(errorMessage, 'danger');
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

  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color
    });
    await toast.present();
  }

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
