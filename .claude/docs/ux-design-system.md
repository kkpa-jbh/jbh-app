# UX & Design System Guide

> **Purpose:** Comprehensive reference for designing and implementing consistent UI across the JBH App. Use this guide to avoid repetitive codebase exploration and ensure all pages follow established patterns.

> **The `jbh-*` layer wins.** All examples take design-system symbols only from `@design-system/components` and `@design-system/platform`, never a deeper path. Angular, RxJS, `@ngx-translate`, `@core/*` and `@shared/*` imports are still allowed. If an example and the layer disagree, the layer is right: fix the example. Full rules: `src/app/AGENTS.md`.

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

Every routed page follows the same frame:

- `<jbh-page>` is the root element of the template. Load data in `(pageEnter)`, clear the header in `(pageLeave)`.
- `<app-header jbhPageHeader>` is the first child. Auth pages have no header.
- Content sits in `<div class="jbh-container">` (add `jbh-container-wide` for tables and charts).
- Design-system symbols come only from `@design-system/components` and `@design-system/platform`. Angular, RxJS, `@ngx-translate`, `@core/*` and `@shared/*` imports are fine.

### A. Overview/List Pages

**Purpose:** Display collections of entities (products, teams, etc.)

**Structure:**
```
Header (app-header)
↓
Page header (jbh-page-header, with the create button)
↓
Loading State (jbh-skeleton)
↓
Empty State (jbh-empty-state, if no data)
↓
List/Grid of Cards
```

**Example:** `src/app/ui/products/pages/overview/products-overview.page.ts`

**TypeScript Pattern:**
```typescript
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import {
  JbhButtonComponent,
  JbhEmptyStateComponent,
  JbhPageHeaderComponent,
  JbhSkeletonComponent
} from '@design-system/components';
import { JbhPageComponent } from '@design-system/platform';
import { HeaderActionsService } from '@core/infrastructure/header/header-actions.service';
import { JBHError } from '@core/domain/models/jbh-error.model';
import { AppHeaderComponent } from '@shared/components/app-header/app-header.component';
// Placeholders: import Item, ItemUseCase, ItemCardComponent and MAX_LIMIT from your feature.

@Component({
  selector: 'app-feature-overview',
  templateUrl: './feature-overview.page.html',
  styleUrls: ['./feature-overview.page.scss'],
  standalone: true,
  imports: [
    TranslateModule,
    AppHeaderComponent,
    ItemCardComponent,
    JbhButtonComponent,
    JbhEmptyStateComponent,
    JbhPageComponent,
    JbhPageHeaderComponent,
    JbhSkeletonComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush // CRITICAL
})
export class FeatureOverviewPage implements OnInit, OnDestroy {
  private readonly useCase = inject(ItemUseCase);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly headerActions = inject(HeaderActionsService);

  items: Item[] = [];
  isLoading = true;
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Subscribe to observables, set up static state. No API calls here.
  }

  onPageEnter(): void {
    // CRITICAL: configure the header and load data here (runs every time the page shows)
    this.headerActions.setPageConfig({
      title: 'feature.overview.title',
      actions: [
        { id: 'refresh', icon: 'refresh-outline', handler: () => this.refreshData() }
      ]
      // No showBackButton - shows the menu button (top-level page)
    });
    this.refreshData();
  }

  onPageLeave(): void {
    this.headerActions.clearPageConfig();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  navigateToCreate(): void {
    this.router.navigate(['/feature/create']);
  }

  canCreate(): boolean {
    return this.items.length < MAX_LIMIT;
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
}
```

