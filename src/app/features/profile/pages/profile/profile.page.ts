import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, ToastController, ViewWillEnter } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  personOutline,
  languageOutline,
  cashOutline,
  walletOutline,
  cubeOutline,
  saveOutline,
  close,
  informationCircle
} from 'ionicons/icons';
import { PreferencesUseCase } from '@core/domain/use-cases/preferences.use-case';
import { Language, Currency, UpdatePreferencesRequest } from '@core/domain/models/preferences.model';
import { ProductListItem } from '@core/domain/models/product-list-item.model';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { LoggerService } from '@core/infrastructure/logging/logger.service';
import { DecimalFormatDirective } from '@shared/directives/decimal-format.directive';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    TranslateModule,
    DecimalFormatDirective
  ]
})
export class ProfilePage implements OnInit, OnDestroy, ViewWillEnter {

  preferencesForm!: FormGroup;
  isLoading = true;
  isSubmitting = false;
  products: ProductListItem[] = [];

  readonly Language = Language;
  readonly Currency = Currency;

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private preferencesUseCase: PreferencesUseCase,
    private translationService: TranslationService,
    private toastController: ToastController,
    private logger: LoggerService
  ) {
    addIcons({
      personOutline,
      languageOutline,
      cashOutline,
      walletOutline,
      cubeOutline,
      saveOutline,
      close,
      informationCircle
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
    this.loadData();
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
          await this.showToast(this.translationService.instant('profile.errors.load'), 'danger');
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
          await this.showToast(this.translationService.instant('profile.success'), 'success');
        },
        error: async (error) => {
          this.logger.error('Error updating preferences:', 'ProfilePage', error);
          this.isSubmitting = false;
          const errorMessage = error?.error?.message || this.translationService.instant('profile.errors.update');
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
