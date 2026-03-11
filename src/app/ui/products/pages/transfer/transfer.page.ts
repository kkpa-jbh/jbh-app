import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  arrowForwardOutline,
  calendarOutline,
  cashOutline,
  close,
  swapHorizontalOutline,
  walletOutline
} from 'ionicons/icons';
import { ProductUseCase } from '@core/domain/use-cases/product.use-case';
import { ProductListItem, AddTransferRequest } from '@core/domain/features/products';
import { JBHError } from '@core/domain/models/jbh-error.model';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { LoggerService } from '@core/infrastructure/logging/logger.service';
import { ViewportService, SelectInterface } from '@core/infrastructure/viewport/viewport.service';
import { HeaderActionsService } from '@core/infrastructure/header/header-actions.service';
import { DecimalFormatDirective } from '@shared/directives';
import { AppHeaderComponent } from '@shared/components/app-header/app-header.component';
import { ProductSelectComponent } from '@shared/components/product-select/product-select.component';

@Component({
  selector: 'app-transfer',
  templateUrl: './transfer.page.html',
  styleUrls: ['./transfer.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    TranslateModule,
    DecimalFormatDirective,
    AppHeaderComponent,
    ProductSelectComponent
  ]
})
export class TransferPage implements OnInit, OnDestroy, ViewWillEnter, ViewWillLeave {

  transferForm!: FormGroup;
  products: ProductListItem[] = [];

  isLoadingProducts = false;
  isSubmitting = false;

  selectInterface: SelectInterface = 'action-sheet';

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private productUseCase: ProductUseCase,
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
      arrowForwardOutline,
      calendarOutline,
      cashOutline,
      close,
      swapHorizontalOutline,
      walletOutline
    });
  }

  ngOnInit(): void {
    this.initForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ionViewWillEnter(): void {
    this.headerActions.setPageConfig({
      title: 'menu.transactions.transfer'
    });
    this.transferForm.reset();
    this.transferForm.patchValue({ transferDate: this.todayIso });
    this.loadProducts();
  }

  ionViewWillLeave(): void {
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
          this.showToast(this.translationService.instant('products.transfer.errors.loadProducts'), 'danger');
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
          await this.showToast(this.translationService.instant('products.transfer.success'), 'success');
          this.router.navigate(['/portfolio/overview']);
        },
        error: async (error: JBHError) => {
          this.logger.error('Error executing transfer:', 'TransferPage', error);
          this.isSubmitting = false;
          this.cdr.markForCheck();
          const errorMessage = error.isValidationError
            ? error.message
            : this.translationService.instant('products.transfer.errors.execute');
          await this.showToast(errorMessage, 'danger');
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

  private async showToast(message: string, color: 'success' | 'danger' | 'warning'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
      buttons: [{ icon: 'close', role: 'cancel' }]
    });
    await toast.present();
  }
}