**HTML Pattern:**
```html
<jbh-page (pageEnter)="onPageEnter()" (pageLeave)="onPageLeave()">
  <app-header jbhPageHeader></app-header>

  <div class="jbh-container">
    <jbh-page-header
      icon="folder-open-outline"
      [title]="'feature.overview.title' | translate"
      [subtitle]="'feature.overview.subtitle' | translate"
    >
      @if (canCreate()) {
        <button type="button" jbhButton icon="add-outline" (click)="navigateToCreate()">
          {{ 'feature.overview.create' | translate }}
        </button>
      }
    </jbh-page-header>

    @if (isLoading) {
      <div class="jbh-loading-container">
        @for (i of [1, 2, 3]; track i) {
          <jbh-skeleton shape="block" height="200px" />
        }
      </div>
    } @else if (items.length === 0) {
      <jbh-empty-state
        icon="folder-open-outline"
        [title]="'feature.empty.title' | translate"
        [message]="'feature.empty.message' | translate"
      >
        @if (canCreate()) {
          <button type="button" jbhButton icon="add-outline" (click)="navigateToCreate()">
            {{ 'feature.empty.cta' | translate }}
          </button>
        }
      </jbh-empty-state>
    } @else {
      <div class="feature-items-list">
        @for (item of items; track item.id) {
          <app-item-card [item]="item"></app-item-card>
        }
      </div>
    }
  </div>
</jbh-page>
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
Form Card (jbh-card variant="form")
  ├─ jbh-page-header variant="form" (icon + title + subtitle)
  ├─ Form controls (jbh-text-field, jbh-select, jbh-textarea, ...)
  └─ Submit Button (button[jbhButton] block)
```

**Example:** `src/app/ui/products/pages/add-movement/` (the reference page). More rules: [Forms](forms.md).

**TypeScript Pattern:**
```typescript
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import {
  JbhButtonComponent,
  JbhCardComponent,
  JbhPageHeaderComponent,
  JbhSelectComponent,
  JbhSelectOptionComponent,
  JbhTextFieldComponent,
  JbhTextareaComponent
} from '@design-system/components';
import { JbhPageComponent, ToastService } from '@design-system/platform';
import { HeaderActionsService } from '@core/infrastructure/header/header-actions.service';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { AppHeaderComponent } from '@shared/components/app-header/app-header.component';
// Placeholder: import ITEM_TYPE_OPTIONS from your feature.

@Component({
  selector: 'app-create-item',
  templateUrl: './create-item.page.html',
  styleUrls: ['./create-item.page.scss'],
  standalone: true,
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
    JbhTextFieldComponent,
    JbhTextareaComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateItemPage implements OnInit, OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly headerActions = inject(HeaderActionsService);
  private readonly translationService = inject(TranslationService);
  private readonly toast = inject(ToastService);

  itemForm!: FormGroup;
  isSubmitting = false;
  typeOptions = ITEM_TYPE_OPTIONS;
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initForm();
  }

  onPageEnter(): void {
    this.headerActions.setPageConfig({
      title: 'feature.create.title',
      showBackButton: true, // CRITICAL: shows the back button (child page)
      defaultBackHref: '/feature/overview'
    });
  }

  onPageLeave(): void {
    this.headerActions.clearPageConfig();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.cdr.markForCheck();

    // Call the use case. On success:
    // this.toast.show(this.translationService.instant('feature.create.success'), 'success');
    // On error: set isSubmitting = false and call this.cdr.markForCheck().
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

  private initForm(): void {
    this.itemForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      type: [null, Validators.required],
      description: ['', Validators.maxLength(200)]
    });
  }
}
```

