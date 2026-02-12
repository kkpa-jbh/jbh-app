# UX & Design System Guide

> **Purpose:** Comprehensive reference for designing and implementing consistent UI across the JBH App. Use this guide to avoid repetitive codebase exploration and ensure all pages follow established patterns.

---

## Table of Contents

1. [Overview & Principles](#1-overview--principles)
2. [Page Templates](#2-page-templates)
3. [Component Library](#3-component-library)
4. [State Patterns](#4-state-patterns)
5. [Layout System](#5-layout-system)
6. [Navigation Patterns](#6-navigation-patterns)
7. [Form Patterns](#7-form-patterns)
8. [Data Display](#8-data-display)
9. [Interactive Elements](#9-interactive-elements)
10. [Permission-Based UI](#10-permission-based-ui)
11. [Responsive Design](#11-responsive-design)
12. [Performance Best Practices](#12-performance-best-practices)
13. [Accessibility Guidelines](#13-accessibility-guidelines)
14. [Internationalization (i18n)](#14-internationalization-i18n)
15. [Design Tokens](#15-design-tokens)
16. [CSS Class Reference](#16-css-class-reference)

---

## 1. Overview & Principles

### Platform
- **Hybrid Mobile App:** iOS, Android, and PWA (desktop web)
- **Framework:** Ionic + Angular with standalone components
- **Architecture:** Hexagonal + DDD + Clean Architecture

### Design Philosophy
1. **Mobile-First:** Design for smallest screens first, enhance for larger viewports
2. **Consistency:** Single source of truth for all styles (`src/theme/custom-components.scss`)
3. **Performance:** OnPush change detection, pure pipes, no getter methods for formatting
4. **Accessibility:** WCAG AA compliance (in progress)
5. **Reusability:** Component-driven with `jbh-*` CSS classes

### When to Use This Guide
- Designing a new page or component
- Implementing a form or data display
- Adding loading/empty/error states
- Ensuring responsive layouts
- Checking performance patterns
- Verifying accessibility compliance

---

## 2. Page Templates

### A. Overview/List Pages

**Purpose:** Display collections of entities (products, teams, etc.)

**Structure:**
```
Header (app-header or ion-header)
↓
Loading State (skeleton cards)
↓
Empty State (if no data)
↓
List/Grid of Cards
```

**Example:** `src/app/features/products/pages/overview/products-overview.page.ts`

**TypeScript Pattern:**
```typescript
import { ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ViewWillEnter, ViewWillLeave } from '@ionic/angular';

@Component({
  selector: 'app-feature-overview',
  templateUrl: './feature-overview.page.html',
  styleUrls: ['./feature-overview.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule, AppHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush // CRITICAL
})
export class FeatureOverviewPage implements OnInit, OnDestroy, ViewWillEnter, ViewWillLeave {
  items: Item[] = [];
  isLoading = true;
  private destroy$ = new Subject<void>();

  constructor(
    private useCase: ItemUseCase,
    private cdr: ChangeDetectorRef,
    private headerActions: HeaderActionsService
  ) {}

  ngOnInit(): void {
    // Subscribe to observables, setup static state
  }

  ionViewWillEnter(): void {
    // CRITICAL: Configure header and load data here (runs every time)
    this.headerActions.setPageConfig({
      title: 'feature.overview.title',
      actions: [
        { id: 'refresh', icon: 'refresh-outline', handler: () => this.refreshData() }
      ]
      // No showBackButton - shows hamburger menu (top-level page)
    });
    this.refreshData();
  }

  ionViewWillLeave(): void {
    this.headerActions.clearPageConfig();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private refreshData(): void {
    this.isLoading = true;
    this.cdr.markForCheck(); // CRITICAL for OnPush

    this.useCase.getItems()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          this.items = items;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error: JBHError) => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  canCreate(): boolean {
    return this.items.length < MAX_LIMIT;
  }
}
```

**HTML Pattern:**
```html
<app-header></app-header>

<ion-content>
  <div class="jbh-container">

    <!-- Loading State -->
    @if (isLoading) {
      <div class="jbh-loading-container">
        @for (i of [1,2,3]; track i) {
          <div class="jbh-card jbh-skeleton" style="height: 200px;"></div>
        }
      </div>
    }

    <!-- Empty State -->
    @else if (items.length === 0) {
      <div class="jbh-empty-state">
        <div class="jbh-empty-state-icon">
          <ion-icon name="folder-open-outline"></ion-icon>
        </div>
        <h2 class="jbh-empty-state-title">{{ 'feature.empty.title' | translate }}</h2>
        <p class="jbh-empty-state-message">{{ 'feature.empty.message' | translate }}</p>
        @if (canCreate()) {
          <button class="jbh-button-primary" (click)="navigateToCreate()">
            <ion-icon name="add-outline"></ion-icon>
            <span>{{ 'feature.empty.cta' | translate }}</span>
          </button>
        }
      </div>
    }

    <!-- List/Grid -->
    @else {
      <div class="jbh-items-list">
        @for (item of items; track item.id) {
          <app-item-card [item]="item"></app-item-card>
        }
      </div>
    }

  </div>
</ion-content>
```

**When to Use:**
- Product listings
- Team management
- Dashboards with entity grids
- Any collection display

---

### B. Create/Edit Form Pages

**Purpose:** Data entry for creating or modifying entities

**Structure:**
```
Header (with back button)
↓
Form Card
  ├─ Icon + Title + Subtitle
  ├─ Form Fields
  └─ Submit Button
```

**Example:** Forms in products, teams, auth features

**TypeScript Pattern:**
```typescript
@Component({
  selector: 'app-create-item',
  templateUrl: './create-item.page.html',
  styleUrls: ['./create-item.page.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateItemPage implements OnInit, OnDestroy, ViewWillEnter, ViewWillLeave {
  itemForm!: FormGroup;
  isSubmitting = false;
  selectInterface = 'action-sheet'; // Mobile native select
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
    private headerActions: HeaderActionsService,
    private viewportService: ViewportService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.selectInterface = this.viewportService.selectInterface;
  }

  ionViewWillEnter(): void {
    this.headerActions.setPageConfig({
      title: 'feature.create.title',
      showBackButton: true // CRITICAL: Shows back button (detail page)
    });
  }

  ionViewWillLeave(): void {
    this.headerActions.clearPageConfig();
  }

  private initForm(): void {
    this.itemForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      type: ['', Validators.required],
      description: ['', Validators.maxLength(200)]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.itemForm.invalid) {
      this.markFormGroupTouched(this.itemForm);
      return;
    }

    this.isSubmitting = true;
    this.cdr.markForCheck();

    // Handle submission...
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }

  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.itemForm.get(fieldName);
    if (!field) return false;
    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.itemForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.hasError('required')) {
      return this.translationService.instant(`feature.${fieldName}.required`);
    }
    if (field.hasError('minlength')) {
      const minLength = field.errors['minlength'].requiredLength;
      return this.translationService.instant(`feature.${fieldName}.minlength`, { minLength });
    }
    return this.translationService.instant('validation.generic');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

**HTML Pattern:**
```html
<app-header></app-header>

<ion-content>
  <div class="jbh-container">
    <div class="jbh-form-card">

      <!-- Header -->
      <div class="jbh-form-header">
        <div class="jbh-form-icon">
          <ion-icon name="document-text-outline"></ion-icon>
        </div>
        <h1 class="jbh-form-title">{{ 'feature.create.title' | translate }}</h1>
        <p class="jbh-form-subtitle">{{ 'feature.create.subtitle' | translate }}</p>
      </div>

      <!-- Form -->
      <form [formGroup]="itemForm" (ngSubmit)="onSubmit()" class="jbh-form-animated">

        <!-- Text Input -->
        <div class="jbh-form-field">
          <label class="jbh-label">{{ 'feature.name.label' | translate }}</label>
          <div class="jbh-input-wrapper">
            <ion-icon name="pencil-outline" class="jbh-input-icon left"></ion-icon>
            <input
              type="text"
              class="jbh-input jbh-input-icon-left"
              formControlName="name"
              [placeholder]="'feature.name.placeholder' | translate"
              [class.error]="hasError('name')"
            />
          </div>
          @if (hasError('name')) {
            <div class="jbh-field-error">
              <ion-icon name="information-circle"></ion-icon>
              <span>{{ getErrorMessage('name') }}</span>
            </div>
          }
        </div>

        <!-- ion-select (Mobile Native) -->
        <div class="jbh-form-field">
          <label class="jbh-label">{{ 'feature.type.label' | translate }}</label>
          <div class="jbh-ion-select-wrapper" [class.error]="hasError('type')">
            <ion-icon name="list-outline" class="jbh-ion-select-icon"></ion-icon>
            <ion-select
              formControlName="type"
              [placeholder]="'feature.type.placeholder' | translate"
              [interface]="selectInterface"
              class="jbh-ion-select"
            >
              @for (option of typeOptions; track option.value) {
                <ion-select-option [value]="option.value">
                  {{ option.label | translate }}
                </ion-select-option>
              }
            </ion-select>
          </div>
          @if (hasError('type')) {
            <div class="jbh-field-error">
              <ion-icon name="information-circle"></ion-icon>
              <span>{{ getErrorMessage('type') }}</span>
            </div>
          }
        </div>

        <!-- Textarea -->
        <div class="jbh-form-field">
          <label class="jbh-label">{{ 'feature.description.label' | translate }}</label>
          <textarea
            class="jbh-textarea"
            formControlName="description"
            rows="4"
            [placeholder]="'feature.description.placeholder' | translate"
            [class.error]="hasError('description')"
          ></textarea>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          class="jbh-button-primary jbh-button-block"
          [disabled]="isSubmitting || itemForm.invalid"
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

**When to Use:**
- Creating new entities
- Editing existing entities
- User registration
- Settings forms

---

### C. Detail/View Pages

**Purpose:** Display detailed information about a single entity

**Structure:**
```
Header (with back button)
↓
Content Cards
  ├─ Summary Card
  ├─ Related Data (tables, charts)
  └─ Action Buttons
```

**Example:** Balance History page

**Pattern:**
```html
<app-header></app-header>

<ion-content>
  <div class="jbh-container">

    <!-- Summary Cards -->
    <div class="jbh-balance-summary">
      @for (card of summaryCards; track card.id) {
        <div class="jbh-summary-card">
          <div class="jbh-summary-card-icon">
            <ion-icon [name]="card.icon"></ion-icon>
          </div>
          <div class="jbh-summary-card-label">{{ card.label | translate }}</div>
          <div class="jbh-summary-card-value" [class]="card.valueClass">
            {{ card.value | jbhCurrency }}
          </div>
        </div>
      }
    </div>

    <!-- Chart Component -->
    <app-balance-chart [data]="chartData"></app-balance-chart>

    <!-- Data Table Component -->
    <app-balance-history-table [records]="records"></app-balance-history-table>

  </div>
</ion-content>
```

**When to Use:**
- Viewing entity details
- Reports and analytics
- Historical data display
- Multi-component layouts

---

### D. Authentication Pages

**Purpose:** User login, registration, password reset

**Structure:**
```
Fullscreen Background
↓
Elevated Card (centered)
  ├─ Logo/Icon
  ├─ Form
  ├─ Submit Button
  └─ Social Login (optional)
```

**Example:** `src/app/features/auth/pages/login/login.page.ts`

**Unique Styling:**
- Fullscreen background with gradient or pattern
- Elevated card with large shadow
- No app-header component
- Centered layout

**HTML Pattern:**
```html
<ion-content [fullscreen]="true">
  <div class="auth-background">

    <div class="jbh-form-card auth-card">
      <div class="jbh-form-header">
        <div class="jbh-form-icon">
          <ion-icon name="shield-checkmark"></ion-icon>
        </div>
        <h1 class="jbh-form-title">{{ 'auth.login.title' | translate }}</h1>
        <p class="jbh-form-subtitle">{{ 'auth.login.subtitle' | translate }}</p>
      </div>

      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
        <!-- Form fields... -->
      </form>

      <!-- Divider -->
      <div class="jbh-divider">
        <span>{{ 'auth.or' | translate }}</span>
      </div>

      <!-- Social Login -->
      <button class="jbh-button-outline jbh-button-block">
        <ion-icon name="logo-google"></ion-icon>
        <span>{{ 'auth.login.google' | translate }}</span>
      </button>
    </div>

  </div>
</ion-content>
```

**When to Use:**
- Login
- Registration
- Password reset
- Email verification

---

### E. Dashboard Pages

**Purpose:** Home/landing page with overview and quick actions

**Structure:**
```
Header
↓
Greeting Section
↓
Summary Cards (metrics)
↓
Context-Based Actions
↓
Recent Activity (optional)
```

**Example:** `src/app/features/dashboard/pages/dashboard/dashboard.page.ts`

**Pattern:**
```html
<app-header></app-header>

<ion-content>
  <div class="jbh-container">

    <!-- Greeting -->
    <div class="jbh-page-header">
      <div class="jbh-page-header-content">
        <div class="jbh-page-header-icon">
          <ion-icon name="home-outline"></ion-icon>
        </div>
        <div>
          <h1 class="jbh-page-title">{{ greeting }}</h1>
          <p class="jbh-page-subtitle">{{ subtitle | translate }}</p>
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="jbh-balance-summary">
      <!-- Cards... -->
    </div>

    <!-- Quick Actions -->
    <div class="jbh-page-header-actions">
      <button class="jbh-button-primary" (click)="navigateToCreate()">
        <ion-icon name="add-outline"></ion-icon>
        <span>{{ 'dashboard.quick.create' | translate }}</span>
      </button>
    </div>

  </div>
</ion-content>
```

**When to Use:**
- Home page
- Landing after login
- Overview with quick access

---

## 3. Component Library

### Reusable Components

#### app-header
**Location:** `src/app/shared/components/app-header/`

**Purpose:** Global navigation header with hamburger menu or back button

**Usage:**
```html
<app-header></app-header>
```

**Configuration (in page's ionViewWillEnter):**
```typescript
this.headerActions.setPageConfig({
  title: 'page.title', // Translation key
  showBackButton: true, // true = back button, false/omit = hamburger menu
  actions: [ // Optional action buttons
    {
      id: 'refresh',
      icon: 'refresh-outline',
      handler: () => this.refreshData()
    }
  ]
});
```

**When to Use:**
- All pages except auth pages
- Top-level pages: hamburger menu (showBackButton: false or omitted)
- Detail pages: back button (showBackButton: true)

---

#### app-menu
**Location:** `src/app/shared/components/app-menu/`

**Purpose:** Side navigation menu (hamburger)

**Features:**
- Gradient header with app logo
- Collapsible menu sections
- Active route highlighting
- Footer with version info

**When to Use:**
- Automatically included in app layout
- Do not directly use in pages

---

#### product-card
**Location:** `src/app/features/products/components/product-card/`

**Purpose:** Display product information with balances and actions

**Inputs:**
```typescript
@Input() product!: ProductListItem;
```

**Outputs:**
```typescript
@Output() toggleStatus = new EventEmitter<ProductListItem>();
@Output() editProduct = new EventEmitter<ProductListItem>();
@Output() transferProduct = new EventEmitter<ProductListItem>();
@Output() deleteProduct = new EventEmitter<ProductListItem>();
```

**Usage:**
```html
<app-product-card
  [product]="product"
  (toggleStatus)="handleToggleStatus($event)"
  (editProduct)="handleEdit($event)"
  (transferProduct)="handleTransfer($event)"
  (deleteProduct)="handleDelete($event)"
></app-product-card>
```

**When to Use:**
- Product listings
- Product overview pages
- Product search results

---

#### balance-summary-cards
**Location:** `src/app/features/products/components/balance-summary-cards/`

**Purpose:** Display 4-card grid with balance metrics

**Inputs:**
```typescript
@Input() currentBalance: number = 0;
@Input() movementBalance: number = 0;
@Input() netProfit: number = 0;
@Input() growthRate: number = 0;
```

**Usage:**
```html
<app-balance-summary-cards
  [currentBalance]="summary.currentBalance"
  [movementBalance]="summary.movementBalance"
  [netProfit]="summary.netProfit"
  [growthRate]="summary.growthRate"
></app-balance-summary-cards>
```

**When to Use:**
- Dashboard
- Product detail pages
- Balance history pages

---

#### balance-chart
**Location:** `src/app/features/products/components/balance-chart/`

**Purpose:** ngx-charts line chart wrapper for balance trends

**Inputs:**
```typescript
@Input() data: ChartDataPoint[] = [];
```

**Critical Configuration:**
```html
<ngx-charts-line-chart
  [animations]="false"  <!-- CRITICAL: Always disable -->
  ...
>
</ngx-charts-line-chart>
```

**When to Use:**
- Balance history visualization
- Trend analysis
- Performance charts

**Never:**
- Enable animations (Angular 20 incompatibility)

---

#### balance-history-table
**Location:** `src/app/features/products/components/balance-history-table/`

**Purpose:** Responsive table/cards for balance records

**Inputs:**
```typescript
@Input() records: MonthlyBalanceModel[] = [];
@Input() isLoading = false;
```

**Responsive Behavior:**
- Desktop: Table with headers
- Mobile: Cards

**When to Use:**
- Historical data display
- Monthly records
- Transaction lists

---

#### balance-history-filter
**Location:** `src/app/features/products/components/balance-history-filter/`

**Purpose:** Date range and product filter controls

**Inputs/Outputs:**
```typescript
@Input() products: ProductListItem[] = [];
@Output() filterChange = new EventEmitter<FilterCriteria>();
@Output() clearFilter = new EventEmitter<void>();
```

**When to Use:**
- Pages with date-based data
- Multi-product filtering
- Report generation

---

#### portfolio-context-switcher
**Location:** `src/app/shared/components/portfolio-context-switcher/`

**Purpose:** Switch between personal and team portfolios

**Usage:**
```html
<app-portfolio-context-switcher></app-portfolio-context-switcher>
```

**When to Use:**
- Pages that support team context
- Embedded in app-menu

---

#### portfolio-top-banner
**Location:** `src/app/shared/components/portfolio-top-banner/`

**Purpose:** Display current context (personal/team) at top of page

**Usage:**
```html
<app-portfolio-top-banner></app-portfolio-top-banner>
```

**When to Use:**
- Pages where context is critical
- After context switcher interaction

---

## 4. State Patterns

### A. Loading States

#### Skeleton Pattern (Recommended)
**Purpose:** CSS-only animation for smooth loading UX

**Usage:**
```html
@if (isLoading) {
  <div class="jbh-loading-container">
    @for (i of [1,2,3]; track i) {
      <div class="jbh-card jbh-skeleton" style="height: 200px;"></div>
    }
  </div>
}
```

**Available Skeleton Classes:**
- `jbh-skeleton` - Base skeleton with shimmer animation
- `jbh-skeleton-input` - Input field (52px height)
- `jbh-skeleton-select` - Select field (52px height)
- `jbh-skeleton-label` - Label (16px height, 100px width)
- `jbh-skeleton-chart` - Chart container (300-400px height)
- `jbh-skeleton-table` - Table container (400px height)

**When to Use:**
- Page-level loading
- Component-level loading
- Data table loading

---

#### Spinner Pattern
**Purpose:** Small component loading

**Usage:**
```html
@if (isLoading) {
  <ion-spinner name="crescent"></ion-spinner>
}
```

**When to Use:**
- Button loading state
- Small component loading
- Inline loading indicator

---

#### Multiple Loading States
**Pattern:**
```typescript
isLoadingPage = true;      // Full page data
isLoadingDropdown = false; // Dependent dropdown
isLoadingMetadata = false; // Additional metadata
isSubmitting = false;      // Form submission
```

**Example:**
```html
<!-- Page Loading -->
@if (isLoadingPage) {
  <div class="jbh-skeleton" style="height: 300px;"></div>
}

<!-- Dropdown Loading -->
<ion-select [disabled]="isLoadingDropdown">
  @if (isLoadingDropdown) {
    <ion-select-option>{{ 'common.loading' | translate }}</ion-select-option>
  }
</ion-select>

<!-- Button Loading -->
<button
  [disabled]="isSubmitting"
  [class.jbh-button-loading]="isSubmitting"
>
  @if (isSubmitting) {
    <ion-spinner name="crescent"></ion-spinner>
  }
</button>
```

---

### B. Empty States

#### Structure
```html
<div class="jbh-empty-state">
  <div class="jbh-empty-state-icon">
    <ion-icon name="folder-open-outline"></ion-icon>
  </div>
  <h2 class="jbh-empty-state-title">{{ 'feature.empty.title' | translate }}</h2>
  <p class="jbh-empty-state-message">{{ 'feature.empty.message' | translate }}</p>
  @if (canCreate()) {
    <button class="jbh-button-primary" (click)="create()">
      <ion-icon name="add-outline"></ion-icon>
      <span>{{ 'feature.empty.cta' | translate }}</span>
    </button>
  }
</div>
```

**Conditional Empty States:**
```typescript
// No data at all
get hasNoData(): boolean {
  return !this.isLoading && this.items.length === 0 && !this.hasActiveFilter;
}

// No results for current filter
get hasNoResults(): boolean {
  return !this.isLoading && this.items.length === 0 && this.hasActiveFilter;
}
```

```html
@if (hasNoData) {
  <div class="jbh-empty-state">
    <!-- "Get started" message with create button -->
  </div>
} @else if (hasNoResults) {
  <div class="jbh-empty-state">
    <!-- "No results found" message with clear filter button -->
  </div>
}
```

**Permission-Based CTA:**
```html
@if (canCreate()) {
  <button class="jbh-button-primary" (click)="create()">...</button>
} @else {
  <p class="jbh-text-muted">{{ 'feature.empty.limit' | translate }}</p>
}
```

---

### C. Error States

#### Toast Notifications
**Purpose:** User-facing error messages

**Pattern:**
```typescript
private async showErrorToast(message: string): Promise<void> {
  const toast = await this.toastController.create({
    message,
    duration: 3000,
    position: 'top',
    color: 'danger',
    buttons: [{ text: 'OK', role: 'cancel' }]
  });
  await toast.present();
}
```

**Usage:**
```typescript
error: (error: JBHError) => {
  const message = error.isValidationError
    ? error.message // 422: Show server message
    : this.translationService.instant('feature.error.generic');
  this.showErrorToast(message);
}
```

---

#### Inline Validation Errors
**Purpose:** Form field errors

**Pattern:**
```html
@if (hasError('fieldName')) {
  <div class="jbh-field-error">
    <ion-icon name="information-circle"></ion-icon>
    <span>{{ getErrorMessage('fieldName') }}</span>
  </div>
}
```

---

#### Confirmation Dialogs
**Purpose:** Confirm destructive actions

**Pattern:**
```typescript
private async confirmDelete(item: Item): Promise<boolean> {
  const alert = await this.alertController.create({
    header: this.translationService.instant('feature.delete.title'),
    message: this.translationService.instant('feature.delete.message', { name: item.name }),
    buttons: [
      { text: this.translationService.instant('common.cancel'), role: 'cancel' },
      { text: this.translationService.instant('common.delete'), role: 'destructive' }
    ]
  });
  await alert.present();
  const { role } = await alert.onDidDismiss();
  return role === 'destructive';
}
```

---

### D. Success States

#### Toast Notifications
```typescript
private async showSuccessToast(message: string): Promise<void> {
  const toast = await this.toastController.create({
    message,
    duration: 2000,
    position: 'top',
    color: 'success',
    icon: 'checkmark-circle'
  });
  await toast.present();
}
```

#### Success Icons
```html
<div class="jbh-input-status-icon success">
  <ion-icon name="checkmark-circle"></ion-icon>
</div>
```

---

## 5. Layout System

### A. Containers

#### jbh-container
**Purpose:** Standard centered container for page content

**Properties:**
- Max-width: 440px (mobile), 80% (desktop > 1024px)
- Padding: 24px (mobile), 32px (tablet+)
- Centered with `margin: 0 auto`

**Usage:**
```html
<ion-content>
  <div class="jbh-container">
    <!-- Page content -->
  </div>
</ion-content>
```

**When to Use:**
- All standard pages
- Form pages
- List pages

---

#### jbh-container-wide
**Purpose:** Wider container for dashboard/reports

**Properties:**
- Max-width: 1200px
- Otherwise same as jbh-container

**Usage:**
```html
<div class="jbh-container jbh-container-wide">
  <!-- Wide content like charts, tables -->
</div>
```

**When to Use:**
- Dashboards
- Reports with charts
- Data tables
- Wide layouts

---

### B. Grid System

#### Ionic Grid
**Purpose:** Responsive column layouts

**Breakpoints:**
- xs: 0-575px
- sm: 576-767px
- md: 768-991px
- lg: 992-1199px
- xl: 1200px+

**Usage:**
```html
<ion-grid>
  <ion-row>
    <ion-col size="12" sizeMd="6" sizeLg="4">
      <!-- Full width mobile, half tablet, third desktop -->
    </ion-col>
  </ion-row>
</ion-grid>
```

**Common Patterns:**
```html
<!-- 2 columns on mobile, 4 on desktop -->
<div class="jbh-balance-summary">
  <!-- Uses CSS Grid: grid-template-columns: repeat(2, 1fr) on mobile -->
  <!-- Responsive: repeat(4, 1fr) on desktop -->
</div>
```

---

### C. Cards & Sections

#### Cards
```html
<!-- Standard card -->
<div class="jbh-card">
  <!-- Content -->
</div>

<!-- Elevated card (larger shadow) -->
<div class="jbh-card-elevated">
  <!-- Content -->
</div>

<!-- Flat card (border, no shadow) -->
<div class="jbh-card-flat">
  <!-- Content -->
</div>

<!-- Form card (elevated + slide-up animation) -->
<div class="jbh-form-card">
  <!-- Form content -->
</div>
```

**When to Use Each:**
- `jbh-card`: Default for most content cards
- `jbh-card-elevated`: Important cards, forms, modals
- `jbh-card-flat`: Subtle separation, nested cards
- `jbh-form-card`: All form containers

---

#### Section Dividers
```html
<div class="jbh-divider">
  <span>{{ 'common.or' | translate }}</span>
</div>
```

---

## 6. Navigation Patterns

### A. Header Configuration

#### App Header vs. Custom Header
**Use app-header for:**
- All standard pages
- Consistent navigation experience

**Use custom ion-header for:**
- None (deprecated pattern)
- Legacy pages only

**Pattern:**
```html
<!-- ✅ CORRECT -->
<app-header></app-header>

<!-- ❌ AVOID -->
<ion-header>
  <ion-toolbar>...</ion-toolbar>
</ion-header>
```

---

#### Back Button vs. Hamburger Menu

**Top-Level Pages (Hamburger Menu):**
```typescript
ionViewWillEnter(): void {
  this.headerActions.setPageConfig({
    title: 'products.overview.title',
    actions: [
      { id: 'refresh', icon: 'refresh-outline', handler: () => this.refresh() }
    ]
    // No showBackButton or showBackButton: false
  });
}
```

**Detail Pages (Back Button):**
```typescript
ionViewWillEnter(): void {
  this.headerActions.setPageConfig({
    title: 'products.edit.title',
    showBackButton: true // CRITICAL
  });
}
```

**Examples:**
- Top-level: /products/overview, /teams/overview, /dashboard
- Detail: /products/edit/:id, /balance-history/:productId

---

### B. In-Page Navigation

#### Links
```html
<a class="jbh-link" routerLink="/path">{{ 'link.text' | translate }}</a>

<!-- Muted link -->
<a class="jbh-link-muted" routerLink="/path">{{ 'link.text' | translate }}</a>
```

#### Expandable Sections
**Example:** Team cards with member list

```typescript
isExpanded = false;

toggleExpanded(): void {
  this.isExpanded = !this.isExpanded;
  this.cdr.markForCheck();
}
```

```html
<div class="team-card">
  <div class="team-header" (click)="toggleExpanded()">
    <span>Team Name</span>
    <ion-icon [name]="isExpanded ? 'chevron-up' : 'chevron-down'"></ion-icon>
  </div>

  @if (isExpanded) {
    <div class="team-members">
      <!-- Member list -->
    </div>
  }
</div>
```

---

### C. Ionic Lifecycle (CRITICAL)

**Why This Matters:**
- Ionic reuses component instances when navigating
- `ngOnInit()` only runs ONCE per component instance
- `ionViewWillEnter()` runs EVERY TIME the page is displayed

**Lifecycle Methods:**

```typescript
ngOnInit(): void {
  // Run ONCE per component instance
  // ✅ Form initialization
  // ✅ Static setup
  // ✅ Event subscriptions (with takeUntil)
  // ❌ API calls (will only run first time)

  this.initForm();
  this.subscribeToEvents();
}

ionViewWillEnter(): void {
  // Run EVERY TIME the page is displayed
  // ✅ API calls
  // ✅ Data refresh
  // ✅ Header configuration
  // ✅ Dynamic state reset

  this.headerActions.setPageConfig({ ... });
  this.refreshData();
}

ionViewWillLeave(): void {
  // Run EVERY TIME the page is left
  // ✅ Clear header config
  // ✅ Blur active element (prevents iOS keyboard issues)

  this.headerActions.clearPageConfig();
  const activeElement = document.activeElement as HTMLElement;
  if (activeElement && activeElement.blur) {
    activeElement.blur();
  }
}

ngOnDestroy(): void {
  // Run when component is destroyed
  // ✅ Cleanup subscriptions

  this.destroy$.next();
  this.destroy$.complete();
}
```

**Common Mistakes:**
```typescript
// ❌ BAD: API call in ngOnInit (only runs once!)
ngOnInit(): void {
  this.loadData(); // Will not refresh when navigating back!
}

// ✅ GOOD: API call in ionViewWillEnter (runs every time)
ionViewWillEnter(): void {
  this.loadData(); // Refreshes every time page is displayed
}
```

---

## 7. Form Patterns

### A. Field Types

#### Text Input with Icon
```html
<div class="jbh-form-field">
  <label class="jbh-label">{{ 'field.label' | translate }}</label>
  <div class="jbh-input-wrapper">
    <ion-icon name="person-outline" class="jbh-input-icon left"></ion-icon>
    <input
      type="text"
      class="jbh-input jbh-input-icon-left"
      formControlName="fieldName"
      [placeholder]="'field.placeholder' | translate"
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
```

---

#### Select/Dropdown (ion-select)
**CRITICAL:** Always use `ion-select`, never native `<select>`

```html
<div class="jbh-form-field">
  <label class="jbh-label">{{ 'field.label' | translate }}</label>
  <div class="jbh-ion-select-wrapper" [class.error]="hasError('fieldName')">
    <ion-icon name="list-outline" class="jbh-ion-select-icon"></ion-icon>
    <ion-select
      formControlName="fieldName"
      [placeholder]="'field.placeholder' | translate"
      [interface]="selectInterface"
      class="jbh-ion-select"
    >
      @for (option of options; track option.value) {
        <ion-select-option [value]="option.value">
          {{ option.label | translate }}
        </ion-select-option>
      }
    </ion-select>
  </div>
</div>
```

**Interface Options:**
- `action-sheet` - Bottom sheet (recommended for mobile)
- `alert` - Modal dialog
- `popover` - Dropdown (better for tablets)

**TypeScript Setup:**
```typescript
selectInterface = 'action-sheet';

ngOnInit(): void {
  this.selectInterface = this.viewportService.selectInterface;
}
```

---

#### Date Picker (ion-datetime)
```html
<div class="jbh-form-field">
  <label class="jbh-label">{{ 'field.date.label' | translate }}</label>
  <ion-button
    expand="block"
    fill="outline"
    id="open-date-picker"
    class="jbh-datetime-button"
    [class.error]="hasError('date')"
  >
    {{ selectedDate || ('field.date.placeholder' | translate) }}
  </ion-button>

  <ion-modal trigger="open-date-picker">
    <ng-template>
      <ion-datetime
        presentation="date"
        [(ngModel)]="selectedDate"
        [max]="maxDate"
        (ionChange)="onDateChange($event)"
      ></ion-datetime>
    </ng-template>
  </ion-modal>
</div>
```

---

#### Toggle/Boolean
```html
<div class="jbh-form-field">
  <div class="jbh-status-toggle">
    <span class="jbh-status-label">{{ 'field.active.label' | translate }}</span>
    <ion-toggle formControlName="isActive"></ion-toggle>
  </div>
</div>
```

---

#### Textarea with Counter
```html
<div class="jbh-form-field">
  <label class="jbh-label">{{ 'field.description.label' | translate }}</label>
  <textarea
    class="jbh-textarea"
    formControlName="description"
    rows="4"
    maxlength="200"
    [placeholder]="'field.description.placeholder' | translate"
    [class.error]="hasError('description')"
  ></textarea>
  <div class="jbh-field-counter">
    {{ form.get('description')?.value?.length || 0 }} / 200
  </div>
</div>
```

---

#### Async Validation with Status Icons
```html
<div class="jbh-input-wrapper">
  <input
    class="jbh-input jbh-input-icon-right"
    formControlName="username"
    [class.success]="isUsernameAvailable"
    [class.error]="hasError('username')"
  />

  @if (isCheckingUsername) {
    <ion-spinner class="jbh-input-status-icon"></ion-spinner>
  } @else if (isUsernameAvailable) {
    <ion-icon name="checkmark-circle" class="jbh-input-status-icon success"></ion-icon>
  } @else if (hasError('username')) {
    <ion-icon name="close-circle" class="jbh-input-status-icon error"></ion-icon>
  }
</div>
```

---

### B. Validation

#### hasError() Method
```typescript
hasError(fieldName: string, errorType?: string): boolean {
  const field = this.myForm.get(fieldName);
  if (!field) return false;

  if (errorType) {
    return field.hasError(errorType) && (field.dirty || field.touched);
  }
  return field.invalid && (field.dirty || field.touched);
}
```

**Usage:**
```html
[class.error]="hasError('email')"
[class.error]="hasError('email', 'email')" <!-- Specific error type -->

@if (hasError('email')) { ... }
```

---

#### getErrorMessage() Method
```typescript
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
  if (field.hasError('email')) {
    return this.translationService.instant('validation.email');
  }
  if (field.hasError('pattern')) {
    return this.translationService.instant('validation.pattern');
  }

  return this.translationService.instant('validation.generic');
}
```

---

#### Form-Level Validation
```typescript
onSubmit(): void {
  if (this.myForm.invalid) {
    this.markFormGroupTouched(this.myForm);
    return;
  }
  // Proceed with submission
}

private markFormGroupTouched(formGroup: FormGroup): void {
  Object.keys(formGroup.controls).forEach(key => {
    formGroup.get(key)?.markAsTouched();
  });
}
```

---

### C. Dynamic Forms

#### Metadata-Driven Form Fields
**Pattern:**
```typescript
interface FieldMetadata {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date';
  required: boolean;
  options?: { value: string; label: string }[];
}

fieldMetadata: FieldMetadata[] = [];

ngOnInit(): void {
  this.loadFieldMetadata();
}

private loadFieldMetadata(): void {
  this.metadataUseCase.getFields()
    .subscribe(metadata => {
      this.fieldMetadata = metadata;
      this.buildDynamicForm();
      this.cdr.markForCheck();
    });
}

private buildDynamicForm(): void {
  const group: any = {};
  this.fieldMetadata.forEach(field => {
    const validators = field.required ? [Validators.required] : [];
    group[field.key] = ['', validators];
  });
  this.dynamicForm = this.formBuilder.group(group);
}
```

**Template:**
```html
@for (field of fieldMetadata; track field.key) {
  <div class="jbh-form-field">
    <label class="jbh-label">{{ field.label }}</label>

    @if (field.type === 'text') {
      <input class="jbh-input" [formControlName]="field.key" />
    } @else if (field.type === 'select') {
      <div class="jbh-ion-select-wrapper">
        <ion-select [formControlName]="field.key" class="jbh-ion-select">
          @for (option of field.options; track option.value) {
            <ion-select-option [value]="option.value">
              {{ option.label }}
            </ion-select-option>
          }
        </ion-select>
      </div>
    }

    @if (hasError(field.key)) {
      <div class="jbh-field-error">
        <ion-icon name="information-circle"></ion-icon>
        <span>{{ getErrorMessage(field.key) }}</span>
      </div>
    }
  </div>
}
```

---

## 8. Data Display

### A. Tables (Responsive)

**Desktop Pattern:**
```html
<!-- Desktop: Table with headers -->
<div class="jbh-table jbh-hide-mobile">
  <div class="jbh-table-header">
    <div class="jbh-table-cell jbh-cell-name">{{ 'table.name' | translate }}</div>
    <div class="jbh-table-cell jbh-cell-email">{{ 'table.email' | translate }}</div>
    <div class="jbh-table-cell jbh-cell-status">{{ 'table.status' | translate }}</div>
    <div class="jbh-table-cell jbh-cell-actions">{{ 'table.actions' | translate }}</div>
  </div>

  @for (row of data; track row.id) {
    <div class="jbh-table-row">
      <div class="jbh-table-cell jbh-cell-name">{{ row.name }}</div>
      <div class="jbh-table-cell jbh-cell-email">{{ row.email }}</div>
      <div class="jbh-table-cell jbh-cell-status">
        <span class="jbh-status-badge" [class]="'status-' + row.status">
          {{ 'status.' + row.status | translate }}
        </span>
      </div>
      <div class="jbh-table-cell jbh-cell-actions">
        <button class="jbh-icon-button" (click)="edit(row)">
          <ion-icon name="create-outline"></ion-icon>
        </button>
      </div>
    </div>
  }
</div>
```

**Mobile Pattern:**
```html
<!-- Mobile: Cards -->
<div class="jbh-cards jbh-hide-desktop">
  @for (row of data; track row.id) {
    <div class="jbh-member-card">
      <div class="jbh-member-card-header">
        <div class="jbh-member-card-info">
          <div class="jbh-member-name">{{ row.name }}</div>
          <div class="jbh-member-email">{{ row.email }}</div>
        </div>
        <span class="jbh-status-badge" [class]="'status-' + row.status">
          {{ 'status.' + row.status | translate }}
        </span>
      </div>
      <div class="jbh-member-card-footer">
        <span class="jbh-role-badge jbh-role-{{ row.role }}">
          {{ 'role.' + row.role | translate }}
        </span>
        <button class="jbh-icon-button" (click)="edit(row)">
          <ion-icon name="create-outline"></ion-icon>
        </button>
      </div>
    </div>
  }
</div>
```

**Column Sizing (CSS):**
```scss
// Component SCSS (layout only)
.jbh-cell-name { flex: 2; }
.jbh-cell-email { flex: 2; }
.jbh-cell-status { flex: 1.5; }
.jbh-cell-role { flex: 1; }
.jbh-cell-actions { flex: 1; justify-content: flex-end; }
```

---

### B. Badges

#### Status Badges
```html
<span class="jbh-status-badge status-accepted">
  <ion-icon name="checkmark-circle"></ion-icon>
  {{ 'status.accepted' | translate }}
</span>

<span class="jbh-status-badge status-pending">
  <ion-icon name="time-outline"></ion-icon>
  {{ 'status.pending' | translate }}
</span>

<span class="jbh-status-badge status-declined">
  <ion-icon name="close-circle"></ion-icon>
  {{ 'status.declined' | translate }}
</span>
```

**Available Status Classes:**
- `status-accepted` - Green background
- `status-pending` - Yellow/warning background
- `status-declined` - Red/error background

---

#### Role Badges
```html
<span class="jbh-role-badge jbh-role-owner">
  <ion-icon name="shield-checkmark"></ion-icon>
  {{ 'role.owner' | translate }}
</span>

<span class="jbh-role-badge jbh-role-member">
  <ion-icon name="person"></ion-icon>
  {{ 'role.member' | translate }}
</span>
```

---

#### Limit Badge
```html
<span class="jbh-limit-badge">
  {{ current }} / {{ max }}
</span>
```

---

#### Dynamic CSS Classes
**Pattern:**
```html
<span class="jbh-status-badge" [class]="'status-' + status.toLowerCase()">
  {{ 'status.' + status | translate }}
</span>
```

**TypeScript:**
```typescript
// ❌ BAD: Getter method (called on every change detection)
get statusClass(): string {
  return 'status-' + this.status.toLowerCase();
}

// ✅ GOOD: Property or class binding
<span [class]="'status-' + status.toLowerCase()">
```

---

### C. Charts

#### ngx-charts Integration
```html
<div class="jbh-chart-container">
  <h3 class="jbh-chart-title">{{ 'chart.title' | translate }}</h3>

  <div class="jbh-chart-wrapper">
    <ngx-charts-line-chart
      [animations]="false"
      [results]="chartData"
      [xAxis]="true"
      [yAxis]="true"
      [legend]="false"
      [showXAxisLabel]="true"
      [showYAxisLabel]="true"
      [xAxisLabel]="'chart.xAxis' | translate"
      [yAxisLabel]="'chart.yAxis' | translate"
      [scheme]="colorScheme"
      [curve]="curve"
      [yAxisTickFormatting]="formatCurrency"
    >
    </ngx-charts-line-chart>
  </div>
</div>
```

**TypeScript:**
```typescript
import { curveMonotoneX } from 'd3-shape';

chartData: ChartDataPoint[] = [];
curve = curveMonotoneX;
colorScheme = {
  domain: ['#667eea', '#764ba2', '#48bb78']
};

// CRITICAL: Use callback, not getter
formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};
```

**CRITICAL Rules:**
1. **ALWAYS** set `[animations]="false"` (Angular 20 compatibility)
2. **NEVER** use getter methods for formatting callbacks
3. **USE** arrow functions or cached formatters

---

## 9. Interactive Elements

### A. Buttons

#### Primary Button
```html
<button class="jbh-button-primary">
  <ion-icon name="add-outline"></ion-icon>
  <span>{{ 'button.create' | translate }}</span>
</button>
```

#### Secondary Button
```html
<button class="jbh-button-secondary">
  <span>{{ 'button.cancel' | translate }}</span>
</button>
```

#### Outline Button
```html
<button class="jbh-button-outline">
  <ion-icon name="logo-google"></ion-icon>
  <span>{{ 'button.google' | translate }}</span>
</button>
```

#### Text Button
```html
<button class="jbh-button-text">
  <span>{{ 'button.learnMore' | translate }}</span>
</button>
```

#### Danger Button
```html
<button class="jbh-button-danger">
  <ion-icon name="trash-outline"></ion-icon>
  <span>{{ 'button.delete' | translate }}</span>
</button>
```

#### Success Button
```html
<button class="jbh-button-success">
  <ion-icon name="checkmark-circle-outline"></ion-icon>
  <span>{{ 'button.approve' | translate }}</span>
</button>
```

---

#### Button Sizes
```html
<!-- Small -->
<button class="jbh-button-primary jbh-button-small">Small</button>

<!-- Default (no class needed) -->
<button class="jbh-button-primary">Default</button>

<!-- Large -->
<button class="jbh-button-primary jbh-button-large">Large</button>

<!-- Block (full-width) -->
<button class="jbh-button-primary jbh-button-block">Full Width</button>
```

---

#### Loading State
```html
<button
  class="jbh-button-primary jbh-button-block"
  [disabled]="isSubmitting"
  [class.jbh-button-loading]="isSubmitting"
>
  @if (isSubmitting) {
    <ion-spinner name="crescent"></ion-spinner>
    <span>{{ 'button.saving' | translate }}</span>
  } @else {
    <ion-icon name="save-outline"></ion-icon>
    <span>{{ 'button.save' | translate }}</span>
  }
</button>
```

---

### B. Icon Buttons

#### Standard Icon Button (48px recommended)
```html
<button
  class="jbh-icon-button"
  (click)="refresh()"
  title="{{ 'button.refresh' | translate }}"
  aria-label="{{ 'button.refresh' | translate }}"
>
  <ion-icon name="refresh-outline"></ion-icon>
</button>
```

**CRITICAL:**
- Current size: 36px × 36px
- Recommended: 48px × 48px for accessibility
- Always include `title` and `aria-label`

---

#### Small Icon Button (use sparingly)
```html
<button class="jbh-icon-button jbh-icon-button-small">
  <ion-icon name="close-outline"></ion-icon>
</button>
```

**Size:** 32px × 32px
**When to Use:** Inline actions, close buttons (avoid if possible)

---

#### Icon Button Variants
```html
<!-- Primary variant -->
<button class="jbh-icon-button jbh-icon-button-primary">
  <ion-icon name="heart-outline"></ion-icon>
</button>

<!-- Danger variant -->
<button class="jbh-icon-button jbh-icon-button-danger">
  <ion-icon name="trash-outline"></ion-icon>
</button>
```

---

### C. Action Patterns

#### Top-Right Page Actions
**Pattern:**
```html
<div class="jbh-page-header-actions">
  <button class="jbh-button-primary" (click)="create()">
    <ion-icon name="add-outline"></ion-icon>
    <span>{{ 'button.create' | translate }}</span>
  </button>

  <button class="jbh-icon-button" (click)="filter()">
    <ion-icon name="filter-outline"></ion-icon>
  </button>
</div>
```

---

#### Inline Row Actions
**Pattern:**
```html
<div class="jbh-action-buttons">
  <button class="jbh-icon-button" (click)="edit(row)">
    <ion-icon name="create-outline"></ion-icon>
  </button>

  <button class="jbh-icon-button jbh-icon-button-danger" (click)="delete(row)">
    <ion-icon name="trash-outline"></ion-icon>
  </button>
</div>
```

---

#### Confirmation Before Destructive Actions
**CRITICAL:** Always confirm delete, transfer, or destructive actions

```typescript
async handleDelete(item: Item): Promise<void> {
  const confirmed = await this.confirmDelete(item);
  if (!confirmed) return;

  // Proceed with deletion
}

private async confirmDelete(item: Item): Promise<boolean> {
  const alert = await this.alertController.create({
    header: this.translationService.instant('item.delete.title'),
    message: this.translationService.instant('item.delete.message', { name: item.name }),
    buttons: [
      {
        text: this.translationService.instant('common.cancel'),
        role: 'cancel'
      },
      {
        text: this.translationService.instant('common.delete'),
        role: 'destructive',
        cssClass: 'alert-button-danger'
      }
    ]
  });

  await alert.present();
  const { role } = await alert.onDidDismiss();
  return role === 'destructive';
}
```

---

## 10. Permission-Based UI

### A. Conditional Rendering

#### Permission Guards
```typescript
// Component method
canModifyProducts(): boolean {
  return this.productUseCase.canCreate() && this.products.length < MAX_LIMIT;
}

canEditTeam(team: Team): boolean {
  return team.role === 'OWNER' || this.authUseCase.isAdmin();
}
```

```html
@if (canModifyProducts()) {
  <button class="jbh-button-primary" (click)="create()">
    <ion-icon name="add-outline"></ion-icon>
    <span>{{ 'button.create' | translate }}</span>
  </button>
}

@if (canEditTeam(team)) {
  <button class="jbh-icon-button" (click)="edit(team)">
    <ion-icon name="create-outline"></ion-icon>
  </button>
}
```

---

### B. Disabled States

#### Limit-Based Disabling
```html
<button
  class="jbh-button-primary"
  [disabled]="products.length >= MAX_LIMIT"
>
  {{ 'button.create' | translate }}
</button>

@if (products.length >= MAX_LIMIT) {
  <p class="jbh-text-muted">
    {{ 'products.limit.reached' | translate: { max: MAX_LIMIT } }}
  </p>
}
```

---

#### Permission-Based Disabling
```html
<button
  class="jbh-icon-button"
  [disabled]="!canDelete(item)"
  [title]="canDelete(item) ? ('button.delete' | translate) : ('button.delete.disabled' | translate)"
>
  <ion-icon name="trash-outline"></ion-icon>
</button>
```

---

### C. Limit Error Pages

**Full-Page Pattern:**
```html
@if (hasReachedLimit) {
  <div class="jbh-limit-error">
    <div class="jbh-limit-error-icon">
      <ion-icon name="alert-circle-outline"></ion-icon>
    </div>
    <h2 class="jbh-limit-error-title">{{ 'limit.title' | translate }}</h2>
    <p class="jbh-limit-error-message">
      {{ 'limit.message' | translate: { max: MAX_TEAMS } }}
    </p>
    <button class="jbh-button-secondary" routerLink="/teams">
      <span>{{ 'button.backToTeams' | translate }}</span>
    </button>
  </div>
}
```

**Example:** Create Team page when team limit reached

---

## 11. Responsive Design

### A. Breakpoints

**Standard Breakpoints:**
- **Mobile:** 320px - 767px
- **Tablet:** 768px - 1023px
- **Desktop:** 1024px+

**Custom Breakpoints (if needed):**
```scss
// Component SCSS
@media (min-width: 768px) {
  // Tablet styles
}

@media (min-width: 1024px) {
  // Desktop styles
}
```

---

### B. Testing Devices

**Test on these viewports:**
1. **iPhone SE:** 375px (smallest common phone)
2. **iPhone 14:** 390px (standard phone)
3. **iPad:** 768px (tablet portrait)
4. **iPad Pro:** 1024px (tablet landscape)
5. **Desktop:** 1440px (standard monitor)

**Browser DevTools:**
- Chrome: Device Toolbar (Cmd+Shift+M / Ctrl+Shift+M)
- Responsive design mode

---

### C. Viewport Detection

**ViewportService:**
```typescript
// Usage in component
selectInterface = 'action-sheet';

ngOnInit(): void {
  this.selectInterface = this.viewportService.selectInterface;
  // Returns 'action-sheet' (mobile) or 'popover' (desktop)
}
```

**Window Resize Listener:**
```typescript
@HostListener('window:resize', ['$event'])
onResize(event: any): void {
  this.checkViewport();
}

private checkViewport(): void {
  this.isMobile = window.innerWidth < 768;
  this.cdr.markForCheck();
}
```

---

### D. Responsive Utilities

#### Hide on Mobile
```html
<div class="jbh-table jbh-hide-mobile">
  <!-- Desktop table -->
</div>
```

**CSS:** `@media (max-width: 767px) { display: none !important; }`

---

#### Hide on Desktop
```html
<div class="jbh-cards jbh-hide-desktop">
  <!-- Mobile cards -->
</div>
```

**CSS:** `@media (min-width: 768px) { display: none !important; }`

---

## 12. Performance Best Practices

### A. Change Detection (CRITICAL)

#### Always Use OnPush
```typescript
@Component({
  selector: 'app-my-component',
  templateUrl: './my-component.html',
  changeDetection: ChangeDetectionStrategy.OnPush // CRITICAL
})
export class MyComponent {
  constructor(private cdr: ChangeDetectorRef) {}

  loadData(): void {
    this.dataService.getData().subscribe(data => {
      this.data = data;
      this.cdr.markForCheck(); // CRITICAL for OnPush
    });
  }
}
```

**When to Call markForCheck():**
- After async operations (subscriptions, promises)
- After programmatic state changes
- After manual mutations

**Why:**
- Default change detection checks EVERY component on EVERY browser event
- OnPush only checks when:
  - @Input() changes (by reference)
  - Component events fire
  - markForCheck() is called
- Result: 10x+ performance improvement

---

### B. Formatting (CRITICAL)

#### NEVER Use Getter Methods
```typescript
// ❌ BAD: Called on EVERY change detection cycle (hundreds of times per second)
get formattedBalance(): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(this.balance);
}

get profitClass(): string {
  return this.profit >= 0 ? 'positive' : 'negative';
}
```

**Why Bad:**
- With default change detection: Called 100+ times per second
- With OnPush: Called every time component is checked
- Result: Severe performance degradation, especially in lists

---

#### ALWAYS Use Pure Pipes
```typescript
// ✅ GOOD: Pipe only called when input changes
{{ balance | jbhCurrency }}
{{ profit | jbhProfit }}
{{ growthRate | jbhGrowth }}
{{ category.translationKey | jbhTranslationKey }}
```

**Available Pipes:**
- `jbhCurrency` - Currency formatting
- `jbhProfit` - Profit with color indicator
- `jbhGrowth` - Growth rate percentage
- `jbhTranslationKey` - Parse JSON translation keys

---

#### Alternative: Property Binding
```typescript
// TypeScript
items = [
  { id: 1, profit: 500, profitClass: 'positive' },
  { id: 2, profit: -200, profitClass: 'negative' }
];

// Or use method ONCE during data mapping
private mapItems(raw: RawItem[]): Item[] {
  return raw.map(item => ({
    ...item,
    profitClass: item.profit >= 0 ? 'positive' : 'negative'
  }));
}
```

```html
<!-- Template -->
<div [class]="item.profitClass">{{ item.profit | jbhCurrency }}</div>
```

---

### C. Subscriptions (CRITICAL)

#### ALWAYS Implement OnDestroy
```typescript
export class MyComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.dataService.getData()
      .pipe(takeUntil(this.destroy$)) // CRITICAL
      .subscribe(data => {
        this.data = data;
        this.cdr.markForCheck();
      });

    this.eventService.events$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => this.handleEvent(event));
  }

  ngOnDestroy(): void {
    this.destroy$.next();    // Emit completion
    this.destroy$.complete(); // Complete the subject
  }
}
```

**Why:**
- Prevents memory leaks
- Stops background processing when component destroyed
- Critical for pages that are navigated to/from

---

### D. Lists (CRITICAL)

#### ALWAYS Use trackBy
```html
<!-- ❌ BAD: Re-renders entire list on any change -->
@for (item of items) {
  <app-item-card [item]="item"></app-item-card>
}

<!-- ✅ GOOD: Only re-renders changed items -->
@for (item of items; track item.id) {
  <app-item-card [item]="item"></app-item-card>
}
```

**Why:**
- Without track: Angular destroys and recreates ALL DOM elements
- With track: Angular only updates changed elements
- Result: 10x+ faster list updates

---

### E. Animations (CRITICAL)

#### Avoid Expensive Animations
```scss
// ❌ BAD: Triggers repaints on every frame
.animated-card {
  backdrop-filter: blur(10px); // VERY expensive
  animation: float 2s infinite;
}

// ✅ GOOD: GPU-accelerated
.animated-card {
  animation: slide-in 0.3s ease-out;
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(20px); // GPU-accelerated
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**GPU-Accelerated Properties:**
- `transform` (translate, scale, rotate)
- `opacity`

**Expensive Properties (avoid in animations):**
- `backdrop-filter`
- `filter` (blur, etc.)
- `width`, `height`
- `top`, `left`
- `margin`, `padding`

---

#### ngx-charts Animations (CRITICAL)
```html
<!-- ❌ BAD: Causes Angular 20 warnings and rendering issues -->
<ngx-charts-line-chart
  [animations]="true"
  ...
>
</ngx-charts-line-chart>

<!-- ✅ GOOD: Always disable -->
<ngx-charts-line-chart
  [animations]="false"
  ...
>
</ngx-charts-line-chart>
```

**Why:**
- ngx-charts uses `strokeDashoffset` which Angular 20 doesn't support
- Causes console warnings
- Can prevent chart elements from rendering
- Aligns with performance best practices

---

## 13. Accessibility Guidelines

> **NOTE:** Accessibility compliance is currently in progress. These are target requirements.

### A. ARIA Labels

#### Icon Buttons (CRITICAL)
```html
<!-- ❌ BAD: No context for screen readers -->
<button class="jbh-icon-button" (click)="refresh()">
  <ion-icon name="refresh-outline"></ion-icon>
</button>

<!-- ✅ GOOD: Clear label for screen readers -->
<button
  class="jbh-icon-button"
  (click)="refresh()"
  aria-label="{{ 'button.refresh' | translate }}"
  title="{{ 'button.refresh' | translate }}"
>
  <ion-icon name="refresh-outline"></ion-icon>
</button>
```

**Rule:** EVERY icon button must have `aria-label` and `title`

---

#### Tables
```html
<div class="jbh-table" role="table" aria-label="{{ 'table.members' | translate }}">
  <div class="jbh-table-header" role="rowgroup">
    <div class="jbh-table-row" role="row">
      <div class="jbh-table-cell" role="columnheader">Name</div>
      <div class="jbh-table-cell" role="columnheader">Email</div>
    </div>
  </div>

  <div class="jbh-table-body" role="rowgroup">
    @for (row of data; track row.id) {
      <div class="jbh-table-row" role="row">
        <div class="jbh-table-cell" role="cell">{{ row.name }}</div>
        <div class="jbh-table-cell" role="cell">{{ row.email }}</div>
      </div>
    }
  </div>
</div>
```

---

#### Expandable Elements
```html
<button
  (click)="toggleExpanded()"
  [attr.aria-expanded]="isExpanded"
  aria-controls="team-members"
>
  <span>Team Name</span>
  <ion-icon [name]="isExpanded ? 'chevron-up' : 'chevron-down'"></ion-icon>
</button>

<div id="team-members" [hidden]="!isExpanded">
  <!-- Content -->
</div>
```

---

#### Loading States
```html
<div role="status" aria-live="polite" aria-busy="true">
  <div class="jbh-skeleton" style="height: 200px;"></div>
  <span class="sr-only">{{ 'common.loading' | translate }}</span>
</div>
```

---

#### Error Messages
```html
<div
  role="alert"
  aria-live="assertive"
  class="jbh-field-error"
>
  <ion-icon name="information-circle"></ion-icon>
  <span>{{ errorMessage }}</span>
</div>
```

---

### B. Touch Targets

**Minimum Size:** 48px × 48px (WCAG AA)

**Current Issues:**
- Icon buttons: 36px × 36px → needs increase to 48px
- Small icon buttons: 32px × 32px → avoid using

**Spacing:**
- Minimum 8px between interactive elements
- Prevents accidental taps

**Fix (Planned):**
```scss
// src/theme/custom-components.scss
.jbh-icon-button {
  width: 48px;  // Increase from 36px
  height: 48px;

  ion-icon {
    font-size: 24px; // Increase from 20px
  }
}
```

---

### C. Color Contrast

**WCAG AA Requirements:**
- Normal text: 4.5:1 minimum
- Large text (18pt+): 3:1 minimum
- UI components: 3:1 minimum

**Current Issues:**
- `--jbh-text-tertiary` (#a0aec0) on white may not meet 4.5:1
- Review and adjust if needed

**Testing Tools:**
- Chrome DevTools: Lighthouse accessibility audit
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/

---

### D. Keyboard Navigation

**Requirements:**
- All interactive elements must be keyboard accessible
- Tab order must be logical
- Focus indicators must be visible

**Focus States:**
```scss
// Ensure visible focus indicators
button:focus,
input:focus,
select:focus {
  outline: 2px solid var(--jbh-primary-color);
  outline-offset: 2px;
}
```

**Skip to Main Content:**
```html
<!-- Add to app layout -->
<a href="#main-content" class="skip-to-main">
  {{ 'accessibility.skipToMain' | translate }}
</a>

<main id="main-content">
  <!-- Page content -->
</main>
```

```scss
.skip-to-main {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--jbh-primary-color);
  color: white;
  padding: 8px;
  z-index: 100;

  &:focus {
    top: 0;
  }
}
```

---

## 14. Internationalization (i18n)

### A. Translation Keys

#### NEVER Hardcode Text
```html
<!-- ❌ BAD -->
<h1>Products</h1>
<button>Create Product</button>

<!-- ✅ GOOD -->
<h1>{{ 'products.overview.title' | translate }}</h1>
<button>{{ 'products.create.button' | translate }}</button>
```

---

#### Namespace Pattern
**Structure:** `feature.page.element.text`

**Examples:**
```json
{
  "products": {
    "overview": {
      "title": "Products",
      "empty": {
        "title": "No products yet",
        "message": "Create your first product to get started",
        "cta": "Create Product"
      }
    },
    "create": {
      "title": "Create Product",
      "subtitle": "Add a new financial product",
      "button": "Save Product"
    }
  }
}
```

---

#### Common Namespace
**For shared text across features:**
```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "loading": "Loading...",
    "error": "An error occurred"
  }
}
```

**Usage:**
```html
<button>{{ 'common.save' | translate }}</button>
<button>{{ 'common.cancel' | translate }}</button>
```

---

### B. Both Languages (CRITICAL)

**ALWAYS add to BOTH files:**
- `src/assets/i18n/en.json`
- `src/assets/i18n/es.json`

**Sort keys alphabetically** within each section for maintainability

---

### C. Parameterized Translations

**JSON:**
```json
{
  "teams": {
    "limit": {
      "message": "You can create up to {{max}} teams"
    },
    "members": {
      "count": "{{count}} members"
    }
  }
}
```

**Usage:**
```html
<p>{{ 'teams.limit.message' | translate: { max: MAX_TEAMS } }}</p>
<span>{{ 'teams.members.count' | translate: { count: team.memberCount } }}</span>
```

---

### D. Backend Translation Keys

**API Response:**
```json
{
  "category": {
    "id": "salary",
    "translationKey": "{\"en\":\"Salary\",\"es\":\"Salario\"}"
  }
}
```

**Frontend Usage:**
```html
<!-- ✅ GOOD: Use pipe directly in template -->
<span>{{ category.translationKey | jbhTranslationKey }}</span>

<!-- ❌ BAD: Don't parse in component method (called on every change detection) -->
<span>{{ getCategoryName(category) }}</span>
```

**Component:**
```typescript
// ❌ BAD
get categoryName(): string {
  return this.parseTranslationKey(this.category.translationKey);
}

// ✅ GOOD: Just use the pipe in template
// No component method needed
```

---

## 15. Design Tokens

### Complete CSS Variables Reference

```scss
:root {
  // ==========================================
  // Brand Colors
  // ==========================================
  --jbh-primary-color: #667eea;
  --jbh-primary-dark: #5568d3;
  --jbh-secondary-color: #764ba2;
  --jbh-secondary-dark: #6a4193;

  // Gradients
  --jbh-gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --jbh-gradient-primary-hover: linear-gradient(135deg, #5568d3 0%, #6a4193 100%);

  // ==========================================
  // Semantic Colors
  // ==========================================
  --jbh-success-color: #48bb78;
  --jbh-error-color: #f56565;
  --jbh-warning-color: #ed8936;
  --jbh-info-color: #4299e1;

  // ==========================================
  // Neutral Colors
  // ==========================================
  --jbh-text-primary: #2d3748;
  --jbh-text-secondary: #718096;
  --jbh-text-tertiary: #a0aec0;
  --jbh-border-color: #e1e4e8;
  --jbh-background-light: #f7f8fa;
  --jbh-background-white: #ffffff;

  // Background Colors
  --jbh-error-background: #fff5f5;
  --jbh-success-background: #f0fff4;
  --jbh-warning-background: #fffaf0;
  --jbh-info-background: #ebf8ff;

  // ==========================================
  // Spacing Scale
  // ==========================================
  --jbh-spacing-xs: 0.5rem;    // 8px
  --jbh-spacing-sm: 1rem;      // 16px
  --jbh-spacing-md: 1.5rem;    // 24px
  --jbh-spacing-lg: 2rem;      // 32px
  --jbh-spacing-xl: 3rem;      // 48px
  --jbh-spacing-2xl: 4rem;     // 64px

  // ==========================================
  // Typography
  // ==========================================
  --jbh-font-size-xs: 0.75rem;     // 12px
  --jbh-font-size-sm: 0.875rem;    // 14px
  --jbh-font-size-base: 1rem;      // 16px
  --jbh-font-size-lg: 1.125rem;    // 18px
  --jbh-font-size-xl: 1.25rem;     // 20px
  --jbh-font-size-2xl: 1.5rem;     // 24px
  --jbh-font-size-3xl: 2rem;       // 32px

  --jbh-font-weight-normal: 400;
  --jbh-font-weight-medium: 500;
  --jbh-font-weight-semibold: 600;
  --jbh-font-weight-bold: 700;

  --jbh-line-height-tight: 1.25;
  --jbh-line-height-normal: 1.5;
  --jbh-line-height-relaxed: 1.75;

  // ==========================================
  // Border Radius
  // ==========================================
  --jbh-radius-sm: 8px;
  --jbh-radius-md: 12px;
  --jbh-radius-lg: 16px;
  --jbh-radius-xl: 20px;
  --jbh-radius-full: 9999px;

  // ==========================================
  // Shadows
  // ==========================================
  --jbh-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --jbh-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --jbh-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --jbh-shadow-xl: 0 10px 40px rgba(0, 0, 0, 0.15);
  --jbh-shadow-primary: 0 4px 15px rgba(102, 126, 234, 0.4);
  --jbh-shadow-primary-hover: 0 6px 20px rgba(102, 126, 234, 0.5);

  // ==========================================
  // Transitions
  // ==========================================
  --jbh-transition-fast: 0.15s ease-in-out;
  --jbh-transition-base: 0.3s ease-in-out;
  --jbh-transition-slow: 0.5s ease-in-out;

  // ==========================================
  // Z-index Scale
  // ==========================================
  --jbh-z-dropdown: 1000;
  --jbh-z-sticky: 1020;
  --jbh-z-modal: 1050;
  --jbh-z-tooltip: 1070;
}
```

**Usage in Component SCSS:**
```scss
.custom-element {
  padding: var(--jbh-spacing-md);
  color: var(--jbh-text-primary);
  border-radius: var(--jbh-radius-md);
  box-shadow: var(--jbh-shadow-md);
  transition: all var(--jbh-transition-base);
}
```

---

## 16. CSS Class Reference

### Complete Categorized List

#### Buttons

| Class | Description | Usage |
|-------|-------------|-------|
| `jbh-button-primary` | Primary action button (gradient, white text) | Main CTAs, submit buttons |
| `jbh-button-secondary` | Secondary button (white bg, border) | Cancel, alternative actions |
| `jbh-button-outline` | Outlined button (transparent bg, border) | Tertiary actions |
| `jbh-button-text` | Text-only button | Links, subtle actions |
| `jbh-button-danger` | Destructive action (red) | Delete, remove actions |
| `jbh-button-success` | Success action (green) | Approve, confirm actions |
| `jbh-button-small` | Small size variant | Compact layouts |
| `jbh-button-large` | Large size variant | Prominent CTAs |
| `jbh-button-block` | Full-width button | Mobile forms, bottom actions |
| `jbh-button-loading` | Loading state | During async operations |

---

#### Icon Buttons

| Class | Description | Size |
|-------|-------------|------|
| `jbh-icon-button` | Standard icon button | 36×36px (should be 48×48px) |
| `jbh-icon-button-small` | Small icon button | 32×32px |
| `jbh-icon-button-primary` | Primary colored | - |
| `jbh-icon-button-danger` | Danger/destructive | - |

---

#### Forms

| Class | Description |
|-------|-------------|
| `jbh-form-card` | Elevated card for forms |
| `jbh-form-header` | Form header section |
| `jbh-form-icon` | Icon container in header |
| `jbh-form-title` | Form title |
| `jbh-form-subtitle` | Form subtitle |
| `jbh-form-field` | Individual field container |
| `jbh-label` | Field label |
| `jbh-input` | Text input |
| `jbh-input-wrapper` | Input with icon wrapper |
| `jbh-input-icon` | Icon inside input (`.left` or `.right`) |
| `jbh-input-icon-left` | Input with left padding for icon |
| `jbh-input-icon-right` | Input with right padding for icon |
| `jbh-input-readonly` | Read-only input |
| `jbh-input-action` | Action button inside input |
| `jbh-input-status-icon` | Success/error icon (`.success`, `.error`) |
| `jbh-textarea` | Textarea field |
| `jbh-field-error` | Error message container |
| `jbh-field-success` | Success message container |
| `jbh-field-counter` | Character counter |
| `jbh-checkbox` | Checkbox input |
| `jbh-checkbox-label` | Checkbox label wrapper |

---

#### Select/Dropdown

| Class | Description |
|-------|-------------|
| `jbh-select-wrapper` | Native select wrapper |
| `jbh-select` | Native select element |
| `jbh-select-icon` | Icon for select |
| `jbh-select-arrow` | Dropdown arrow |
| `jbh-select-icon-left` | Select with left padding |
| `jbh-ion-select-wrapper` | ion-select wrapper |
| `jbh-ion-select` | ion-select element |
| `jbh-ion-select-icon` | Icon for ion-select |
| `jbh-datetime-button` | Date picker button |

---

#### Cards & Containers

| Class | Description |
|-------|-------------|
| `jbh-container` | Standard centered container (max-width: 440px) |
| `jbh-container-wide` | Wide container (max-width: 1200px) |
| `jbh-card` | Standard card |
| `jbh-card-elevated` | Card with large shadow |
| `jbh-card-flat` | Card with border, no shadow |

---

#### Typography

| Class | Description | Size |
|-------|-------------|------|
| `jbh-title` | Page title | 32px (2rem) |
| `jbh-subtitle` | Page subtitle | 16px |
| `jbh-heading-1` | Large heading | 24px (1.5rem) |
| `jbh-heading-2` | Medium heading | 20px (1.25rem) |
| `jbh-text-muted` | Secondary text color | - |
| `jbh-text-small` | Small text | 14px |

---

#### Links

| Class | Description |
|-------|-------------|
| `jbh-link` | Standard link (primary color) |
| `jbh-link-muted` | Muted link (secondary color) |

---

#### Alerts

| Class | Description |
|-------|-------------|
| `jbh-alert-error` | Error alert (red) |
| `jbh-alert-success` | Success alert (green) |
| `jbh-alert-warning` | Warning alert (yellow) |
| `jbh-alert-info` | Info alert (blue) |

---

#### Empty States

| Class | Description |
|-------|-------------|
| `jbh-empty-state` | Empty state container |
| `jbh-empty-state-icon` | Icon circle |
| `jbh-empty-state-title` | Title |
| `jbh-empty-state-message` | Message text |

---

#### Limit Error States

| Class | Description |
|-------|-------------|
| `jbh-limit-error` | Limit error container |
| `jbh-limit-error-icon` | Warning icon circle |
| `jbh-limit-error-title` | Title |
| `jbh-limit-error-message` | Message |
| `jbh-limit-badge` | Current/max badge |

---

#### Loading States

| Class | Description |
|-------|-------------|
| `jbh-loading-container` | Loading wrapper |
| `jbh-skeleton` | Base skeleton shimmer |
| `jbh-skeleton-input` | Input skeleton (52px) |
| `jbh-skeleton-select` | Select skeleton (52px) |
| `jbh-skeleton-label` | Label skeleton (16px) |
| `jbh-skeleton-chart` | Chart skeleton (300-400px) |
| `jbh-skeleton-table` | Table skeleton (400px) |

---

#### Tables

| Class | Description |
|-------|-------------|
| `jbh-table-header` | Table header row |
| `jbh-table-row` | Table data row |
| `jbh-table-cell` | Table cell |
| `jbh-cell-name` | Name column (flex: 2) |
| `jbh-cell-email` | Email column (flex: 2) |
| `jbh-cell-status` | Status column (flex: 1.5) |
| `jbh-cell-role` | Role column (flex: 1) |
| `jbh-cell-actions` | Actions column (flex: 1) |
| `jbh-member-name` | Member name text |
| `jbh-member-email` | Member email text |

---

#### Badges

| Class | Description |
|-------|-------------|
| `jbh-status-badge` | Base status badge |
| `status-accepted` | Accepted status (green) |
| `status-pending` | Pending status (yellow) |
| `status-declined` | Declined status (red) |
| `jbh-role-badge` | Base role badge |
| `jbh-role-owner` | Owner role (blue) |
| `jbh-role-member` | Member role (gray) |
| `jbh-withdrawn-badge` | Withdrawn badge (yellow) |
| `jbh-badge-gap` | Gap period badge |
| `jbh-badge-official` | Official record badge |

---

#### Page Headers

| Class | Description |
|-------|-------------|
| `jbh-page-header` | Page header container |
| `jbh-page-header-content` | Header content wrapper |
| `jbh-page-header-icon` | Header icon circle |
| `jbh-page-title` | Page title |
| `jbh-page-subtitle` | Page subtitle |
| `jbh-page-header-actions` | Header action buttons |

---

#### Products

| Class | Description |
|-------|-------------|
| `jbh-products-list` | Products list container |
| `jbh-product-card` | Product card |
| `jbh-product-card-header` | Card header |
| `jbh-product-info` | Product info section |
| `jbh-product-type-icon` | Product type icon |
| `jbh-product-details` | Product details |
| `jbh-product-name` | Product name |
| `jbh-product-type` | Product type label |
| `jbh-product-badges` | Badges container |
| `jbh-product-actions` | Action buttons |
| `jbh-product-card-body` | Card body |
| `jbh-product-balances` | Balances grid |
| `jbh-balance-item` | Balance item |
| `jbh-balance-label` | Balance label |
| `jbh-balance-value` | Balance value (`.positive`, `.negative`) |
| `jbh-product-card-footer` | Card footer |
| `jbh-product-growth` | Growth indicator (`.positive`, `.negative`, `.neutral`) |
| `jbh-product-updated` | Last updated text |
| `jbh-status-toggle` | Active/inactive toggle |

---

#### Balance History

| Class | Description |
|-------|-------------|
| `jbh-balance-filter` | Filter container |
| `jbh-balance-filter-field` | Filter field |
| `jbh-balance-filter-actions` | Filter actions |
| `jbh-balance-summary` | Summary cards grid |
| `jbh-summary-card` | Summary card |
| `jbh-summary-card-icon` | Card icon |
| `jbh-summary-card-label` | Card label |
| `jbh-summary-card-value` | Card value (`.positive`, `.negative`) |
| `jbh-chart-container` | Chart container |
| `jbh-chart-title` | Chart title |
| `jbh-chart-wrapper` | Chart wrapper |
| `jbh-balance-table` | Balance table |
| `jbh-balance-table-header` | Table header |
| `jbh-balance-table-row` | Table row (`.gap-period`) |
| `jbh-balance-cell` | Table cell |
| `jbh-cell-period` | Period column |
| `jbh-cell-balance` | Balance column |
| `jbh-cell-profit` | Profit column (`.positive`, `.negative`) |
| `jbh-cell-growth` | Growth column (`.positive`, `.negative`) |
| `jbh-cell-movements` | Movements column |
| `jbh-cell-badges` | Badges column |
| `jbh-cell-product` | Product column |
| `jbh-balance-cards` | Mobile cards container |
| `jbh-balance-card` | Mobile balance card |

---

#### Context Switcher

| Class | Description |
|-------|-------------|
| `jbh-context-switcher` | Context switcher container |
| `jbh-context-switcher-highlighted` | Highlighted state |
| `jbh-context-switcher-item` | Switcher item |
| `jbh-context-switcher-icon` | Switcher icon |
| `jbh-context-select` | Select element |
| `jbh-context-label` | Label text |

---

#### Top Banner

| Class | Description |
|-------|-------------|
| `jbh-top-banner` | Top banner container |
| `jbh-top-banner-content` | Banner content |
| `jbh-top-banner-icon` | Banner icon |
| `jbh-top-banner-details` | Banner details |
| `jbh-top-banner-label` | Banner label |
| `jbh-top-banner-title` | Banner title |
| `jbh-context-banner` | Context banner |

---

#### Layout Utilities

| Class | Description |
|-------|-------------|
| `jbh-divider` | Divider with text |
| `jbh-spacer-sm` | Small spacer (16px) |
| `jbh-spacer-md` | Medium spacer (24px) |
| `jbh-spacer-lg` | Large spacer (32px) |
| `jbh-spacer-xl` | Extra-large spacer (48px) |
| `jbh-hide-mobile` | Hide on mobile (<768px) |
| `jbh-hide-desktop` | Hide on desktop (≥768px) |

---

#### Animations

| Class | Description |
|-------|-------------|
| `jbh-animate-fade-in` | Fade in animation |
| `jbh-animate-slide-up` | Slide up animation |
| `jbh-animate-shake` | Shake animation (error) |
| `jbh-animate-success` | Success pulse animation |
| `jbh-form-animated` | Staggered field animations |

---

## Summary

This guide provides comprehensive patterns for:
- ✅ Consistent page structures
- ✅ Reusable component usage
- ✅ State management (loading, empty, error)
- ✅ Responsive layouts
- ✅ Performance optimization
- ✅ Accessibility compliance (in progress)
- ✅ Internationalization
- ✅ Design token system

**Key Takeaways:**
1. Always use `ChangeDetectionStrategy.OnPush`
2. Never use getter methods for formatting
3. Always use `track` with `@for` loops
4. Always disable ngx-charts animations
5. Use `ionViewWillEnter()` for API calls
6. Never hardcode text (use translate pipe)
7. Use `jbh-*` CSS classes from theme
8. Test on multiple viewport sizes

**For New Pages:**
1. Choose appropriate page template
2. Configure header in `ionViewWillEnter()`
3. Implement loading/empty/error states
4. Use OnPush and markForCheck()
5. Add all text to both language files
6. Test on mobile and desktop

---

**See Also:**
- [Architecture](architecture.md) - Project structure and patterns
- [Theming](theming.md) - CSS classes and variables
- [Forms](forms.md) - Reactive forms and validation
- [Responsive](responsive.md) - Breakpoints and grid system
- [i18n](i18n.md) - Translation system
