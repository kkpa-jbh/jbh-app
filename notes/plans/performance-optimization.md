# Plan: Performance Analysis & Optimization for JBH App

## Executive Summary

After analyzing your Ionic/Angular codebase, I've identified **several critical performance issues** that are likely causing slow rendering. The main culprits are:

1. **Missing OnPush Change Detection** (23 of 24 components) - CRITICAL
2. **Expensive getter methods called on every render cycle** - CRITICAL
3. **Heavy CSS animations with backdrop-filter blur** - HIGH
4. **Memory leaks in auth pages** - HIGH

---

## Performance Issues Found

### 🔴 CRITICAL: Change Detection Strategy

**Problem:** 23 out of 24 components use Angular's default change detection strategy instead of `OnPush`.

**Impact:** Angular runs change detection on ALL components during EVERY change detection cycle, even when their inputs haven't changed. This causes exponential rendering overhead.

**Components WITHOUT OnPush (partial list):**
| Component | File Path |
|-----------|-----------|
| ProductCardComponent | `src/app/features/products/components/product-card/product-card.component.ts` |
| ProductsOverviewPage | `src/app/features/products/pages/overview/products-overview.page.ts` |
| BalanceSummaryCardsComponent | `src/app/features/products/components/balance-summary-cards/balance-summary-cards.component.ts` |
| AppMenuComponent | `src/app/shared/components/app-menu/app-menu.component.ts` |
| All pages (create, edit, overview, etc.) | Various |

**Only component WITH OnPush:**
- `BalanceHistoryTableComponent` (line 14)

---

### 🔴 CRITICAL: Expensive Getter Methods

**Problem:** Multiple components have getter properties with expensive operations (currency formatting, date calculations) that are recalculated on **every change detection cycle**.

**Worst Offenders:**

#### 1. ProductCardComponent (`product-card.component.ts` lines 88-157)
```typescript
// These getters are called EVERY change detection cycle:
get formattedInitialBalance()  // calls Intl.NumberFormat
get formattedCurrentBalance()  // calls Intl.NumberFormat
get formattedMovementBalance() // calls Intl.NumberFormat
get formattedNetProfit()       // calls Intl.NumberFormat
get formattedGrowthRate()      // string concatenation + toFixed
get relativeUpdatedTime()      // Complex date math (lines 142-157)
```

#### 2. BalanceSummaryCardsComponent (`balance-summary-cards.component.ts` lines 24-53)
```typescript
// 9 getter properties with Intl.NumberFormat calls
get formattedTotalBalance()
get formattedPeriodChange()
get formattedPeriodChangePercent()
get formattedAvgGrowth()
// etc.
```

**Impact:** When rendering a list of 10 products, these getters are called 10 × (number of getters) × (change detection cycles). A single scroll could trigger hundreds of expensive formatting operations.

---

### 🟠 HIGH: Memory Leaks in Auth Pages

**Problem:** Missing subscription cleanup in authentication components.

| File | Issue | Line |
|------|-------|------|
| `login.page.ts` | No `OnDestroy`, subscription in `captureReturnUrl()` never cleaned up | 70 |
| `signup.page.ts` | `.register()` and `.login()` calls missing `takeUntil(this.destroy$)` | 202, 218 |
| `app.component.ts` | Two subscriptions without cleanup | 30, 42 |

---

### 🟠 HIGH: CSS Performance Issues

**Problem 1: Backdrop Filter on Login Page**
- File: `src/app/features/auth/pages/login/login.page.scss` (line 48)
- Issue: `backdrop-filter: blur(80px)` on THREE animated circles
- Impact: One of the most expensive CSS operations, combined with infinite animations = constant GPU repainting

**Problem 2: Monolithic CSS File**
- File: `src/theme/custom-components.scss` (2,751 lines, 56.6 KB)
- Issue: Entire file loaded on every page, not tree-shakeable
- Contains 10 keyframe animations, all loaded globally

**Problem 3: Infinite Animations**
- Menu gradient shift animation runs continuously (10s infinite)
- Login decorative circles animate infinitely with blur

---

### 🟡 MEDIUM: Missing trackBy Function

**Problem:** App menu uses `*ngFor` without trackBy
- File: `src/app/shared/components/app-menu/app-menu.component.html` (line 17)
- Impact: Menu items re-render unnecessarily on navigation