**HTML Pattern:**
```html
<jbh-page (pageEnter)="onPageEnter()" (pageLeave)="onPageLeave()">
  <app-header jbhPageHeader></app-header>

  <div class="jbh-container">
    <jbh-card variant="form">
      <jbh-page-header
        variant="form"
        icon="document-text-outline"
        [title]="'feature.create.title' | translate"
        [subtitle]="'feature.create.subtitle' | translate"
      />

      <form [formGroup]="itemForm" (ngSubmit)="onSubmit()">
        <jbh-text-field
          formControlName="name"
          icon="pencil-outline"
          [label]="'feature.name.label' | translate"
          [placeholder]="'feature.name.placeholder' | translate"
          [error]="hasError('name') ? getErrorMessage('name') : ''"
        />

        <jbh-select
          formControlName="type"
          icon="list-outline"
          [label]="'feature.type.label' | translate"
          [placeholder]="'feature.type.placeholder' | translate"
          [error]="hasError('type') ? getErrorMessage('type') : ''"
        >
          @for (option of typeOptions; track option.value) {
            <jbh-select-option [value]="option.value">{{ option.labelKey | translate }}</jbh-select-option>
          }
        </jbh-select>

        <jbh-textarea
          formControlName="description"
          icon="document-text-outline"
          requirement="optional"
          [rows]="4"
          [maxlength]="200"
          [label]="'feature.description.label' | translate"
          [placeholder]="'feature.description.placeholder' | translate"
          [error]="hasError('description') ? getErrorMessage('description') : ''"
        />

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

- `jbh-select` picks the overlay type by itself (popover on desktop, action sheet on mobile). Do not pass an interface.
- `[loading]` on the button shows the spinner. Do not add a `jbh-spinner` inside the button.
- Numbers use `jbh-number-field` with `[decimals]`. Dates use `jbh-date-field`.

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
jbh-page-header
↓
Content
  ├─ Summary cards
  ├─ Related data (jbh-line-chart, jbh-table)
  └─ Action buttons
```

**Example:** `src/app/ui/products/pages/balance-history/balance-history.page.html`

**Pattern:**
```html
<jbh-page (pageEnter)="onPageEnter()" (pageLeave)="onPageLeave()">
  <app-header jbhPageHeader></app-header>

  <div class="jbh-container jbh-container-wide">
    <jbh-page-header
      icon="analytics-outline"
      [title]="'feature.detail.title' | translate"
      [subtitle]="'feature.detail.subtitle' | translate"
    />

    @if (isLoading) {
      <jbh-skeleton shape="block" height="250px" />
      <jbh-skeleton shape="table" />
    } @else {
      <div class="feature-summary">
        @for (card of summaryCards; track card.id) {
          <jbh-card>
            <jbh-icon [name]="card.icon" />
            <p class="feature-summary-label">{{ card.labelKey | translate }}</p>
            <p class="feature-summary-value">{{ card.value | jbhCurrency }}</p>
          </jbh-card>
        }
      </div>

      <app-balance-chart [balances]="balances"></app-balance-chart>

      <app-balance-history-table [balances]="balances"></app-balance-history-table>
    }
  </div>
</jbh-page>
```

- Charts go through `jbh-line-chart` (see Section 8C). Tables go through `jbh-table` (see Section 8A).

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
  ├─ Error alert (jbh-alert)
  ├─ Form
  ├─ Submit Button
  └─ Social Login (optional)
```

**Example:** `src/app/ui/auth/pages/login/login.page.html`

**Unique Styling:**
- Fullscreen background with gradient or pattern
- Elevated card with large shadow
- No app-header component
- Centered layout

**HTML Pattern:**
```html
<jbh-page>
  <div class="auth-background">
    <jbh-card variant="elevated" class="auth-card">
      <jbh-page-header
        variant="form"
        icon="shield-checkmark"
        [title]="'auth.login.title' | translate"
        [subtitle]="'auth.login.subtitle' | translate"
      />

      @if (errorMessage) {
        <jbh-alert tone="error">{{ errorMessage }}</jbh-alert>
      }

      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
        <jbh-text-field
          formControlName="username"
          icon="person-outline"
          autocomplete="username"
          [label]="'auth.login.username' | translate"
          [error]="hasError('username') ? getErrorMessage('username') : ''"
        />

        <jbh-text-field
          formControlName="password"
          type="password"
          icon="lock-closed-outline"
          autocomplete="current-password"
          [label]="'auth.login.password' | translate"
          [error]="hasError('password') ? getErrorMessage('password') : ''"
        />

        <button type="submit" jbhButton block [loading]="isLoading" [disabled]="isLoading">
          {{ 'auth.login.submit' | translate }}
        </button>
      </form>

      <div class="jbh-divider">
        <span>{{ 'common.or' | translate }}</span>
      </div>

      <button type="button" jbhButton="secondary" block icon="logo-google" (click)="loginWithGoogle()">
        {{ 'auth.login.google' | translate }}
      </button>
    </jbh-card>
  </div>
