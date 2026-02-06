import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { IonicModule, ToastController, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  arrowDownOutline,
  arrowUpOutline,
  calendarOutline,
  cashOutline,
  close,
  documentTextOutline,
  pricetagOutline,
  saveOutline,
  syncOutline,
  walletOutline
} from 'ionicons/icons';
import { ProductUseCase } from '@core/domain/use-cases/product.use-case';
import { CategoryUseCase } from '@core/domain/use-cases/category.use-case';
import { PreferencesUseCase } from '@core/domain/use-cases/preferences.use-case';
import { ProductListItem } from '@core/domain/models/product-list-item.model';
import { Category } from '@core/domain/models/category.model';
import { MovementType, AddMovementRequest } from '@core/domain/models/movement.model';
import { JBHError } from '@core/domain/models/jbh-error.model';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { LoggerService } from '@core/infrastructure/logging/logger.service';
import { ViewportService, SelectInterface } from '@core/infrastructure/viewport/viewport.service';
import { HeaderActionsService } from '@core/infrastructure/header/header-actions.service';
import { DecimalFormatDirective } from '@shared/directives';
import { JbhTranslationKeyPipe } from '@shared/pipes';
import { AppHeaderComponent } from '@shared/components/app-header/app-header.component';

@Component({
  selector: 'app-add-movement',
  templateUrl: './add-movement.page.html',
  styleUrls: ['./add-movement.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    TranslateModule,
    DecimalFormatDirective,
    JbhTranslationKeyPipe,
    AppHeaderComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddMovementPage implements OnInit, OnDestroy, ViewWillEnter, ViewWillLeave {

  movementForm!: FormGroup;
  product: ProductListItem | null = null;
  products: ProductListItem[] = [];
  categories: Category[] = [];

  isLoading = true;
  isLoadingProducts = false;
  isLoadingCategories = false;
  isSubmitting = false;
  hasProductIdFromRoute = false;

  movementTypes: { value: MovementType; labelKey: string; icon: string }[] = [
    { value: 'DEPOSIT', labelKey: 'products.addMovement.types.deposit', icon: 'arrow-down-outline' },
    { value: 'WITHDRAWAL', labelKey: 'products.addMovement.types.withdrawal', icon: 'arrow-up-outline' },
    { value: 'BALANCE_SNAPSHOT', labelKey: 'products.addMovement.types.balanceSnapshot', icon: 'sync-outline' }
  ];

  selectInterface: SelectInterface = 'action-sheet';

  private productId: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private productUseCase: ProductUseCase,
    private categoryUseCase: CategoryUseCase,
    private preferencesUseCase: PreferencesUseCase,
    private translationService: TranslationService,
    private toastController: ToastController,
    private logger: LoggerService,
    private viewportService: ViewportService,
    private cdr: ChangeDetectorRef,
    private headerActions: HeaderActionsService
  ) {
    this.selectInterface = this.viewportService.selectInterface;
    addIcons({
      alertCircleOutline,
      arrowDownOutline,
      arrowUpOutline,
      calendarOutline,
      cashOutline,
      close,
      documentTextOutline,
      pricetagOutline,
      saveOutline,
      syncOutline,
      walletOutline
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.subscribeToMovementTypeChanges();
    this.subscribeToProductChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ionViewWillEnter(): void {
    this.headerActions.setPageConfig({
      title: 'products.addMovement.title'
    });
    this.productId = this.route.snapshot.paramMap.get('productId');
    if (this.productId) {
      this.hasProductIdFromRoute = true;
      this.movementForm.get('productId')?.setValue(this.productId);
      this.loadProduct(this.productId);
    } else {
      this.hasProductIdFromRoute = false;
      this.loadProductsWithDefaultSelection();
      this.isLoading = false;
    }
  }

  ionViewWillLeave(): void {
    this.headerActions.clearPageConfig();
  }

  private initForm(): void {
    const today = new Date().toISOString().split('T')[0];
    this.movementForm = this.formBuilder.group({
      productId: ['', [Validators.required]],
      movementType: ['DEPOSIT', [Validators.required]],
      entryDate: [today, [Validators.required]],
      totalAmount: [null],
      categoryName: [''],
      balanceSnapshot: [null],
      description: ['', [Validators.maxLength(500)]]
    });
  }

  private subscribeToMovementTypeChanges(): void {
    this.movementForm.get('movementType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((type: MovementType) => {
        this.onMovementTypeChange(type);
      });
  }

  private subscribeToProductChanges(): void {
    this.movementForm.get('productId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((productId: string) => {
        if (productId && !this.hasProductIdFromRoute) {
          this.loadProduct(productId);
        }
      });
  }

  private onMovementTypeChange(type: MovementType): void {
    const totalAmountControl = this.movementForm.get('totalAmount');
    const categoryNameControl = this.movementForm.get('categoryName');
    const balanceSnapshotControl = this.movementForm.get('balanceSnapshot');

    totalAmountControl?.clearValidators();
    categoryNameControl?.clearValidators();
    balanceSnapshotControl?.clearValidators();

    if (type === 'BALANCE_SNAPSHOT') {
      balanceSnapshotControl?.setValidators([Validators.required, Validators.min(0)]);
      totalAmountControl?.setValue(null);
      categoryNameControl?.setValue('');
      this.categories = [];
    } else {
      totalAmountControl?.setValidators([Validators.required, Validators.min(0.01)]);
      categoryNameControl?.setValidators([Validators.required]);
      balanceSnapshotControl?.setValue(null);
      this.loadCategories(type);
    }

    totalAmountControl?.updateValueAndValidity();
    categoryNameControl?.updateValueAndValidity();
    balanceSnapshotControl?.updateValueAndValidity();
  }

  private loadProductsWithDefaultSelection(): void {
    this.preferencesUseCase.getPreferences()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (preferences) => {
          if (preferences.defaultProductId) {
            this.movementForm.get('productId')?.setValue(preferences.defaultProductId);
          }
          this.loadProducts();
        },
        error: (error) => {
          this.logger.error('Error loading preferences:', 'AddMovementPage', error);
          this.loadProducts();
        }
      });
  }

  private loadProducts(): void {
    this.isLoadingProducts = true;
    this.movementForm.get('productId')?.disable();
    this.cdr.markForCheck();
    this.productUseCase.getProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.products = products.filter(p => p.allowsMovements);
          this.isLoadingProducts = false;
          this.movementForm.get('productId')?.enable();
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.logger.error('Error loading products:', 'AddMovementPage', error);
          this.isLoadingProducts = false;
          this.movementForm.get('productId')?.enable();
          this.showToast(this.translationService.instant('products.addMovement.errors.loadProducts'), 'danger');
          this.cdr.markForCheck();
        }
      });
  }

  private loadProduct(productId: string): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.productUseCase.getProductById(productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (product) => {
          this.product = product;
          this.isLoading = false;
          this.cdr.markForCheck();
          if (!product.allowsMovements) {
            this.showToast(this.translationService.instant('products.addMovement.errors.notAllowed'), 'danger');
            this.router.navigate(['/portfolio/overview']);
            return;
          }
          const currentType = this.movementForm.get('movementType')?.value as MovementType;
          if (currentType !== 'BALANCE_SNAPSHOT') {
            this.loadCategories(currentType);
          }
        },
        error: (error) => {
          this.logger.error('Error loading product:', 'AddMovementPage', error);
          this.isLoading = false;
          this.showToast(this.translationService.instant('products.addMovement.errors.loadProduct'), 'danger');
          this.router.navigate(['/portfolio/overview']);
          this.cdr.markForCheck();
        }
      });
  }

  private loadCategories(type: MovementType): void {
    this.isLoadingCategories = true;
    this.movementForm.get('categoryName')?.disable();
    this.cdr.markForCheck();

    const categoryObservable = type === 'DEPOSIT'
      ? this.categoryUseCase.getIncomeCategories()
      : this.categoryUseCase.getExpenseCategories();

    categoryObservable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
          this.isLoadingCategories = false;
          this.movementForm.get('categoryName')?.enable();
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.logger.error('Error loading categories:', 'AddMovementPage', error);
          this.isLoadingCategories = false;
          this.movementForm.get('categoryName')?.enable();
          this.showToast(this.translationService.instant('products.addMovement.errors.loadCategories'), 'danger');
          this.cdr.markForCheck();
        }
      });
  }

  getMovementTypeLabel(type: { value: MovementType; labelKey: string }): string {
    return this.translationService.instant(type.labelKey);
  }

  onSubmit(): void {
    if (this.movementForm.invalid) {
      this.markFormGroupTouched(this.movementForm);
      return;
    }

    const formData = this.movementForm.value;
    const selectedProductId = formData.productId;

    if (!selectedProductId) {
      return;
    }

    this.isSubmitting = true;

    const request: AddMovementRequest = {
      entryDate: formData.entryDate,
      movementType: formData.movementType
    };

    if (formData.movementType === 'BALANCE_SNAPSHOT') {
      request.balanceSnapshot = formData.balanceSnapshot;
    } else {
      request.totalAmount = formData.totalAmount;
      request.categoryName = formData.categoryName;
    }

    if (formData.description?.trim()) {
      request.description = formData.description.trim();
    }

    this.productUseCase.addMovement(selectedProductId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async () => {
          this.isSubmitting = false;
          await this.showToast(this.translationService.instant('products.addMovement.success'), 'success');
          this.router.navigate(['/portfolio/overview']);
        },
        error: async (error: JBHError) => {
          this.logger.error('Error adding movement:', 'AddMovementPage', error);
          this.isSubmitting = false;
          const errorMessage = error.isValidationError
            ? error.message
            : this.translationService.instant('products.addMovement.errors.create');
          await this.showToast(errorMessage, 'danger');
        }
      });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.movementForm.get(fieldName);
    if (!field) return false;

    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.movementForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.hasError('required')) {
      return this.translationService.instant('products.addMovement.validation.required');
    }
    if (field.hasError('min')) {
      const minValue = field.errors['min'].min;
      return this.translationService.instant('products.addMovement.validation.min', { min: minValue });
    }
    if (field.hasError('maxlength')) {
      const maxLength = field.errors['maxlength'].requiredLength;
      return this.translationService.instant('products.addMovement.validation.maxLength', { max: maxLength });
    }
    return this.translationService.instant('validation.pattern');
  }

  isBalanceSnapshot(): boolean {
    return this.movementForm.get('movementType')?.value === 'BALANCE_SNAPSHOT';
  }

  get maxDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
      buttons: [
        {
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }
}
