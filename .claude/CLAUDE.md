# JBH App - Ionic/Angular Mobile Development Guide

Expert guidance for Ionic/Angular hybrid mobile apps using Clean Architecture, DDD, responsive design, and consistent theming.

## Hybrid APP

- Ionic Framework + Angular to build cross-platform mobile apps
- Changes should work on iOS and Android along with the desktop web version

## Detailed Documentation

- [Architecture](docs/architecture.md) - Hexagonal/DDD/Clean Architecture, project structure
- [UX & Design System](docs/ux-design-system.md) - **Page templates, components, patterns, complete reference**
- [Theming](docs/theming.md) - CSS classes, variables, design system
- [Forms](docs/forms.md) - Reactive forms, validation, mobile patterns
- [i18n](docs/i18n.md) - Internationalization, translations
- [Responsive](docs/responsive.md) - Breakpoints, grid system, viewport detection
- [Improvements](docs/improvements.md) - Known issues, planned fixes, priorities
- [Debug Info](docs/debuginfo.md) - How to add debug info for responsive issues

## Quick Reference

### Context Summary                                                             
                                                                              
  What products are: Financial instruments (savings accounts, investments,    
  loans, credit cards, CDTs, real estate) - each with current balance,        
  movement balance, net profit, and growth rate.                              
                                                                              
  Current navigation:                                                         
  - Products → Create | Overview | Transfer                                   
  - Teams → Create | Overview | Invite  

### Project Structure

```diagram
src/app/
├── core/domain/          # Models, repositories, use-cases
├── core/infrastructure/  # API, persistence, implementations
├── ui/                   # Lazy-loaded feature modules (pages,components)
├── shared/               # Reusable components, pipes, directives, utilities
└── theme/                # custom-components.scss (single source)
```

### Key Auth Files

```diagram
src/app/core/infrastructure/
├── auth/
│   └── token-refresh.service.ts # Centralized token refresh logic
├── interceptors/
│   ├── jwt.interceptor.ts       # Adds Authorization header, proactive refresh
│   └── error.interceptor.ts     # Handles 401, 403, 422, any status errors.
├── persistence/
│   └── token-storage.service.ts # Secure token storage (Capacitor Preferences)
└── repositories/
    └── auth.repository.impl.ts  # Auth API calls with IS_PUBLIC_API
```

### Critical Rules

- Do not use any function from console. Use the service `private logger: LoggerService` instead.
- Do not do any calculations with numbers. All calculations must be done on the backend side. If you need to do any calculations, please stop the plan and alert the team.
- **Formatting in templates only**: Use **pipes for display** (tables, cards) and **directives for form inputs**. No format conversions in component code.
  - **Pipes** (`|`) for displaying values: `{{ value | jbhCurrency }}`
  - **Directives** (`[]`) ONLY for `<input>` elements: `<input [jbhDecimalFormat]="2" />`

#### Performance (CRITICAL)

1. **ALWAYS use `ChangeDetectionStrategy.OnPush`** for ALL components:
```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
```

2. **NEVER use getter methods for formatting** - use pure pipes instead:
```typescript
// ❌ BAD - Called on EVERY change detection cycle
get formattedBalance(): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(this.balance);
}

// ✅ GOOD - Only called when input changes
{{ balance | jbhCurrency }}
```

3. **ALWAYS implement `OnDestroy`** and use `takeUntil(this.destroy$)` for subscriptions:
```typescript
export class MyComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.someObservable$
      .pipe(takeUntil(this.destroy$))
      .subscribe(/* ... */);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

4. **ALWAYS use `trackBy` with `@for` loops**:
```html
@for (item of items; track item.id) {
  <app-item [item]="item"></app-item>
}
```

5. **AVOID expensive CSS animations**:
    - **NEVER** use `backdrop-filter: blur()` on animated elements
    - Prefer `transform` and `opacity` for animations (GPU-accelerated)
    - Avoid `animation: infinite` on complex elements

6. **Use existing pipes** from `src/app/shared/pipes/`:
    - `JbhCurrencyPipe` (`jbhCurrency`) - for currency formatting
    - `JbhTranslationKeyPipe` (`jbhTranslationKey`) - for API JSON translation keys
    - Use pipes in templates, not formatting methods in components

7. **Directives vs Pipes for Formatting (CRITICAL)**:
    - **Directives are ONLY for form inputs** - they require `NgControl` and listen to user input events
    - **Pipes are for displaying values** - use them for tables, cards, and read-only text

```html
<!-- ❌ WRONG - Directive on display element (causes NG0201 error) -->
<span [jbhDecimalFormat]="product.balance"></span>

