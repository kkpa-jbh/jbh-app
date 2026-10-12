# Forms: Mobile-First Standards

## Overview
All forms use Angular Reactive Forms with the `jbh-*` form controls from `@design-system/components`.
Each control is a `ControlValueAccessor`: put `formControlName` on it.
Pages never use `<ion-input>`, `<ion-select>`, raw `<input>` fields or Ionic imports.

**Reference page**: `src/app/ui/products/pages/add-movement/` (text, number, date, select, textarea, loading button, toast, skeleton).

## Form controls

| Control | Use for | Main inputs |
|---|---|---|
| `jbh-text-field` | text, email, password | `label`, `type`, `icon`, `placeholder`, `autocomplete`, `hint`, `error`, `requirement`; slot `[jbhFieldSuffix]`; password reveal built in |
| `jbh-number-field` | amounts, numbers | `label`, `decimals`, `icon`, `placeholder`, `hint`, `error`, `requirement`. Value: `number \| null` |
| `jbh-textarea` | long text | `label`, `rows`, `maxlength`, `icon`, `placeholder`, `hint`, `error`, `requirement` |
| `jbh-date-field` | dates | `label`, `mode` (`date` \| `month`), `min`, `max`, `hint`, `error`, `requirement`. Value: `YYYY-MM-DD` or `YYYY-MM` |
| `jbh-select` + `jbh-select-option` | dropdowns | `label`, `placeholder`, `icon`, `loading`, `hint`, `error`, `requirement`; options are projected |
| `jbh-toggle` | on / off | `label`, `checked`, `disabled` |
| `jbh-field` | rare custom controls only | `label`, `controlId`, `hint`, `error`, `requirement` |

- **Errors**: `error` is `string | null`. A non-empty string shows it, with `role="alert"`.
- **Selects**: the overlay type is chosen by the layer (popover from 1024 px, action sheet below). Do not pass an interface.
- **Number input**: `jbh-number-field` formats the number while the user types and on blur. Its `valueChanges` emits while typing.
- **App selects**: `app-category-select` and `app-product-select` (in `shared/components/`) wrap `jbh-select` with domain data. Put a `<label class="jbh-label">` above them.

## TypeScript Pattern

```typescript
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import {
  JbhButtonComponent,
  JbhCardComponent,
  JbhPageHeaderComponent,
  JbhSelectComponent,
  JbhSelectOptionComponent,
  JbhTextFieldComponent
} from '@design-system/components';
import { JbhPageComponent, ToastService } from '@design-system/platform';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { AppHeaderComponent } from '@shared/components/app-header/app-header.component';

@Component({
  selector: 'app-feature',
  templateUrl: './feature.page.html',
  styleUrls: ['./feature.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    AppHeaderComponent,
    JbhButtonComponent,
    JbhCardComponent,
    JbhPageComponent,
    JbhPageHeaderComponent,
    JbhSelectComponent,
    JbhSelectOptionComponent,
    JbhTextFieldComponent
  ]
})
export class FeaturePage implements OnInit, OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly translationService = inject(TranslationService);
  private readonly toast = inject(ToastService);

  myForm!: FormGroup;
  isLoading = false;
  isSubmitting = false;
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initForm();
  }

  onPageEnter(): void {
    // API calls and header setup
  }

  onPageLeave(): void {
    // headerActions.clearPageConfig()
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.myForm = this.formBuilder.group({
      fieldName: ['', [Validators.required]],
      selectField: [null, [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.myForm.invalid) {
      this.myForm.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    // Handle submission, then:
    // this.toast.show(this.translationService.instant('feature.saved'), 'success');
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
<jbh-page (pageEnter)="onPageEnter()" (pageLeave)="onPageLeave()">
  <app-header jbhPageHeader></app-header>

  <div class="jbh-container">
    <jbh-card variant="form">
      <jbh-page-header
        variant="form"
        icon="create-outline"
        [title]="'feature.title' | translate"
        [subtitle]="'feature.subtitle' | translate"
      />

      <form [formGroup]="myForm" (ngSubmit)="onSubmit()">
        <jbh-text-field
          formControlName="fieldName"
          icon="text-outline"
          [label]="'feature.field.label' | translate"
          [placeholder]="'feature.field.placeholder' | translate"
          [error]="hasError('fieldName') ? getErrorMessage('fieldName') : ''"
        />

        <jbh-select
          formControlName="selectField"
          icon="list-outline"
          [label]="'feature.select.label' | translate"
          [placeholder]="'feature.select.placeholder' | translate"
          [error]="hasError('selectField') ? getErrorMessage('selectField') : ''"
        >
          @for (option of options; track option.value) {
            <jbh-select-option [value]="option.value">{{ option.labelKey | translate }}</jbh-select-option>
          }
        </jbh-select>

        <button
          type="submit"
          jbhButton
          block
          icon="save-outline"
          [loading]="isSubmitting"
          [disabled]="isSubmitting"
        >
          {{ (isSubmitting ? 'feature.saving' : 'feature.save') | translate }}
        </button>
      </form>
    </jbh-card>
  </div>
</jbh-page>
```

## Mobile-Specific Rules

### Use jbh-select for Dropdowns
```html
<!-- ✅ CORRECT -->
<jbh-select formControlName="type" [label]="'feature.type' | translate">
  <jbh-select-option [value]="'A'">A</jbh-select-option>
</jbh-select>

<!-- ❌ WRONG -->
<ion-select interface="action-sheet">
<select class="jbh-select">
```

### Touch Targets
Minimum 44px (handled by the layer components)

## Angular Control Flow
Use new syntax (`@if`, `@for`), not deprecated directives:
```html
<!-- ✅ CORRECT -->
@if (isLoading) { <jbh-skeleton shape="input" /> }
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
- [ ] `jbh-page` is the root element; data loads in `(pageEnter)`
- [ ] Form sits in `<jbh-card variant="form">` with a `jbh-page-header variant="form"`
- [ ] Uses `jbh-*` form controls with `formControlName`
- [ ] Uses `jbh-select` for dropdowns
- [ ] Has `hasError()` and `getErrorMessage()` methods; passes `[error]` to each control
- [ ] Submit is `button[jbhButton]` with `[loading]`
- [ ] Loading states: `isLoading`, `isSubmitting`
- [ ] Cleanup with `destroy$` subject
- [ ] ALL text uses translate pipe
- [ ] Toasts through `ToastService`
- [ ] Icons: `jbh-icon` names come from `design-system/components/icon/icon-registry.ts`. Add a new icon there.