</jbh-page>
```

- Auth pages have no `app-header`, and often no `(pageEnter)`.
- `jbh-text-field type="password"` has the show/hide button built in.
- The real login page puts the Google button inside `.jbh-google-button`, because Google draws its own button on top. See `src/theme/custom-components.scss`.

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

**Example:** `src/app/ui/dashboard/pages/dashboard/dashboard.page.html`

**Pattern:**
```html
<jbh-page (pageEnter)="onPageEnter()" (pageLeave)="onPageLeave()">
  <app-header jbhPageHeader></app-header>

  <div class="jbh-container">
    <jbh-page-header
      icon="home-outline"
      [title]="greeting"
      [subtitle]="subtitleKey | translate"
    />

    <div class="jbh-dashboard-summary">
      <jbh-card>
        <p class="jbh-dashboard-stat-label">{{ 'dashboard.totalBalance' | translate }}</p>
        <p class="jbh-dashboard-stat-value">{{ totalBalance | jbhCurrency }}</p>
      </jbh-card>
    </div>

    <div class="jbh-dashboard-actions">
      <button type="button" jbhButton block icon="add-circle-outline" routerLink="/portfolio/create">
        {{ 'dashboard.addProduct' | translate }}
      </button>
      <button type="button" jbhButton="secondary" block icon="cash-outline" routerLink="/transactions/record-movement">
        {{ 'dashboard.recordMovement' | translate }}
      </button>
    </div>
  </div>
</jbh-page>
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
    @for (i of [1, 2, 3]; track i) {
      <jbh-skeleton shape="block" height="200px" />
    }
  </div>
}
```

**`jbh-skeleton` inputs:**
- `shape` - `line` (default, 16px), `label` (100px wide), `input` and `select` (52px), `header` (48px), `table` (400px), `block` (120px)
- `width`, `height` - any CSS size, when the shape does not fit

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
  <jbh-spinner />
}
```

**When to Use:**
- Small component loading
- Inline loading indicator
- Not for buttons: use `[loading]` on `button[jbhButton]`

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
@if (isLoadingPage) {
  <jbh-skeleton shape="block" height="300px" />
}

<jbh-select
  formControlName="categoryId"
  [label]="'feature.category.label' | translate"
  [loading]="isLoadingDropdown"
>
  @for (category of categories; track category.id) {
    <jbh-select-option [value]="category.id">{{ category.name }}</jbh-select-option>
  }
</jbh-select>

<button type="submit" jbhButton [loading]="isSubmitting" [disabled]="isSubmitting">
  {{ 'feature.save' | translate }}
</button>
```

---

### B. Empty States

#### Structure
```html
<jbh-empty-state
  icon="folder-open-outline"
  [title]="'feature.empty.title' | translate"
  [message]="'feature.empty.message' | translate"
>
  @if (canCreate()) {
    <button type="button" jbhButton icon="add-outline" (click)="create()">
      {{ 'feature.empty.cta' | translate }}
    </button>
  }
</jbh-empty-state>
```

- `title` is required. `icon` and `message` are optional.
- Content between the tags (a button) shows below the message.

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
  <jbh-empty-state
    icon="folder-open-outline"
    [title]="'feature.empty.title' | translate"
    [message]="'feature.empty.message' | translate"
  >
    <button type="button" jbhButton icon="add-outline" (click)="create()">
      {{ 'feature.empty.cta' | translate }}
    </button>
  </jbh-empty-state>
} @else if (hasNoResults) {
  <jbh-empty-state
    icon="search-outline"
    [title]="'feature.noResults.title' | translate"
  >
    <button type="button" jbhButton="secondary" (click)="clearFilter()">
      {{ 'feature.noResults.clear' | translate }}
    </button>
  </jbh-empty-state>
}
```