<!-- ✅ CORRECT - Pipe for displaying values -->
<span>{{ product.balance | jbhCurrency }}</span>

<!-- ✅ CORRECT - Directive on form input -->
<input type="text" [jbhDecimalFormat]="2" formControlName="amount" />
```

**Available pipes for display:**
- `jbhCurrency` - Currency formatting ($1,234.56)
- `jbhDate` - Date formatting
- `jbhTranslationKey` - Backend JSON translation keys
- `jbhProfit` - Profit/loss formatting with color
- `jbhGrowth` - Growth rate formatting with %

**Available directives for form inputs:**
- `jbhDecimalFormat` - Numeric input formatting (use ONLY on `<input>` elements)

8. **Backend JSON Translation Keys**: When the API returns a `translationKey` field containing JSON like `{"en":"Salary","es":"Salario"}`, use the `jbhTranslationKey` pipe in templates:
```html
<!-- ✅ GOOD - Use the pipe directly in template -->
{{ category.translationKey | jbhTranslationKey }}

<!-- ❌ BAD - Don't use methods that call on every change detection -->
{{ getCategoryName(category) }}
```

#### Charts and Visualizations (ngx-charts)

1. **ALWAYS disable animations** for ngx-charts components to avoid Angular 20 compatibility issues:
```html
<ngx-charts-line-chart
  [animations]="false"
  ...
>
</ngx-charts-line-chart>
```

2. **Why disable animations**:
   - ngx-charts animations use `strokeDashoffset` which is not supported by Angular 20's animation system
   - Causes browser warnings: "animationState is attempting to animate the following not animatable properties: strokeDashoffset"
   - Can prevent chart elements from rendering properly
   - Aligns with performance best practices (avoid expensive animations)

3. **Affected components**: All ngx-charts components (line-chart, bar-chart, pie-chart, etc.)

**Reference implementation**: `src/app/ui/products/components/balance-chart/balance-chart.component.html`

#### Accessibility (WCAG AA Target)

1. **ALWAYS add `aria-label` to icon buttons**:
```html
<button
  class="jbh-icon-button"
  (click)="action()"
  aria-label="{{ 'button.action' | translate }}"
  title="{{ 'button.action' | translate }}"
>
  <ion-icon name="icon-outline"></ion-icon>
</button>
```

2. **Minimum touch target size:** 48px × 48px (current icon buttons are 36px - needs fix)

3. **Add semantic roles to tables**:
```html
<div class="jbh-table" role="table">
  <div class="jbh-table-header" role="rowgroup">
    <div class="jbh-table-row" role="row">
      <div class="jbh-table-cell" role="columnheader">Header</div>
    </div>
  </div>
</div>
```

4. **Add roles to state elements**:
```html
<!-- Loading states -->
<div role="status" aria-live="polite">Loading...</div>

<!-- Error states -->
<div role="alert" aria-live="assertive">Error message</div>
```

5. **Expandable elements**:
```html
<button
  [attr.aria-expanded]="isExpanded"
  aria-controls="content-id"
>
  Toggle
