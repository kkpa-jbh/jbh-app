import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { ProductUseCase } from '@core/domain/use-cases/product.use-case';
import { ProductType } from '@core/domain/models/product-type.model';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';

@Component({
  selector: 'app-create',
  templateUrl: './create.page.html',
  styleUrls: ['./create.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    TranslateModule
  ]
})
export class CreatePage implements OnInit, OnDestroy {

  productForm!: FormGroup;
  productTypes: ProductType[] = [];
  isLoading = false;
  isLoadingTypes = true;
  isSubmitting = false;
  currentLanguage = 'en';

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private productUseCase: ProductUseCase,
    private translationService: TranslationService,
    private toastController: ToastController
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadProductTypes();
    this.subscribeToLanguageChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.productForm = this.formBuilder.group({
      productType: ['', [Validators.required]]
    });
  }

  private loadProductTypes(): void {
    this.isLoadingTypes = true;
    this.productUseCase.getProductTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.productTypes = types;
          this.isLoadingTypes = false;
        },
        error: (error) => {
          console.error('Error loading product types:', error);
          this.isLoadingTypes = false;
          this.showToast(this.translationService.instant('products.create.errors.loadTypes'), 'danger');
        }
      });
  }

  private subscribeToLanguageChanges(): void {
    this.translationService.getCurrentLanguage$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(lang => {
        this.currentLanguage = lang;
      });
  }

  getProductTypeName(productType: ProductType): string {
    return productType.getLocalizedName(this.currentLanguage);
  }

  async onSubmit(): Promise<void> {
    if (this.productForm.invalid) {
      this.markFormGroupTouched(this.productForm);
      return;
    }

    this.isSubmitting = true;

    const selectedType = this.productForm.get('productType')?.value;
    console.log('Creating product with type:', selectedType);

    // Simulate API call
    setTimeout(async () => {
      this.isSubmitting = false;
      await this.showToast(this.translationService.instant('products.create.success'), 'success');
      this.productForm.reset();
    }, 1500);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.productForm.get(fieldName);
    if (!field) return false;

    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.productForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.hasError('required')) {
      return this.translationService.instant(`products.create.${fieldName}.required`);
    }
    return this.translationService.instant('validation.pattern');
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
