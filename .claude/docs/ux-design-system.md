# UX & Design System Guide

> **Purpose:** Comprehensive reference for designing and implementing consistent UI across the JBH App. Use this guide to avoid repetitive codebase exploration and ensure all pages follow established patterns.

> **The `jbh-*` layer wins.** Sections 3, 6, 7, 8, 9 and 16 match the current layer. Some examples in other sections still show old markup (`ion-*` tags, `jbh-button-*` classes, `ionViewWillEnter`). Do not copy them: use the layer components from Section 3 and the rules in `src/app/AGENTS.md`. `npm run lint:boundary` rejects the old markup.

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

**Example:** `src/app/ui/products/pages/overview/products-overview.page.ts`

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

**Example:** `src/app/ui/auth/pages/login/login.page.ts`

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

**Example:** `src/app/ui/dashboard/pages/dashboard/dashboard.page.ts`

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

### Layer components (`src/app/design-system/`)

A closed list. Import only from `@design-system/components` and `@design-system/platform`. Need a new one? Add it to the layer and tell the team first.

| Group | Components |
|---|---|
| Icons | `jbh-icon` (`name`: an Ionicons name from `components/icon/icon-registry.ts`), `jbh-spinner` |
| Forms | `jbh-field`, `jbh-text-field`, `jbh-number-field`, `jbh-textarea`, `jbh-date-field`, `jbh-select` + `jbh-select-option`, `jbh-toggle` — see [Section 7](#7-form-patterns) |
| Buttons | `button[jbhButton]`, `button[jbhIconButton]` — see [Section 9](#9-interactive-elements) |
| Display | `jbh-card` (`variant`: `default` \| `elevated` \| `flat` \| `form`), `jbh-alert` (`tone`), `jbh-empty-state`, `jbh-skeleton` (`shape`), `jbh-page-header` (`variant`: `page` \| `form`), `jbh-table` — see [Section 8](#8-data-display), `jbh-segment`, `jbh-nav-item`, `jbh-line-chart` |
| Platform | `jbh-page` (`pageEnter`, `pageLeave`), `jbh-toolbar`, `ToastService.show(message, tone)`, `DialogService.confirm({...})` / `open(component, { sheet })` / `close()`, `NavigationService.closeMenu()`, `JbhViewportService`, `IonicDevicePlatform` |

```typescript
if (await this.dialog.confirm({ title, message, confirmText, destructive: true })) {
  this.deleteItem();
}
await this.toast.show(this.translate.instant('feature.saved'), 'success');
```

### App components (built on the layer)

#### app-header
**Location:** `src/app/shared/components/app-header/`

**Purpose:** Global navigation header with hamburger menu or back button

**Usage:**
```html
<app-header></app-header>
```

**Configuration (in the page's `(pageEnter)` handler):**
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
**Location:** `src/app/ui/products/components/product-card/`

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
**Location:** `src/app/ui/products/components/balance-summary-cards/`

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
**Location:** `src/app/ui/products/components/balance-chart/`

**Purpose:** Balance trend chart. It prepares the series and draws it with `jbh-line-chart`.

**Inputs:**
```typescript
@Input() data: ChartDataPoint[] = [];
```


**When to Use:**
- Balance history visualization
- Trend analysis
- Performance charts

**Never:**
- Use `ngx-charts-*` directly. Use `jbh-line-chart`.

---

#### balance-history-table
**Location:** `src/app/ui/products/components/balance-history-table/`

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
**Location:** `src/app/ui/products/components/balance-history-filter/`

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

Every page uses `<app-header jbhPageHeader>` inside `jbh-page`. Never write a custom `ion-header`.
`app-header` reads `HeaderActionsService` and renders `jbh-toolbar`.

```typescript
// Top-level page → menu button
onPageEnter(): void {
  this.headerActions.setPageConfig({
    title: 'feature.page.title',
    actions: [{ id: 'refresh', icon: 'refresh-outline', label: 'common.refresh', handler: () => this.refresh() }]
  });
}

// Detail page → back button
onPageEnter(): void {
  this.headerActions.setPageConfig({
    title: 'feature.detail.title',
    showBackButton: true,
    defaultBackHref: '/portfolio/overview'
  });
}

onPageLeave(): void {
  this.headerActions.clearPageConfig();
}
```

### B. In-Page Navigation

- Use the Angular `Router` and `routerLink`. The app uses no Ionic navigation feature.
- Close the side menu with `NavigationService.closeMenu()`.
- Expandable sections: a plain `<button>` with `[attr.aria-expanded]` and a `jbh-icon` chevron.

```html
<button type="button" [attr.aria-expanded]="isExpanded" aria-controls="section-id" (click)="toggle()">
  <jbh-icon [name]="isExpanded ? 'chevron-up' : 'chevron-down'" />
  {{ 'feature.section' | translate }}
</button>
<div id="section-id" [hidden]="!isExpanded">...</div>
```

### C. Page Lifecycle (CRITICAL)

- `jbh-page` must be the root element of every routed template. Its parent is the routed page, where the page events fire. Anywhere else they never come.
- `(pageEnter)` runs every time the page is shown: API calls, data refresh, header setup.
- `(pageLeave)` runs when the page hides: `clearPageConfig()`.
- `ngOnInit()` runs once, because the router reuses page instances: form setup and subscriptions only. Never call APIs there.
- Never write `ionViewWillEnter` / `ionViewWillLeave`. `npm run lint:boundary` reports them.

```html
<jbh-page (pageEnter)="onPageEnter()" (pageLeave)="onPageLeave()">
  <app-header jbhPageHeader></app-header>
  <div class="jbh-container">...</div>
</jbh-page>
```

**Reference:** `src/app/ui/products/pages/add-movement/`

---

## 7. Form Patterns

The full rules, a TypeScript pattern and an HTML pattern are in [forms.md](forms.md). This section is a quick reference.

### A. Field Types

| Need | Control | Notes |
|---|---|---|
| Text, email, password | `jbh-text-field` | `type`; password reveal built in; `[jbhFieldSuffix]` slot for status icons |
| Amount / number | `jbh-number-field` | `[decimals]`; value `number \| null`; formats while typing |
| Long text | `jbh-textarea` | `rows`, `maxlength`, counter |
| Date | `jbh-date-field` | value `YYYY-MM-DD`; `mode="month"` → `YYYY-MM`; `min`, `max` |
| Dropdown | `jbh-select` + `jbh-select-option` | labels stay in the template with pipes; overlay type chosen by the layer |
| Category / product | `app-category-select` / `app-product-select` | domain selects on `jbh-select`; `<label class="jbh-label">` above |
| On / off | `jbh-toggle` | `checked` is a `model()` |
| Custom control | `jbh-field` | label, hint and error frame only |

All controls accept `label`, `hint`, `error` and `requirement` (`optional` shows a marker). They are `ControlValueAccessor`s: use `formControlName`.

### B. Validation

- Keep `hasError(field)` and `getErrorMessage(field)` in the page.
- Pass `[error]="hasError('x') ? getErrorMessage('x') : ''"`. A non-empty string shows the message with `role="alert"`.
- On submit with an invalid form: `this.form.markAllAsTouched()` and return.
- 422 from the backend: show `error.message` (`JBHError.isValidationError`) in a `<jbh-alert tone="error">`.

### C. Dynamic Forms

Product metadata fields pick the control by value type: text → `jbh-text-field`, number → `jbh-number-field`, boolean → `jbh-toggle`, date → `jbh-date-field`.
**Reference:** `src/app/ui/products/pages/create/` and `edit/`.

---

## 8. Data Display

### A. Tables (Responsive)

Use `jbh-table`. It renders a table from 768px and a card list below 768px, with all ARIA roles.

- Inputs: `rows` (required), `trackBy` (default: the row), `label` (`aria-label`).
- Templates: `ng-template jbhTableHead` (required), `ng-template jbhTableRow` (required), `ng-template jbhTableCard` (optional, mobile cards).
- Parts: `jbh-table-row`, `jbh-table-cell` (`header` → `columnheader`).
- The page owns the row element, so per-row classes and column widths stay in the page HTML and SCSS.

```html
<jbh-table [rows]="records" [trackBy]="trackById" [label]="'feature.table.label' | translate">
  <ng-template jbhTableHead>
    <jbh-table-row>
      <jbh-table-cell header class="col-date">{{ 'feature.date' | translate }}</jbh-table-cell>
      <jbh-table-cell header class="col-amount">{{ 'feature.amount' | translate }}</jbh-table-cell>
    </jbh-table-row>
  </ng-template>

  <ng-template jbhTableRow let-row>
    <jbh-table-row>
      <jbh-table-cell class="col-date">{{ row.date | jbhDate }}</jbh-table-cell>
      <jbh-table-cell class="col-amount">{{ row.amount | jbhCurrency }}</jbh-table-cell>
    </jbh-table-row>
  </ng-template>

  <ng-template jbhTableCard let-row>
    <div class="record-card">{{ row.amount | jbhCurrency }}</div>
  </ng-template>
</jbh-table>
```

The row context is typed `any`. Put the pipe that keeps the type first (`name | uppercase | slice:0:1`, not `name | slice:0:1 | uppercase`).

**Reference:** `src/app/ui/products/components/balance-history-table/`

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

Use `jbh-line-chart`, never `ngx-charts-*` directly. Animations are always off inside it (ngx-charts animations break with Angular 20).

| Input | Meaning |
|---|---|
| `series` | ngx-charts series data |
| `showLegend` | show the legend |
| `valueFormatter` | axis value formatter, e.g. core `formatCurrency(value, currency, 0)` |

**Reference:** `src/app/ui/products/components/balance-chart/`. It prepares the data; the layer draws it.

---

## 9. Interactive Elements

### A. Buttons

Use `button[jbhButton]` (also `a[jbhButton]` for links, `label[jbhButton]` for a file picker). Keep `type`, `disabled`, `(click)` and `routerLink` on the native element.

| Input | Values |
|---|---|
| `jbhButton` | `''` (= `primary`), `secondary`, `outline`, `text`, `danger`, `success` |
| `block` | full width |
| `loading` | shows a spinner instead of the icon, sets `aria-busy` |
| `icon` | leading icon name |

```html
<button type="submit" jbhButton block icon="save-outline" [loading]="isSubmitting" [disabled]="isSubmitting">
  {{ 'common.save' | translate }}
</button>

<button type="button" jbhButton="secondary" (click)="cancel()">
  {{ 'common.cancel' | translate }}
</button>

<a jbhButton="outline" icon="add-outline" routerLink="/portfolio/create">
  {{ 'products.create' | translate }}
</a>
```

### B. Icon Buttons

`button[jbhIconButton]`: `icon` and `label` are required. `label` becomes `aria-label` and `title`.
Tone: `default` | `primary` | `danger`. Size: `md` (48px, default) | `sm` (32px, dense rows only).

```html
<button
  type="button"
  jbhIconButton="danger"
  icon="trash-outline"
  [label]="'common.delete' | translate"
  (click)="onDelete(item)"
></button>
```

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

Most component looks now live inside the `jbh-*` components (see [Section 3](#3-component-library)).
`src/theme/custom-components.scss` keeps only global classes. Before you use a class, check it still exists there.

| Group | Classes |
|---|---|
| Layout | `jbh-container`, `jbh-divider`, `jbh-hide-mobile` |
| Typography | `jbh-title`, `jbh-subtitle`, `jbh-text-muted` |
| Links | `jbh-link` |
| Forms | `jbh-label` (plain label above `app-category-select` / `app-product-select`) |
| Badges | `jbh-status-badge`, `jbh-role-badge` |
| Animations | `jbh-animate-fade-in` |
| Feature classes | product card, member, status, summary card, movement product, context banner, menu layout — kept while templates use them |

**Removed** (use the layer instead): `jbh-button-*` → `button[jbhButton]`; `jbh-icon-button*` → `button[jbhIconButton]`; `jbh-input*`, `jbh-field-error`, `jbh-textarea`, `jbh-select*`, `jbh-ion-select*` → form controls; `jbh-alert-*` → `jbh-alert`; `jbh-empty-state*` → `jbh-empty-state`; `jbh-skeleton*` → `jbh-skeleton`; `jbh-page-header*`, `jbh-page-title` → `jbh-page-header`; `jbh-table-*` → `jbh-table`; `jbh-form-card` → `<jbh-card variant="form">`; `jbh-menu-item*` → `jbh-nav-item`; `jbh-top-banner*` (component deleted).

Rules for adding or removing a global class: [theming.md](theming.md).

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
4. Use `jbh-line-chart` for charts (animations are off inside it)
5. Use `(pageEnter)` on `jbh-page` for API calls
6. Never hardcode text (use translate pipe)
7. Use `jbh-*` layer components; global classes only for layout and text
8. Test on multiple viewport sizes

**For New Pages:**
1. Choose appropriate page template
2. Configure header in `(pageEnter)`, clear it in `(pageLeave)`
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