</button>
<div id="content-id" [hidden]="!isExpanded">Content</div>
```

**See:** [UX Design System - Accessibility](docs/ux-design-system.md#13-accessibility-guidelines) for complete guidelines

#### Theme System

1. **ALL styles** in `src/theme/custom-components.scss` - NO feature-specific theme files
   What Should Stay in custom-components.scss (Truly Global)
These are reusable across all features:

✅ Buttons (jbh-button-, jbh-icon-button-)
✅ Forms (jbh-input, jbh-select, jbh-label, jbh-field-error, etc.)
✅ Cards (jbh-card, jbh-card-elevated, jbh-card-flat)
✅ Alerts (jbh-alert-error, jbh-alert-success, etc.)
✅ Typography (jbh-title, jbh-heading-*, jbh-text-muted, etc.)
✅ Layout Utilities (jbh-container, jbh-divider, jbh-spacer)
✅ Links (jbh-link, jbh-link-muted)
✅ Animations (jbh-animate-fade-in, jbh-animate-slide-up, etc.)
✅ Generic Empty State (jbh-empty-state, jbh-empty-state-icon, etc.)
✅ Generic Page Header (jbh-page-header, jbh-page-title, etc.)
✅ Base Skeleton (jbh-skeleton, jbh-skeleton-loading animation)
✅ Generic Table (jbh-table-header, jbh-table-row, jbh-table-cell)
✅ Generic Badges (jbh-status-badge, jbh-role-badge
2. **Use `jbh-*` classes**: `jbh-button-primary`, `jbh-input`, `jbh-card`, etc.
3. **Use `--jbh-*` variables** for colors, spacing, typography
4. Component SCSS = page layout only

#### i18n

1. **NEVER hardcode text** - use `{{ 'key' | translate }}`
2. **Both languages**: en.json AND es.json
3. **Sort keys alphabetically**
4. **Use `common`** namespace for shared text

#### Forms

1. **Use `ion-select`** (not native `<select>`) with `interface="selectInterface"`
   where in the TS file it should be: ` this.selectInterface = this.viewportService.selectInterface;    `
2. **Angular control flow**: `@if`, `@for` (not `*ngIf`, `*ngFor`)
3. **Reactive Forms** with `hasError()`, `getErrorMessage()` methods

#### Components

- Overview pages are snapshots, not reports.

1. **Separate files**: HTML, TS, SCSS (never inline). NOT generate the `spec.ts` files
2. **Standalone components** with proper imports
3. **Always include** `TranslateModule` in imports

#### Shared Components (CRITICAL — reuse these, never recreate inline)

**`<app-category-select>`** — `src/app/shared/components/category-select/`

Use this component whenever a page needs a category dropdown. It implements `ControlValueAccessor` so the parent uses `formControlName` directly on it.

```html
<div class="jbh-form-field">
  <label class="jbh-label">{{ 'your.category.label' | translate }}</label>
  <app-category-select
    formControlName="categoryId"
    [categories]="categories"
    [isLoading]="isLoadingCategories"
    [selectInterface]="selectInterface"
    [placeholder]="'your.category.placeholder' | translate"
    [hasError]="hasError('categoryId')"
  ></app-category-select>
</div>
```

- Renders the `ion-select` with spinner + error message + description hint automatically
- Shows selected category's `description` (multilanguage) as a contextual info box below the select
- Import: `import { CategorySelectComponent } from '@shared/components/category-select/category-select.component';`
- Add to component `imports[]` array
- Hint for missing product: add `<p class="jbh-field-hint">` below the component when no product is selected yet

#### Ionic Lifecycle (CRITICAL)

1. **NEVER call APIs in `ngOnInit()`** - Ionic reuses component instances when navigating
2. **Use `ionViewWillEnter()`** for API calls and data loading - this runs every time the page is displayed
3. **Implement `ViewWillEnter`** interface: `implements OnInit, OnDestroy, ViewWillEnter`
4. **Pattern**:
    - `ngOnInit()`: Form initialization, static setup, event subscriptions
    - `ionViewWillEnter()`: API calls, data refresh, dynamic state reset

#### Header Configuration (CRITICAL)

1. **Use `HeaderActionsService`** in `ionViewWillEnter()` to configure the page header
2. **Hamburger menu vs Back button**: The header shows EITHER a menu button OR a back button
   - Omit `showBackButton` (or set to `false`) for **top-level pages** → shows hamburger menu
   - Set `showBackButton: true` for **detail/child pages** → shows back button
3. **Always clear config** in `ionViewWillLeave()`: `this.headerActions.clearPageConfig()`

**Pattern**:
```typescript
// Top-level page (e.g., /portfolio/overview, /reports/balance-trends)
ionViewWillEnter(): void {
  this.headerActions.setPageConfig({
    title: 'feature.page.title',
    actions: [
      {
        id: 'refresh',
        icon: 'refresh-outline',
        handler: () => this.refreshData()
      }
    ]
    // No showBackButton - defaults to false, showing menu
  });
}

// Detail page (e.g., /portfolio/edit/:id, /transactions/details/:id)
ionViewWillEnter(): void {
  this.headerActions.setPageConfig({
    title: 'feature.detail.title',
    showBackButton: true  // Shows back button instead of menu
  });
}

