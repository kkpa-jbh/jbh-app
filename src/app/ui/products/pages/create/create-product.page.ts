import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil, distinctUntilChanged, filter } from 'rxjs';
import { ProductUseCase } from '@core/domain/use-cases/product.use-case';
import {
  ProductType,
  ProductMetadataConfig,
  MetadataValueType,
  CreateProductRequest
} from '@core/domain/features/products';
import { JBHError } from '@core/domain/models/jbh-error.model';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { LoggerService } from '@core/infrastructure/logging/logger.service';
import { HeaderActionsService } from '@core/infrastructure/header/header-actions.service';
import {
  JbhButtonComponent,
  JbhCardComponent,
  JbhDateFieldComponent,
  JbhNumberFieldComponent,
  JbhPageHeaderComponent,
  JbhSelectComponent,
  JbhSelectOptionComponent,
  JbhSkeletonComponent,
  JbhTextFieldComponent,
  JbhToggleComponent
} from '@design-system/components';
import { JbhPageComponent, ToastService } from '@design-system/platform';
import { AppHeaderComponent } from '@shared/components/app-header/app-header.component';

@Component({
  selector: 'app-create-product',
  templateUrl: './create-product.page.html',
  styleUrls: ['./create-product.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    JbhButtonComponent,
    JbhCardComponent,
    JbhDateFieldComponent,
    JbhNumberFieldComponent,
    JbhPageComponent,
    JbhPageHeaderComponent,
    JbhSelectComponent,
    JbhSelectOptionComponent,
    JbhSkeletonComponent,
    JbhTextFieldComponent,
    JbhToggleComponent,
    AppHeaderComponent
  ]
})
export class CreateProductPage implements OnInit, OnDestroy {

  productForm!: FormGroup;
  productTypes: ProductType[] = [];
  metadataConfigs: ProductMetadataConfig[] = [];

  isLoading = false;
  isLoadingTypes = true;
  isLoadingMetadata = false;
  isSubmitting = false;
  currentLanguage = 'en';

  readonly MetadataValueType = MetadataValueType;

  private destroy$ = new Subject<void>();

  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly productUseCase = inject(ProductUseCase);
  private readonly translationService = inject(TranslationService);
  private readonly toast = inject(ToastService);
  private readonly logger = inject(LoggerService);
  private readonly headerActions = inject(HeaderActionsService);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.initForm();
    this.loadProductTypes();
    this.subscribeToLanguageChanges();
    this.subscribeToProductTypeChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPageEnter(): void {
    this.headerActions.setPageConfig({
      title: 'products.create.formTitle'
    });
    this.loadProductTypes();
    this.resetForm();
  }

  onPageLeave(): void {
    this.headerActions.clearPageConfig();
  }

  private resetForm(): void {
    this.clearDynamicFields();
    this.productForm.reset();
    this.productForm.markAsPristine();
    this.productForm.markAsUntouched();
  }

