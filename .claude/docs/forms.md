# Forms: Mobile-First Standards

## Overview
All forms use Angular Reactive Forms with Ionic components for native mobile experience.

## TypeScript Pattern

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';

@Component({
  selector: 'app-feature',
  templateUrl: './feature.page.html',
  styleUrls: ['./feature.page.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule, TranslateModule]
})
export class FeaturePage implements OnInit, OnDestroy {
  myForm!: FormGroup;
  isLoading = false;
  isSubmitting = false;
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private translationService: TranslationService,
    private toastController: ToastController
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.myForm = this.formBuilder.group({
      fieldName: ['', [Validators.required]],
    });
  }

  async onSubmit(): Promise<void> {
    if (this.myForm.invalid) {
      this.markFormGroupTouched(this.myForm);
      return;
    }
    this.isSubmitting = true;
    // Handle submission...
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }

  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.myForm.get(fieldName);
    if (!field) return false;
    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.myForm.get(fieldName);
    if (!field || !field.errors) return '';
    if (field.hasError('required')) {
      return this.translationService.instant(`feature.${fieldName}.required`);
    }
    if (field.hasError('minlength')) {
      const minLength = field.errors['minlength'].requiredLength;
      return this.translationService.instant(`feature.${fieldName}.minlength`, { minLength });
    }
    return this.translationService.instant('validation.pattern');
  }
}
```

## HTML Pattern

```html
<ion-content [fullscreen]="true">
  <div class="jbh-container">
    <div class="jbh-form-card">

      <!-- Header -->
      <div class="jbh-form-header">
        <div class="jbh-form-icon">
          <ion-icon name="icon-outline"></ion-icon>
        </div>
        <h1 class="jbh-form-title">{{ 'feature.title' | translate }}</h1>
        <p class="jbh-form-subtitle">{{ 'feature.subtitle' | translate }}</p>
      </div>

      <!-- Form -->
      <form [formGroup]="myForm" (ngSubmit)="onSubmit()" class="jbh-form-animated">

        <!-- Text Input -->
        <div class="jbh-form-field">
          <label class="jbh-label">{{ 'feature.field.label' | translate }}</label>
          <div class="jbh-input-wrapper">
            <ion-icon name="icon-outline" class="jbh-input-icon left"></ion-icon>
            <input
              type="text"
              class="jbh-input jbh-input-icon-left"
              formControlName="fieldName"
              [placeholder]="'feature.field.placeholder' | translate"
              [class.error]="hasError('fieldName')"
            />
          </div>
          @if (hasError('fieldName')) {
            <div class="jbh-field-error">
              <ion-icon name="information-circle"></ion-icon>
              <span>{{ getErrorMessage('fieldName') }}</span>
            </div>
          }
        </div>

        <!-- Select (Mobile Native) -->
        <div class="jbh-form-field">
          <label class="jbh-label">{{ 'feature.select.label' | translate }}</label>
          <div class="jbh-ion-select-wrapper" [class.error]="hasError('selectField')">
            <ion-icon name="icon-outline" class="jbh-ion-select-icon"></ion-icon>
            <ion-select
              formControlName="selectField"
              [placeholder]="'feature.select.placeholder' | translate"
              interface="action-sheet"
              class="jbh-ion-select"
            >
              @for (option of options; track option.value) {
                <ion-select-option [value]="option.value">
                  {{ option.label }}
                </ion-select-option>
              }
            </ion-select>
          </div>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          class="jbh-button-primary jbh-button-block"
          [disabled]="isSubmitting || myForm.invalid"
          [class.jbh-button-loading]="isSubmitting"
        >
          @if (isSubmitting) {
            <ion-spinner name="crescent"></ion-spinner>
            <span>{{ 'feature.saving' | translate }}</span>
          } @else {
            <ion-icon name="save-outline"></ion-icon>
            <span>{{ 'feature.save' | translate }}</span>
          }
        </button>

      </form>
    </div>
  </div>
</ion-content>
```

## Mobile-Specific Rules

### Use ion-select for Dropdowns
```html
<!-- ✅ CORRECT -->
<ion-select interface="action-sheet">
  <ion-select-option>

<!-- ❌ WRONG -->
<select class="jbh-select">
  <option>
```

### Interface Options
- `action-sheet` - Bottom sheet (recommended)
- `alert` - Modal dialog
- `popover` - Better for tablets

### Touch Targets
Minimum 44px (handled by theme classes)

## Angular Control Flow
Use new syntax (`@if`, `@for`), not deprecated directives:
```html
<!-- ✅ CORRECT -->
@if (isLoading) { <div class="jbh-skeleton"></div> }
@for (item of items; track item.id) { ... }

<!-- ❌ DEPRECATED -->
<div *ngIf="isLoading">
<div *ngFor="let item of items">
```

## Validators Reference
```typescript
this.form = this.formBuilder.group({
  required: ['', [Validators.required]],
  email: ['', [Validators.required, Validators.email]],
  minLength: ['', [Validators.minLength(3)]],
  maxLength: ['', [Validators.maxLength(100)]],
  pattern: ['', [Validators.pattern(/^[a-zA-Z]+$/)]],
});
```

## Checklist
- [ ] Uses `jbh-form-card` container
- [ ] Has header with icon, title, subtitle
- [ ] Uses `ion-select` for dropdowns
- [ ] Has `hasError()` and `getErrorMessage()` methods
- [ ] Loading states: `isLoading`, `isSubmitting`
- [ ] Cleanup with `destroy$` subject
- [ ] ALL text uses translate pipe