**Permission-Based CTA:**
```html
@if (canCreate()) {
  <button type="button" jbhButton icon="add-outline" (click)="create()">
    {{ 'feature.empty.cta' | translate }}
  </button>
} @else {
  <p class="jbh-text-muted">{{ 'feature.empty.limit' | translate }}</p>
}
```

---

### C. Error States

#### Toast Notifications
**Purpose:** User-facing error messages

**Pattern:** use `ToastService` from `@design-system/platform`. No local `showToast` copies.
```typescript
private readonly toast = inject(ToastService);
```

**Usage:**
```typescript
error: (error: JBHError) => {
  const message = error.isValidationError
    ? error.message // 422: Show server message
    : this.translationService.instant('feature.error.generic');
  this.toast.show(message, 'error');
}
```

Tones: `success`, `error`, `warning`, `info` (default).

---

#### Inline Messages
**Purpose:** An error or a note inside the page, not a toast

**Pattern:**
```html
@if (errorMessage) {
  <jbh-alert tone="error">{{ errorMessage }}</jbh-alert>
}
```

Tones: `error`, `warning`, `info` (default), `success`. `error` sets `role="alert"`; the others set `role="status"`.

---

#### Inline Validation Errors
**Purpose:** Form field errors

**Pattern:** pass the message to the control. A non-empty string shows it, with `role="alert"`.
```html
<jbh-text-field
  formControlName="fieldName"
  [label]="'feature.fieldName.label' | translate"
  [error]="hasError('fieldName') ? getErrorMessage('fieldName') : ''"
/>
```

---

#### Confirmation Dialogs
**Purpose:** Confirm destructive actions

**Pattern:** use `DialogService.confirm`. It resolves `true` only when the user taps the confirm button.
```typescript
private readonly dialog = inject(DialogService);

private async confirmDelete(item: Item): Promise<boolean> {
  return this.dialog.confirm({
    title: this.translationService.instant('feature.delete.title'),
    message: this.translationService.instant('feature.delete.message', { name: item.name }),
    confirmText: this.translationService.instant('common.delete'),
    destructive: true
  });
}
```

---

### D. Success States

#### Toast Notifications
```typescript
this.toast.show(this.translationService.instant('feature.create.success'), 'success');
```

#### Success Icons
```html
<jbh-icon name="checkmark-circle" class="feature-success-icon" />
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
<jbh-page (pageEnter)="onPageEnter()" (pageLeave)="onPageLeave()">
  <app-header jbhPageHeader></app-header>
  <div class="jbh-container">...</div>
</jbh-page>
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
  <jbh-line-chart [series]="series" />
  <jbh-table [rows]="rows" [label]="'feature.table.label' | translate">...</jbh-table>
</div>
```

**When to Use:**
- Dashboards
- Reports with charts
- Data tables
- Wide layouts

---

### B. Grid System

#### CSS Grid in the page SCSS
**Purpose:** Responsive column layouts

The layer has no grid component, and `ion-grid` is not allowed in pages. Use CSS Grid in the page SCSS, mobile first.

**Breakpoints** (see [Responsive](responsive.md)):
- Mobile: below 768px
- Tablet: 768px and up
- Desktop: 1024px and up

**Usage:**
```html
<div class="feature-grid">
  @for (item of items; track item.id) {
    <app-item-card [item]="item"></app-item-card>
  }
</div>
```

```scss
.feature-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--jbh-spacing-sm);

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

**Common Pattern:** `.jbh-balance-summary` is a global grid: 2 columns on mobile, 4 from 768px.
```html
<div class="jbh-balance-summary">
  @for (card of summaryCards; track card.id) {
    <jbh-card>...</jbh-card>
  }