  private initForm(): void {
    this.productForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
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
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.logger.error('Error loading product types:', 'CreateProductPage', error);
          this.isLoadingTypes = false;
          this.cdr.markForCheck();
          this.toast.show(this.translationService.instant('products.create.errors.loadTypes'), 'error');
        }
      });
  }

  private subscribeToLanguageChanges(): void {
    this.translationService.getCurrentLanguage$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(lang => {
        this.currentLanguage = lang;
        this.cdr.markForCheck();
      });
  }

  private subscribeToProductTypeChanges(): void {
    this.productForm.get('productType')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged(),
        filter(value => !!value)
      )
      .subscribe(productType => {
        this.loadMetadataConfig(productType);
      });
  }

  private loadMetadataConfig(productType: string): void {
    this.isLoadingMetadata = true;
    this.clearDynamicFields();

    this.productUseCase.getMetadataConfig(productType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (configs) => {
          this.metadataConfigs = configs;
          this.addDynamicFormControls(configs);
          this.isLoadingMetadata = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.logger.error('Error loading metadata config:', 'CreateProductPage', error);
          this.isLoadingMetadata = false;
          this.cdr.markForCheck();
          this.toast.show(this.translationService.instant('products.create.errors.loadMetadata'), 'error');
        }
      });
  }

  private clearDynamicFields(): void {
    this.metadataConfigs.forEach(config => {
      if (this.productForm.contains(config.key)) {
        this.productForm.removeControl(config.key);
      }
    });
    this.metadataConfigs = [];
  }

  private addDynamicFormControls(configs: ProductMetadataConfig[]): void {
    configs.forEach(config => {
      const validators = this.buildValidators(config);
      const defaultValue = this.getDefaultValue(config.valueType);
      this.productForm.addControl(config.key, this.formBuilder.control(defaultValue, validators));
    });
  }

  private buildValidators(config: ProductMetadataConfig): ValidatorFn[] {
    const validators: ValidatorFn[] = [];

    if (config.required) {
      validators.push(Validators.required);
    }

    if (config.minValue !== null) {
      validators.push(Validators.min(config.minValue));
    }

    if (config.maxValue !== null) {
      validators.push(Validators.max(config.maxValue));
    }

    if (config.valueType === MetadataValueType.INT) {
      validators.push(this.integerValidator());
    }

    if (config.valueType === MetadataValueType.BIGDECIMAL) {
      validators.push(this.maxDecimalsValidator(2));
    }

    return validators;
  }

  private integerValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value === null || control.value === '') return null;
      const value = Number(control.value);
      if (!Number.isInteger(value)) {
        return { integer: true };
      }
      return null;
    };
  }

  private maxDecimalsValidator(maxDecimals: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value === null || control.value === '') return null;
      const value = String(control.value);
      const decimalPart = value.split('.')[1];
      if (decimalPart && decimalPart.length > maxDecimals) {
        return { maxDecimals: { max: maxDecimals, actual: decimalPart.length } };
      }
      return null;
    };
  }

  private getDefaultValue(valueType: MetadataValueType): string | boolean | null {
    switch (valueType) {
      case MetadataValueType.BOOLEAN:
        return false;
      case MetadataValueType.DATE:
        return null;
      case MetadataValueType.INT:
      case MetadataValueType.BIGDECIMAL:
        return null;
      case MetadataValueType.STRING:
      default:
        return '';
    }
  }

  getProductTypeName(productType: ProductType): string {
    return productType.getLocalizedName(this.currentLanguage);
  }

  getFieldLabel(config: ProductMetadataConfig): string {
    return config.getLocalizedDisplayName(this.currentLanguage);
  }

  getInputType(valueType: MetadataValueType): string {
    switch (valueType) {
      case MetadataValueType.INT:
      case MetadataValueType.BIGDECIMAL:
        return 'number';
      case MetadataValueType.DATE:
        return 'date';
      case MetadataValueType.STRING:
      default:
        return 'text';
    }
  }

  getInputStep(valueType: MetadataValueType): string {
    switch (valueType) {
      case MetadataValueType.BIGDECIMAL:
        return '0.01';
      case MetadataValueType.INT:
        return '1';
      default:
        return 'any';
    }
  }

  getMaxDecimals(valueType: MetadataValueType): number | null {
    switch (valueType) {
      case MetadataValueType.INT:
        return 0;
      case MetadataValueType.BIGDECIMAL:
        return 2;
      default:
        return null;
    }
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.markFormGroupTouched(this.productForm);
      return;
    }

    this.isSubmitting = true;

    const formData = this.productForm.value;
    const metadata: Record<string, unknown> = {};

    this.metadataConfigs.forEach(config => {
      if (formData[config.key] !== null && formData[config.key] !== undefined) {
        metadata[config.key] = formData[config.key];
      }
    });

    const request: CreateProductRequest = {
      name: formData.name,
      type: formData.productType,
      metadata
    };

    this.productUseCase.createProduct(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async () => {
          this.isSubmitting = false;
          await this.toast.show(this.translationService.instant('products.create.success'), 'success');
          this.router.navigate(['/products/overview']);
        },
        error: async (error: JBHError) => {
          this.logger.error('Error creating product:', 'CreateProductPage', error);
          this.isSubmitting = false;
          this.cdr.markForCheck();
          const errorMessage = (error.isValidationError)
            ? error.message
            : this.translationService.instant('products.create.errors.create');
          await this.toast.show(errorMessage, 'error');
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
      return this.translationService.instant('products.create.dynamicFields.required');
    }
    if (field.hasError('minlength')) {
      const minLength = field.errors['minlength'].requiredLength;
      return this.translationService.instant('validation.minlength', { field: fieldName, minLength });
    }
    if (field.hasError('maxlength')) {
      const maxLength = field.errors['maxlength'].requiredLength;
      return this.translationService.instant('validation.maxlength', { field: fieldName, maxLength });
    }
    if (field.hasError('min')) {
      const minValue = field.errors['min'].min;
      return this.translationService.instant('products.create.dynamicFields.min', { min: minValue });
    }
    if (field.hasError('max')) {
      const maxValue = field.errors['max'].max;
      return this.translationService.instant('products.create.dynamicFields.max', { max: maxValue });
    }
    if (field.hasError('integer')) {
      return this.translationService.instant('products.create.dynamicFields.integer');
    }
    if (field.hasError('maxDecimals')) {
      const maxDecimals = field.errors['maxDecimals'].max;
      return this.translationService.instant('products.create.dynamicFields.maxDecimals', { max: maxDecimals });
    }
    return this.translationService.instant('validation.pattern');
  }
}