---

### 🟡 MEDIUM: No Async Pipe Usage

**Problem:** All 52 observables use manual subscriptions instead of async pipe
- Impact: More boilerplate, doesn't leverage OnPush benefits, slightly higher memory risk

---

## Implementation Plan

### Phase 1: Quick Wins (Highest Impact)

#### 1.1 Create Currency Format Pipe
Create a reusable pipe to replace expensive getter methods:

**File to create:** `src/app/shared/pipes/currency-format.pipe.ts`
```typescript
@Pipe({ name: 'jbhCurrency', standalone: true, pure: true })
export class JbhCurrencyPipe implements PipeTransform {
  transform(value: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }
}
```

#### 1.2 Add OnPush to Key Components

**Files to modify:**
1. `src/app/features/products/components/product-card/product-card.component.ts`
2. `src/app/features/products/components/balance-summary-cards/balance-summary-cards.component.ts`
3. `src/app/shared/components/app-menu/app-menu.component.ts`
4. All page components (products, teams, auth, profile)

**Pattern:**
```typescript
import { ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
export class MyComponent {
  constructor(private cdr: ChangeDetectorRef) {}

  // Call this.cdr.markForCheck() when data changes asynchronously
}
```

#### 1.3 Fix Memory Leaks

**Files to modify:**
1. `src/app/features/auth/pages/login/login.page.ts` - Add OnDestroy, wrap subscription
2. `src/app/features/auth/pages/signup/signup.page.ts` - Add takeUntil to register/login
3. `src/app/app.component.ts` - Add OnDestroy and cleanup

---

### Phase 2: CSS Optimization

#### 2.1 Reduce Backdrop Filter Impact

**File:** `src/app/features/auth/pages/login/login.page.scss`

Replace:
```scss
backdrop-filter: blur(80px);
```
With:
```scss
backdrop-filter: blur(10px); // Or remove entirely
```

#### 2.2 Add trackBy to App Menu

**File:** `src/app/shared/components/app-menu/app-menu.component.html`

Add trackBy function to *ngFor loops.

---

### Phase 3: Refactor ProductCardComponent

**File:** `src/app/features/products/components/product-card/product-card.component.ts`

Replace getter methods with:
1. Use the new `JbhCurrencyPipe` in template
2. Pre-compute values in `ngOnChanges()` instead of getters
3. Add `ChangeDetectionStrategy.OnPush`

**Template changes** (`product-card.component.html`):
```html
<!-- Before -->
{{ formattedCurrentBalance }}

<!-- After -->
{{ product.currentBalance | jbhCurrency }}
```

---

## Verification Steps

After implementing fixes:

1. **Measure Before/After**: Use Chrome DevTools Performance tab to record and compare
2. **Check Change Detection**: Use Angular DevTools to verify OnPush is working
3. **Memory Profiling**: Use Chrome Memory tab to check for leaks
4. **Mobile Testing**: Test on actual iOS/Android devices

---

## Files to Modify Summary

| Priority | File | Change |
|----------|------|--------|
| 🔴 | `src/app/shared/pipes/currency-format.pipe.ts` | CREATE: New currency format pipe |
| 🔴 | `src/app/shared/pipes/index.ts` | UPDATE: Export new pipe |
| 🔴 | `product-card.component.ts` | Add OnPush, use pipe instead of getters |
| 🔴 | `product-card.component.html` | Use pipe in template |
| 🔴 | `balance-summary-cards.component.ts` | Add OnPush, use pipe |
| 🔴 | `login.page.ts` | Add OnDestroy, fix subscription leak |
| 🔴 | `signup.page.ts` | Add takeUntil to register/login calls |
| 🟠 | `login.page.scss` | Remove/reduce backdrop-filter blur |
| 🟠 | `app-menu.component.ts` | Add OnPush |
| 🟠 | `app-menu.component.html` | Add trackBy to *ngFor |
| 🟠 | All page components | Add OnPush change detection |

---

## Expected Impact

After implementing these changes:
- **50-70% reduction** in change detection cycles
- **Faster list rendering** (products overview, teams overview)
- **Smoother animations** on login page
- **No memory leaks** in auth flow
- **Better mobile performance** especially on iOS