</div>
```

---

### C. Cards & Sections

#### Cards
```html
<jbh-card>...</jbh-card>
<jbh-card variant="elevated">...</jbh-card>
<jbh-card variant="flat">...</jbh-card>
<jbh-card variant="form">...</jbh-card>
```

**When to Use Each:**
- `default`: most content cards
- `elevated`: important cards, auth cards, modals (larger shadow)
- `flat`: subtle separation, nested cards (border, no shadow)
- `form`: all form containers (elevated, with a slide-up animation)

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

Use `jbh-table`. With a `jbhTableCard` template, it renders a table from 768px and a card list below 768px, with all ARIA roles. Without that template, it renders the table at every width.

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
  <jbh-icon name="checkmark-circle" />
  {{ 'status.accepted' | translate }}
</span>

<span class="jbh-status-badge status-pending">
  <jbh-icon name="time-outline" />
  {{ 'status.pending' | translate }}
</span>

<span class="jbh-status-badge status-declined">
  <jbh-icon name="close-circle" />
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
  <jbh-icon name="shield-checkmark" />
  {{ 'role.owner' | translate }}
</span>

<span class="jbh-role-badge jbh-role-member">
  <jbh-icon name="person" />
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
**Pattern:** put the actions inside `jbh-page-header`. They show on the right on desktop.
```html
<jbh-page-header
  icon="folder-open-outline"
  [title]="'feature.overview.title' | translate"
>
  <button type="button" jbhButton icon="add-outline" (click)="create()">
    {{ 'button.create' | translate }}
  </button>
  <button
    type="button"
    jbhIconButton
    icon="filter-outline"
    [label]="'button.filter' | translate"
    (click)="filter()"
  ></button>
</jbh-page-header>
```

---

#### Inline Row Actions
**Pattern:**
```html
<div class="jbh-action-buttons">
  <button
    type="button"
    jbhIconButton
    icon="create-outline"
    [label]="'button.edit' | translate"
    (click)="edit(row)"
  ></button>
  <button
    type="button"
    jbhIconButton="danger"
    icon="trash-outline"
    [label]="'button.delete' | translate"
    (click)="delete(row)"
  ></button>
</div>
```

In dense table rows, add `size="sm"`.

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
  return this.dialog.confirm({
    title: this.translationService.instant('item.delete.title'),
    message: this.translationService.instant('item.delete.message', { name: item.name }),
    confirmText: this.translationService.instant('common.delete'),
    destructive: true
  });
}
```

`this.dialog` is `DialogService` from `@design-system/platform`.

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
  <button type="button" jbhButton icon="add-outline" (click)="create()">
    {{ 'button.create' | translate }}
  </button>
}

@if (canEditTeam(team)) {
  <button
    type="button"
    jbhIconButton
    icon="create-outline"
    [label]="'button.edit' | translate"
    (click)="edit(team)"
  ></button>
}
```

---

### B. Disabled States

#### Limit-Based Disabling
```html
<button
  type="button"
  jbhButton
  [disabled]="products.length >= MAX_LIMIT"
  (click)="create()"
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
  type="button"
  jbhIconButton="danger"
  icon="trash-outline"
  [disabled]="!canDelete(item)"
  [label]="(canDelete(item) ? 'button.delete' : 'button.delete.disabled') | translate"
  (click)="delete(item)"
