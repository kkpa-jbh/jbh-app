import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { ProductUseCase } from '@core/domain/use-cases/product.use-case';
import { ProductListItem, AddTransferRequest } from '@core/domain/features/products';
import { JBHError } from '@core/domain/models/jbh-error.model';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { LoggerService } from '@core/infrastructure/logging/logger.service';
import { HeaderActionsService } from '@core/infrastructure/header/header-actions.service';
import {
  JbhButtonComponent,
  JbhCardComponent,
  JbhDateFieldComponent,
  JbhIconComponent,
  JbhNumberFieldComponent,
  JbhPageHeaderComponent
} from '@design-system/components';
import { JbhPageComponent, ToastService } from '@design-system/platform';
import { AppHeaderComponent } from '@shared/components/app-header/app-header.component';
import { ProductSelectComponent } from '@shared/components/product-select/product-select.component';

@Component({
  selector: 'app-transfer',
  templateUrl: './transfer.page.html',
  styleUrls: ['./transfer.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    JbhButtonComponent,
    JbhCardComponent,
    JbhDateFieldComponent,
    JbhIconComponent,
    JbhNumberFieldComponent,
    JbhPageComponent,
    JbhPageHeaderComponent,
    AppHeaderComponent,
    ProductSelectComponent
  ]
})
export class TransferPage implements OnInit, OnDestroy {

  transferForm!: FormGroup;
  products: ProductListItem[] = [];

  isLoadingProducts = false;
  isSubmitting = false;

  private destroy$ = new Subject<void>();

  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly productUseCase = inject(ProductUseCase);
  private readonly translationService = inject(TranslationService);
  private readonly toast = inject(ToastService);
  private readonly logger = inject(LoggerService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly headerActions = inject(HeaderActionsService);

  ngOnInit(): void {
    this.initForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPageEnter(): void {
    this.headerActions.setPageConfig({
      title: 'menu.transactions.transfer'
    });
    this.transferForm.reset();
    this.transferForm.patchValue({ transferDate: this.todayIso });
    this.loadProducts();
  }

  onPageLeave(): void {
    this.headerActions.clearPageConfig();
  }

  private initForm(): void {
    this.transferForm = this.formBuilder.group({
      fromAccountId: ['', [Validators.required]],
      toAccountId: ['', [Validators.required]],
      totalAmount: [null, [Validators.required, Validators.min(0.01)]],
      transferDate: [this.todayIso, [Validators.required]]
    });
  }

  private loadProducts(): void {
    this.isLoadingProducts = true;
    this.transferForm.get('fromAccountId')?.disable();
    this.transferForm.get('toAccountId')?.disable();
    this.cdr.markForCheck();

    this.productUseCase.getProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.products = products;
          this.isLoadingProducts = false;
          this.transferForm.get('fromAccountId')?.enable();
          this.transferForm.get('toAccountId')?.enable();
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.logger.error('Error loading products:', 'TransferPage', error);
          this.isLoadingProducts = false;
          this.transferForm.get('fromAccountId')?.enable();
          this.transferForm.get('toAccountId')?.enable();
          this.toast.show(this.translationService.instant('products.transfer.errors.loadProducts'), 'error');
          this.cdr.markForCheck();
        }
      });
  }

  get fromAccountId(): string {
    return this.transferForm.get('fromAccountId')?.value ?? '';
  }

  get toAccountProducts(): ProductListItem[] {
    return this.products.filter(p => p.id !== this.fromAccountId);
  }

  get todayIso(): string {
    return new Date().toISOString().split('T')[0];
  }

  onSubmit(): void {
    if (this.transferForm.invalid) {
      this.markFormGroupTouched(this.transferForm);
      return;
    }

    const formData = this.transferForm.getRawValue();

    if (formData.fromAccountId === formData.toAccountId) {
      return;
    }

    this.isSubmitting = true;

    const request: AddTransferRequest = {
      toAccountId: formData.toAccountId,
      totalAmount: formData.totalAmount,
      transferDate: formData.transferDate
    };

    this.productUseCase.executeTransfer(formData.fromAccountId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async () => {
          this.isSubmitting = false;
          await this.toast.show(this.translationService.instant('products.transfer.success'), 'success');
          this.router.navigate(['/portfolio/overview']);
        },
        error: async (error: JBHError) => {
          this.logger.error('Error executing transfer:', 'TransferPage', error);
          this.isSubmitting = false;
          this.cdr.markForCheck();
          const errorMessage = error.isValidationError
            ? error.message
            : this.translationService.instant('products.transfer.errors.execute');
          await this.toast.show(errorMessage, 'error');
        }
      });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }

  hasError(fieldName: string): boolean {
    const field = this.transferForm.get(fieldName);
    if (!field) return false;
    return field.invalid && (field.dirty || field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.transferForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.hasError('required')) {
      return this.translationService.instant('products.transfer.validation.required');
    }
    if (field.hasError('min')) {
      const minValue = field.errors['min'].min;
      return this.translationService.instant('products.transfer.validation.min', { min: minValue });
    }
    return this.translationService.instant('validation.pattern');
  }
}
