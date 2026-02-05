# JBH App - Ionic/Angular Mobile Development Guide

Expert guidance for Ionic/Angular hybrid mobile apps using Clean Architecture, DDD, responsive design, and consistent theming.

## Hybrid APP

- Ionic Framework + Angular to build cross-platform mobile apps
- Changes should work on iOS and Android along with the desktop web version

## Detailed Documentation

- [Architecture](docs/architecture.md) - Hexagonal/DDD/Clean Architecture, project structure
- [Theming](docs/theming.md) - CSS classes, variables, design system
- [Forms](docs/forms.md) - Reactive forms, validation, mobile patterns
- [i18n](docs/i18n.md) - Internationalization, translations
- [Responsive](docs/responsive.md) - Breakpoints, grid system, viewport detection

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
├── features/             # Lazy-loaded feature modules (pages,components)
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

- Do not use any function from console. Use the servie `private logger: LoggerService` instead.
- Do not do any calculations with numbers. All calculations must be done on the backend side. If you need to do any calculations, please stop the plan and alert the team.
- All format conversions must be done via directives or pipes. No format conversions in the component code.

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

7. **Backend JSON Translation Keys**: When the API returns a `translationKey` field containing JSON like `{"en":"Salary","es":"Salario"}`, use the `jbhTranslationKey` pipe in templates:
```html
<!-- ✅ GOOD - Use the pipe directly in template -->
{{ category.translationKey | jbhTranslationKey }}

<!-- ❌ BAD - Don't use methods that call on every change detection -->
{{ getCategoryName(category) }}
```

#### Theme System

1. **ALL styles** in `src/theme/custom-components.scss` - NO feature-specific theme files
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

#### Ionic Lifecycle (CRITICAL)

1. **NEVER call APIs in `ngOnInit()`** - Ionic reuses component instances when navigating
2. **Use `ionViewWillEnter()`** for API calls and data loading - this runs every time the page is displayed
3. **Implement `ViewWillEnter`** interface: `implements OnInit, OnDestroy, ViewWillEnter`
4. **Pattern**:
    - `ngOnInit()`: Form initialization, static setup, event subscriptions
    - `ionViewWillEnter()`: API calls, data refresh, dynamic state reset

#### File Naming Convention

1. **Kebab-case with context**: Include feature context in generic page names
    - `create-product.page.ts` (NOT `create.page.ts`)
    - `edit-user.page.ts` (NOT `edit.page.ts`)
    - `list-orders.page.ts` (NOT `list.page.ts`)
2. **Pattern**: `[action]-[entity].page.ts` for clarity across features

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