ionViewWillLeave(): void {
  this.headerActions.clearPageConfig();
}
```

**Reference implementation**: `src/app/ui/products/pages/overview/products-overview.page.ts:67-87`

#### File Naming Convention

1. **Kebab-case with context**: Include feature context in generic page names
    - `create-product.page.ts` (NOT `create.page.ts`)
    - `edit-user.page.ts` (NOT `edit.page.ts`)
    - `list-orders.page.ts` (NOT `list.page.ts`)
2. **Pattern**: `[action]-[entity].page.ts` for clarity across features
3. **API Responses, Models, View Models**
   
##### API Response Interfaces (HTTP Boundary)


- Type: interface
-   Represents backend API responses
-   Must exactly match backend *Response objects: If the backend API defines the names of response objects, those names MUST be respected and reused exactly on the frontend. Do not rename API response objects.
-   Defines the frontend API contract.

-   Used only in API services
-   No methods
-   No UI logic
-   Not used directly in templates


Examples

-   MonthlyBalanceResponse
-   UserResponse



------------------------------------------------------------------------

##### Frontend Domain Models

- Type: class
- Name: Model

-   Represents application-level data
-   Used by components and business logic
-   May include computed properties and helper methods
-   Created by mapping from *Response
-   Independent from backend API shape
-   Safe to evolve with UI needs

Examples:

-   MonthlyBalanceModel
-   UserModel

Rules



------------------------------------------------------------------------

##### View Models (UI-Specific, Optional)
- Type: interface or class
- Name: ViewModel
-   Tailored for a specific component or screen
-   Contains display-only and formatting fields
-   Optimized for rendering

-   Used only by components/templates
-   Never used in API services
-   Never sent back to backend



Examples

-   MonthlyBalanceViewModel
-   DashboardViewModel



------------------------------------------------------------------------

#####  Mandatory Mapping Flow

API Response (interface) ↓ Domain Model (class) OR View Model (interface/class)

Example: MonthlyBalanceResponse ↓ MonthlyBalanceModel OR MonthlyBalanceViewModel

------------------------------------------------------------------------

##### Key Principle

Backend speaks in Responses. Frontend thinks in Models. UI renders
ViewModels or models.

#### Model Organization (CRITICAL)

**All feature-specific models are organized under `src/app/core/domain/features/` by business domain.**

This structure enforces clear boundaries, improves maintainability, and makes it easy to find and verify backend alignment.

##### Directory Structure

```
src/app/core/domain/
├── features/              # Feature-based organization
│   ├── products/
│   │   ├── api/          # HTTP boundary (DTOs)
│   │   │   ├── requests/     # What we send to backend
│   │   │   └── responses/    # What we receive from backend
│   │   ├── models/           # Domain models (application logic)
│   │   └── index.ts          # Barrel export
│   ├── movements/
│   │   ├── api/
│   │   ├── models/
│   │   ├── types/            # Shared types, enums, constants
│   │   └── index.ts
│   ├── teams/
│   ├── categories/
│   ├── balance-history/
│   └── preferences/
└── models/                # Shared cross-cutting models ONLY
    ├── user.model.ts
    ├── auth-token.model.ts
    ├── login-credentials.model.ts
    ├── jbh-error.model.ts
    └── portfolio-context.model.ts
```

##### File Naming Conventions

**Requests**: `{action}-{entity}.request.ts`
- Example: `create-product.request.ts` exports `CreateProductRequest`

**Responses**: `{entity}-{detail}-api.response.ts` or `{entity}-api.response.ts`
- Example: `product-list-item-api.response.ts` exports `ProductListItemApiResponse`
- Example: `create-product.response.ts` exports `CreateProductResponse`

**Models**: `{entity}-{detail}.model.ts` or `{entity}.model.ts`
- Example: `product-list-item.model.ts` exports `ProductListItem` class
- Example: `team.model.ts` exports `Team` class

**Types**: `{entity}.types.ts` or `{name}.enum.ts`
- Example: `movement.types.ts` exports `MovementType`
- Example: `member-status.enum.ts` exports `MemberStatus` enum

##### Import Examples

```typescript
// API Request/Response (for repositories)
import { CreateProductRequest } from '@core/domain/features/products/api/requests/create-product.request';
import { ProductListItemApiResponse } from '@core/domain/features/products/api/responses/product-list-item-api.response';

// Domain Models (for use cases, components)
import { ProductListItem } from '@core/domain/features/products/models/product-list-item.model';
import { MovementType } from '@core/domain/features/movements/types/movement.types';

