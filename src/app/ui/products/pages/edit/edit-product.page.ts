import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { IonicModule, ToastController, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil, distinctUntilChanged, filter } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  cubeOutline,
  pricetagOutline,
  informationCircle,
  calendarOutline,
  textOutline,
  calculatorOutline,
  saveOutline,
  close,
  arrowBackOutline
} from 'ionicons/icons';
import { ProductUseCase } from '@core/domain/use-cases/product.use-case';
import {
  ProductType,
  ProductMetadataConfig,
  MetadataValueType,
  UpdateProductRequest,
  ProductListItem
} from '@core/domain/features/products';
import { JBHError } from '@core/domain/models/jbh-error.model';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { LoggerService } from '@core/infrastructure/logging/logger.service';
import { HeaderActionsService } from '@core/infrastructure/header/header-actions.service';
import { DecimalFormatDirective } from '@shared/directives';
import { AppHeaderComponent } from '@shared/components/app-header/app-header.component';

@Component({
  selector: 'app-edit-product',
  templateUrl: './edit-product.page.html',
  styleUrls: ['./edit-product.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    TranslateModule,
    DecimalFormatDirective,
    AppHeaderComponent
  ]
})
export class EditProductPage implements OnInit, OnDestroy, ViewWillEnter, ViewWillLeave {

  productForm!: FormGroup;
  productTypes: ProductType[] = [];
  metadataConfigs: ProductMetadataConfig[] = [];
  product: ProductListItem | null = null;
  productId: string | null = null;

  isLoading = true;
  isLoadingTypes = true;
  isLoadingMetadata = false;
  isSubmitting = false;
  currentLanguage = 'en';

  readonly MetadataValueType = MetadataValueType;

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private productUseCase: ProductUseCase,
    private translationService: TranslationService,
    private toastController: ToastController,
    private logger: LoggerService,
    private headerActions: HeaderActionsService,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      cubeOutline,
      pricetagOutline,
      informationCircle,
      calendarOutline,
      textOutline,
      calculatorOutline,
      saveOutline,
      close,
      arrowBackOutline
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.loadProductTypes();
    this.subscribeToLanguageChanges();
    this.productId = this.route.snapshot.paramMap.get('id');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ionViewWillEnter(): void {
    this.headerActions.setPageConfig({
      title: 'products.edit.formTitle',
      showBackButton: true
    });
    this.loadProduct();
  }

  ionViewWillLeave(): void {
    this.headerActions.clearPageConfig();
  }

  private initForm(): void {
    this.productForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      productType: [{ value: '', disabled: true }]
    });
  }

  private loadProduct(): void {
    if (!this.productId) {
      this.navigateToOverview();
      return;
    }

    this.isLoading = true;
    this.productUseCase.getProductById(this.productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (product) => {
          this.product = product;
          this.isLoading = false;
          this.cdr.markForCheck();
          this.loadMetadataConfig(product.type);
        },
        error: (error) => {
          this.logger.error('Error loading product:', 'EditProductPage', error);
          this.isLoading = false;
          this.cdr.markForCheck();
          this.showToast(this.translationService.instant('products.edit.errors.load'), 'danger');
          this.navigateToOverview();
        }
      });
  }

  private populateForm(): void {
    if (!this.product) return;

    this.productForm.patchValue({
      name: this.product.name,
      productType: this.product.type
    });

    this.metadataConfigs.forEach(config => {
      const value = this.product!.metadata[config.key];
      if (this.productForm.contains(config.key) && value !== undefined) {
        this.productForm.get(config.key)?.setValue(value);
      }
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
          this.logger.error('Error loading product types:', 'EditProductPage', error);
          this.isLoadingTypes = false;
          this.cdr.markForCheck();
          this.showToast(this.translationService.instant('products.edit.errors.loadTypes'), 'danger');
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

  private loadMetadataConfig(productType: string): void {
    this.isLoadingMetadata = true;
    this.clearDynamicFields();

    this.productUseCase.getMetadataConfig(productType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (configs) => {
          this.metadataConfigs = configs;
          this.addDynamicFormControls(configs);
          this.populateForm();
          this.isLoadingMetadata = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.logger.error('Error loading metadata config:', 'EditProductPage', error);
          this.isLoadingMetadata = false;
          this.cdr.markForCheck();
          this.showToast(this.translationService.instant('products.edit.errors.loadMetadata'), 'danger');
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

  private getDefaultValue(valueType: MetadataValueType): any {
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

  getProductTypeLabel(): string {
    if (!this.product) return '';
    return this.translationService.instant(`products.types.${this.product.type}`);
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

  navigateToOverview(): void {
    this.router.navigate(['/products/overview']);
  }

  onSubmit(): void {
    if (this.productForm.invalid || !this.productId) {
      this.markFormGroupTouched(this.productForm);
      return;
    }

    this.isSubmitting = true;

    const formData = this.productForm.getRawValue();
    const metadata: Record<string, any> = {};

    this.metadataConfigs.forEach(config => {
      if (formData[config.key] !== null && formData[config.key] !== undefined) {
        metadata[config.key] = formData[config.key];
      }
    });

    const request: UpdateProductRequest = {
      name: formData.name,
      metadata
    };

    this.productUseCase.updateProduct(this.productId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async () => {
          this.isSubmitting = false;
          await this.showToast(this.translationService.instant('products.edit.success'), 'success');
          this.router.navigate(['/products/overview']);
        },
        error: async (error: JBHError) => {
          this.logger.error('Error updating product:', 'EditProductPage', error);
          this.isSubmitting = false;
          const errorMessage = (error.isValidationError)
            ? error.message
            : this.translationService.instant('products.edit.errors.update');
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
      return this.translationService.instant('products.edit.dynamicFields.required');
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
      return this.translationService.instant('products.edit.dynamicFields.min', { min: minValue });
    }
    if (field.hasError('max')) {
      const maxValue = field.errors['max'].max;
      return this.translationService.instant('products.edit.dynamicFields.max', { max: maxValue });
    }
    if (field.hasError('integer')) {
      return this.translationService.instant('products.edit.dynamicFields.integer');
    }
    if (field.hasError('maxDecimals')) {
      const maxDecimals = field.errors['maxDecimals'].max;
      return this.translationService.instant('products.edit.dynamicFields.maxDecimals', { max: maxDecimals });
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