></button>
```

---

### C. Limit Error Pages

**Full-Page Pattern:**
```html
@if (hasReachedLimit) {
  <div class="jbh-limit-error">
    <div class="jbh-limit-error-icon">
      <jbh-icon name="alert-circle-outline" />
    </div>
    <h2 class="jbh-limit-error-title">{{ 'limit.title' | translate }}</h2>
    <p class="jbh-limit-error-message">
      {{ 'limit.message' | translate: { max: MAX_TEAMS } }}
    </p>
    <button type="button" jbhButton="secondary" block icon="arrow-back-outline" routerLink="/teams">
      {{ 'button.backToTeams' | translate }}
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

Prefer CSS media queries. Use code only when the logic must change, not only the look.

**`JbhViewportService`** (`@design-system/platform`): `wide` is a signal, `true` from 1024px. It updates 100ms after the last resize.
```typescript
private readonly viewport = inject(JbhViewportService);
readonly isWide = this.viewport.wide;
```

```html
@if (isWide()) {
  <app-feature-sidebar></app-feature-sidebar>
}
```

- Never add your own `window:resize` listener.
- `jbh-select` and `jbh-table` (when it has a card template) already adapt to the width by themselves.

---

### D. Responsive Utilities

#### Hide on Mobile
```html
<p class="feature-hint jbh-hide-mobile">{{ 'feature.hint' | translate }}</p>
```

**CSS:** `@media (max-width: 767px) { display: none !important; }`

---

#### Tables and Cards

There is no `jbh-hide-desktop` class. With a `jbhTableCard` template, `jbh-table` shows a table from 768px and cards below 768px (Section 8A). For other content, use a media query in the page SCSS.

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

`button[jbhIconButton]` requires `label`. The layer sets `aria-label` and `title` from it, so an icon button without a label does not compile.

```html
<button
  type="button"
  jbhIconButton
  icon="refresh-outline"
  [label]="'button.refresh' | translate"
  (click)="refresh()"
></button>
```

**Rule:** EVERY icon button gets a translated `label`. Never write `aria-label` or `title` on it by hand.

A standalone `jbh-icon` that carries meaning takes `label` too. Without `label` it is hidden from screen readers.

---

#### Tables

Use `jbh-table` (Section 8A). It sets `role="table"`, the row groups and the cell roles. Pass `[label]` for its `aria-label`.

```html
<jbh-table [rows]="members" [label]="'table.members' | translate">
  <ng-template jbhTableHead>
    <jbh-table-row>
      <jbh-table-cell header>{{ 'table.name' | translate }}</jbh-table-cell>
      <jbh-table-cell header>{{ 'table.email' | translate }}</jbh-table-cell>
    </jbh-table-row>
  </ng-template>

  <ng-template jbhTableRow let-row>
    <jbh-table-row>
      <jbh-table-cell>{{ row.name }}</jbh-table-cell>
      <jbh-table-cell>{{ row.email }}</jbh-table-cell>
    </jbh-table-row>
  </ng-template>
</jbh-table>
```

---

#### Expandable Elements
```html
<button
  type="button"
  (click)="toggleExpanded()"
  [attr.aria-expanded]="isExpanded"
  aria-controls="team-members"
>
  <span>{{ team.name }}</span>
  <jbh-icon [name]="isExpanded ? 'chevron-up' : 'chevron-down'" />
</button>

<div id="team-members" [hidden]="!isExpanded">...</div>
```

---

#### Loading States
```html
<div role="status" aria-live="polite" aria-busy="true" [attr.aria-label]="'common.loading' | translate">
  <jbh-skeleton shape="block" height="200px" />
</div>
```

`button[jbhButton]` with `[loading]` sets `aria-busy` by itself.

---

#### Error Messages

The layer already sets the roles:

- Form controls: a non-empty `[error]` shows the message with `role="alert"`.
- `jbh-alert tone="error"` has `role="alert"`. The other tones have `role="status"`.

```html
@if (errorMessage) {
  <jbh-alert tone="error">{{ errorMessage }}</jbh-alert>
}
```

---

### B. Touch Targets

**Minimum Size:** 48px × 48px (WCAG AA)

**In the layer:**
- `button[jbhIconButton]`: 48px × 48px (size `md`, the default).
- `size="sm"`: 32px × 32px. This is a known exception to the 48px minimum. Use it only in dense table rows. Do not add new uses without asking the team.

**Spacing:**
- Minimum 8px between interactive elements
- Prevents accidental taps

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