// Barrel exports (preferred - cleaner)
import { CreateProductRequest, ProductListItem } from '@core/domain/features/products';
import { MovementType, ProductMovement } from '@core/domain/features/movements';
```

##### Organization Rules

1. **One export per file** (exceptions: small related types can be grouped in `types/` folder)
2. **API responses must match backend names** - verify with backend code before creating
3. **Shared cross-feature models** stay in `core/domain/models/`
4. **Feature-specific models** go in `features/{feature}/`
5. **Use barrel exports** (`index.ts`) for clean imports across the codebase

##### Available Features

- `@core/domain/features/auth` - Sign-up request, token and user-info responses (IAM names)
- `@core/domain/features/products` - Product types, metadata, CRUD operations
- `@core/domain/features/movements` - Deposits, withdrawals, balance snapshots
- `@core/domain/features/teams` - Team management, members, invitations
- `@core/domain/features/categories` - Income/expense categories
- `@core/domain/features/balance-history` - Monthly balance reports, trends
- `@core/domain/features/preferences` - User preferences, settings

#### Responsive

1. **Mobile-first CSS**
2. **Ionic Grid** for layouts
3. **Test** on 3+ viewport sizes

#### Authentication & JWT (CRITICAL)

1. **Three-Layer JWT Architecture**:
    - `TokenRefreshService`: Centralized refresh logic, prevents duplicate refreshes
    - `JwtInterceptor` (first): Adds Authorization header, proactive refresh if token missing
    - `ErrorInterceptor` (second): Handles 401/403/422, reactive refresh on token errors

2. **Public APIs**: Mark with `IS_PUBLIC_API` context token:

```typescript
    import { IS_PUBLIC_API } from '../interceptors/jwt.interceptor';
    context: new HttpContext().set(IS_PUBLIC_API, true)
```

3.  **Token Storage**: Uses `TokenStorageService` with Capacitor Preferences
4.  **Token Refresh Flow**:
    - **Proactive** (JwtInterceptor): When access token is missing from storage, attempts refresh BEFORE sending request
    - **Reactive** (ErrorInterceptor): On 401 with `AUTH_TOKEN_EXPIRED` or `AUTH_MISSING_TOKEN`, attempts refresh and retries
    - **Coordination**: `TokenRefreshService.waitForRefresh()` prevents concurrent refresh attempts
5.  **Platform Differences**:
    - Web/PWA: Refresh token in HTTP-only cookie (sent via `withCredentials: true`)
    - Mobile: Refresh token in secure storage (Keychain/Keystore), sent in request body
6.  **Error Codes Handled**:
    - `AUTH_TOKEN_EXPIRED`: Access token expired → refresh and retry
    - `AUTH_MISSING_TOKEN`: No Authorization header sent → refresh and retry

#### Error Handling

1. **All HTTP errors are `JBHError`**: The `ErrorInterceptor` wraps all errors in `JBHError`
2. **Type errors as `JBHError`** in API error handlers (not `any` or `unknown`):

```typescript
error: (error: JBHError) => {
  const message = error.isValidationError
    ? error.message  // Show server message for 422
    : this.translationService.instant('feature.errors.generic');
}
```

3. **422 = validation errors**: Show server message to user (`error.isValidationError`)
4. **Other errors**: Show generic fallback message (401/403/500 are technical errors)

### Common Classes

| Buttons | Forms | Layout |
|---------|-------|--------|
| `jbh-button-primary` | `jbh-form-field` | `jbh-container` |
| `jbh-button-secondary` | `jbh-input` | `jbh-card` |
| `jbh-button-block` | `jbh-label` | `jbh-card-elevated` |
| `jbh-button-loading` | `jbh-field-error` | `jbh-form-card` |

### CSS Variables

```scss
--jbh-primary-color    --jbh-spacing-sm (16px)    --jbh-radius-md (12px)
--jbh-error-color      --jbh-spacing-md (24px)    --jbh-shadow-md
--jbh-success-color    --jbh-spacing-lg (32px)    --jbh-shadow-xl
```

### Build Commands

```bash
ionic serve              # Web dev
ionic cap run ios -l     # iOS live reload
ionic cap run android -l # Android live reload
ionic build --prod       # Production
```

## Documentation

Project docs: `notes/` folder

## System map sync (`../jbh-deploy/README.md`)

This repo is one part of the JBH system. The map of how all JBH services talk to each other
lives in `../jbh-deploy/README.md` (the `jbh-deploy` repo, a sibling of this one in the `kkpa-jbh` folder).

**Rule:** when a change in this repo affects how services communicate, update `../jbh-deploy/README.md`
in the same task. Change only the rows or lines that are affected. Then commit it in the
`jbh-deploy` repo (a separate commit there; never one commit across repos).

Triggers for this repo:
- Change the API base URL in `src/environments/*.ts` or the target in `proxy.conf.json`
- Call a new backend prefix under `/jbh-api` (check that the gateway routes it)
- Change how the token is sent (header vs cookie) or the refresh flow

If you are not sure a change counts, read `../jbh-deploy/README.md` and check whether any line is now wrong.
