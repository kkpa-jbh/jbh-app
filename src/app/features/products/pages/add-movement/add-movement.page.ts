import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { IonicModule, ToastController, ViewWillEnter } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  cashOutline,
  calendarOutline,
  pricetagOutline,
  saveOutline,
  close,
  walletOutline,
  arrowDownOutline,
  arrowUpOutline,
  syncOutline
} from 'ionicons/icons';
import { ProductUseCase } from '@core/domain/use-cases/product.use-case';
import { CategoryUseCase } from '@core/domain/use-cases/category.use-case';
import { ProductListItem } from '@core/domain/models/product-list-item.model';
import { Category } from '@core/domain/models/category.model';
import { MovementType, AddMovementRequest } from '@core/domain/models/movement.model';
import { JBHError } from '@core/domain/models/jbh-error.model';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { LoggerService } from '@core/infrastructure/logging/logger.service';
import { DecimalFormatDirective } from '@shared/directives';
import { JbhTranslationKeyPipe } from '@shared/pipes';

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
    JbhTranslationKeyPipe
  ]
})
export class AddMovementPage implements OnInit, OnDestroy, ViewWillEnter {

  movementForm!: FormGroup;
  product: ProductListItem | null = null;
  categories: Category[] = [];

  isLoading = true;
  isLoadingCategories = false;
  isSubmitting = false;

  movementTypes: { value: MovementType; labelKey: string; icon: string }[] = [
    { value: 'DEPOSIT', labelKey: 'products.addMovement.types.deposit', icon: 'arrow-down-outline' },
    { value: 'WITHDRAWAL', labelKey: 'products.addMovement.types.withdrawal', icon: 'arrow-up-outline' },
    { value: 'BALANCE_SNAPSHOT', labelKey: 'products.addMovement.types.balanceSnapshot', icon: 'sync-outline' }
  ];

  private productId: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private productUseCase: ProductUseCase,
    private categoryUseCase: CategoryUseCase,
    private translationService: TranslationService,
    private toastController: ToastController,
    private logger: LoggerService
  ) {
    addIcons({
      cashOutline,
      calendarOutline,
      pricetagOutline,
      saveOutline,
      close,
      walletOutline,
      arrowDownOutline,
      arrowUpOutline,
      syncOutline
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.subscribeToMovementTypeChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ionViewWillEnter(): void {
    this.productId = this.route.snapshot.paramMap.get('productId');
    if (this.productId) {
      this.loadProduct(this.productId);
    } else {
      this.showToast(this.translationService.instant('products.addMovement.errors.noProduct'), 'danger');
      this.router.navigate(['/products/overview']);
    }
  }

  private initForm(): void {
    const today = new Date().toISOString().split('T')[0];
    this.movementForm = this.formBuilder.group({
      movementType: ['DEPOSIT', [Validators.required]],
      entryDate: [today, [Validators.required]],
      totalAmount: [null],
      categoryName: [''],
      balanceSnapshot: [null]
    });
  }

  private subscribeToMovementTypeChanges(): void {
    this.movementForm.get('movementType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((type: MovementType) => {
        this.onMovementTypeChange(type);
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

  private loadProduct(productId: string): void {
    this.isLoading = true;
    this.productUseCase.getProductById(productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (product) => {
          this.product = product;
          this.isLoading = false;
          if (!product.allowsMovements) {
            this.showToast(this.translationService.instant('products.addMovement.errors.notAllowed'), 'danger');
            this.router.navigate(['/products/overview']);
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
          this.router.navigate(['/products/overview']);
        }
      });
  }

  private loadCategories(type: MovementType): void {
    this.isLoadingCategories = true;
    const categoryObservable = type === 'DEPOSIT'
      ? this.categoryUseCase.getIncomeCategories()
      : this.categoryUseCase.getExpenseCategories();

    categoryObservable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
          this.isLoadingCategories = false;
        },
        error: (error) => {
          this.logger.error('Error loading categories:', 'AddMovementPage', error);
          this.isLoadingCategories = false;
          this.showToast(this.translationService.instant('products.addMovement.errors.loadCategories'), 'danger');
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

    if (!this.productId) {
      return;
    }

    this.isSubmitting = true;

    const formData = this.movementForm.value;
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

    this.productUseCase.addMovement(this.productId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async () => {
          this.isSubmitting = false;
          await this.showToast(this.translationService.instant('products.addMovement.success'), 'success');
          this.router.navigate(['/products/overview']);
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
