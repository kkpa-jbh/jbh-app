import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { PreferencesUseCase } from '@core/domain/use-cases/preferences.use-case';
import { Language, Currency, UpdatePreferencesRequest } from '@core/domain/features/preferences';
import { ProductListItem } from '@core/domain/features/products';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { LoggerService } from '@core/infrastructure/logging/logger.service';
import { HeaderActionsService } from '@core/infrastructure/header/header-actions.service';
import {
  JbhButtonComponent,
  JbhCardComponent,
  JbhNumberFieldComponent,
  JbhPageHeaderComponent,
  JbhSelectComponent,
  JbhSelectOptionComponent,
  JbhSpinnerComponent
} from '@design-system/components';
import { JbhPageComponent, ToastService } from '@design-system/platform';
import { AppHeaderComponent } from '@shared/components/app-header/app-header.component';
import { ProductSelectComponent } from '@shared/components/product-select/product-select.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    JbhButtonComponent,
    JbhCardComponent,
    JbhNumberFieldComponent,
    JbhPageComponent,
    JbhPageHeaderComponent,
    JbhSelectComponent,
    JbhSelectOptionComponent,
    JbhSpinnerComponent,
    AppHeaderComponent,
    ProductSelectComponent
  ]
})
export class ProfilePage implements OnInit, OnDestroy {

  preferencesForm!: FormGroup;
  isLoading = true;
  isSubmitting = false;
  products: ProductListItem[] = [];

  readonly Language = Language;
  readonly Currency = Currency;

  private destroy$ = new Subject<void>();

  private readonly formBuilder = inject(FormBuilder);
  private readonly preferencesUseCase = inject(PreferencesUseCase);
  private readonly translationService = inject(TranslationService);
  private readonly toast = inject(ToastService);
  private readonly logger = inject(LoggerService);
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
      title: 'menu.settings.myPreferences',
    });
    this.loadData();
  }

  onPageLeave(): void {
    this.headerActions.clearPageConfig();
  }

  private initForm(): void {
    this.preferencesForm = this.formBuilder.group({
      defaultLang: [Language.EN, [Validators.required]],
      defaultCurrency: [Currency.USD, [Validators.required]],
      savingsGoal: [0, [Validators.required, Validators.min(0)]],
      defaultProductId: [null]
    });
  }

  private loadData(): void {
    this.isLoading = true;

    forkJoin({
      preferences: this.preferencesUseCase.getPreferences(),
      products: this.preferencesUseCase.getActiveProducts()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ preferences, products }) => {
          this.products = products;
          this.preferencesForm.patchValue({
            defaultLang: preferences.defaultLang,
            defaultCurrency: preferences.defaultCurrency,
            savingsGoal: preferences.savingsGoal,
            defaultProductId: preferences.defaultProductId
          });
          this.isLoading = false;
        },
        error: async (error) => {
          this.logger.error('Error loading preferences:', 'ProfilePage', error);
          this.isLoading = false;
          await this.toast.show(this.translationService.instant('profile.errors.load'), 'error');
        }
      });
  }

  onSubmit(): void {
    if (this.preferencesForm.invalid) {
      this.markFormGroupTouched(this.preferencesForm);
      return;
    }

    this.isSubmitting = true;

    const request: UpdatePreferencesRequest = {
      defaultLang: this.preferencesForm.value.defaultLang,
      defaultCurrency: this.preferencesForm.value.defaultCurrency,
      savingsGoal: this.preferencesForm.value.savingsGoal,
      defaultProductId: this.preferencesForm.value.defaultProductId || null
    };

    this.preferencesUseCase.updatePreferences(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async () => {
          this.isSubmitting = false;
          this.translationService.setLanguage(request.defaultLang.toLowerCase());
          await this.toast.show(this.translationService.instant('profile.success'), 'success');
        },
        error: async (error) => {
          this.logger.error('Error updating preferences:', 'ProfilePage', error);
          this.isSubmitting = false;
          const errorMessage = error?.error?.message || this.translationService.instant('profile.errors.update');
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
    const field = this.preferencesForm.get(fieldName);
    if (!field) return false;

    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.preferencesForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.hasError('required')) {
      return this.translationService.instant(`profile.${fieldName}.required`);
    }
    if (field.hasError('min')) {
      return this.translationService.instant(`profile.${fieldName}.min`);
    }
    return '';
  }
}
