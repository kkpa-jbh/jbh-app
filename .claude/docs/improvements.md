# Known Issues & Improvements

> **Purpose:** Track identified issues in the codebase with priority levels, specific files to fix, and clear remediation strategies.

---

## Priority Legend

- **🔴 CRITICAL** - Severe performance impact or broken functionality
- **🟠 HIGH** - Significant UX/DX issues or maintainability concerns
- **🟡 MEDIUM** - Nice-to-have improvements
- **🟢 LOW** - Minor optimizations

---

## 1. Performance Issues 🔴 CRITICAL

### 1.1 Missing OnPush Change Detection

**Impact:** Severe performance degradation, especially on mobile devices

**Files Affected (14 components):**

Need to audit all components and add `ChangeDetectionStrategy.OnPush` to:

```bash
# Find all components missing OnPush
grep -r "@Component" src/app --include="*.ts" | \
grep -v "changeDetection: ChangeDetectionStrategy.OnPush" | \
grep -v "spec.ts"
```

**Common Locations:**
- Feature pages: `src/app/features/*/pages/**/*.page.ts`
- Components: `src/app/features/*/components/**/*.component.ts`
- Shared components: `src/app/shared/components/**/*.component.ts`

**Fix:**

```typescript
// Add to every component
import { ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-my-component',
  templateUrl: './my-component.html',
  styleUrls: ['./my-component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush // ADD THIS
})
export class MyComponent {
  constructor(private cdr: ChangeDetectorRef) {} // INJECT THIS

  loadData(): void {
    this.service.getData().subscribe(data => {
      this.data = data;
      this.cdr.markForCheck(); // CALL THIS after async updates
    });
  }
}
```

**Verification:**
```bash
# Ensure all components have OnPush
grep -r "changeDetection: ChangeDetectionStrategy.OnPush" src/app --include="*.ts" | wc -l
```

---

### 1.2 Getter Methods for Formatting

**Impact:** Performance degradation due to repeated function calls on every change detection cycle

**Files Affected:**
- `src/app/features/products/components/product-card/product-card.component.ts`
- `src/app/features/products/components/balance-summary-cards/balance-summary-cards.component.ts`

**Example Issues:**

**File:** `product-card.component.ts`
```typescript
// ❌ BAD: These are called hundreds of times per second
get growthRateClass(): string {
  if (this.product.growthRate > 0) return 'positive';
  if (this.product.growthRate < 0) return 'negative';
  return 'neutral';
}

get profitClass(): string {
  if (this.product.netProfit > 0) return 'positive';
  if (this.product.netProfit < 0) return 'negative';
  return '';
}
```

**Fix Option 1: Property Binding**
```typescript
// ✅ GOOD: Compute once during data mapping
@Input() set product(value: ProductListItem) {
  this._product = value;
  this.growthRateClass = this.computeGrowthClass(value.growthRate);
  this.profitClass = this.computeProfitClass(value.netProfit);
}

private _product!: ProductListItem;
get product(): ProductListItem {
  return this._product;
}

growthRateClass = '';
profitClass = '';

private computeGrowthClass(rate: number): string {
  if (rate > 0) return 'positive';
  if (rate < 0) return 'negative';
  return 'neutral';
}
```

**Fix Option 2: Inline Class Binding**
```html
<!-- Template -->
<div [class]="product.growthRate > 0 ? 'positive' : product.growthRate < 0 ? 'negative' : 'neutral'">
  {{ product.growthRate | jbhGrowth }}
</div>
```

**Files to Update:**
1. `product-card.component.ts` - Remove `growthRateClass()` and `profitClass()` getters
2. `balance-summary-cards.component.ts` - Remove formatting getters

---

### 1.3 Method-Based Chart Formatting

**Impact:** Performance degradation in chart rendering

**File Affected:**
- `src/app/features/products/components/balance-chart/balance-chart.component.ts`

**Issue:**
```typescript
// ❌ BAD: Method called repeatedly during chart rendering
formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(value);
}
```

**Fix:**
```typescript
// ✅ GOOD: Arrow function with cached formatter
private currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

formatCurrency = (value: number): string => {
  return this.currencyFormatter.format(value);
};
```

**File to Update:**
- `balance-chart.component.ts` - Use cached formatter

---

## 2. Duplicated Styles 🟠 HIGH

### 2.1 Product Card Styles

**Impact:** Maintenance burden, style inconsistencies, larger bundle size

**Files Affected:**
- `src/theme/custom-components.scss` (lines 1963-2283) - CORRECT SOURCE
- `src/app/features/products/components/product-card/product-card.component.scss` - DUPLICATE

**Issue:**
Product card styles are defined in BOTH the global theme file and the component SCSS file. This violates the single source of truth principle.

**Fix:**

**Step 1:** Verify styles in theme are complete
```bash
# Check theme file has all product card styles
grep -A 5 ".jbh-product-card" src/theme/custom-components.scss
```

**Step 2:** Delete component SCSS file
```bash
# Backup first
cp src/app/features/products/components/product-card/product-card.component.scss \
   src/app/features/products/components/product-card/product-card.component.scss.bak

# Delete the file
rm src/app/features/products/components/product-card/product-card.component.scss
```

**Step 3:** Remove SCSS reference from component
```typescript
// product-card.component.ts
@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  // styleUrls: ['./product-card.component.scss'], // REMOVE THIS LINE
  standalone: true,
  // ...
})
```

**Verification:**
```bash
# Test that product cards still render correctly
ionic serve
# Navigate to /products/overview and verify styling
```

---

### 2.2 Balance History Table Styles

**Impact:** Maintenance burden, style inconsistencies

**Files Affected:**
- `src/theme/custom-components.scss` (lines 2418-2625) - CORRECT SOURCE
- `src/app/features/products/components/balance-history-table/balance-history-table.component.scss` - DUPLICATE

**Issue:**
Same as product card - styles duplicated between theme and component files.

**Fix:**

**Step 1:** Verify theme has all table styles
```bash
grep -A 5 ".jbh-balance-table" src/theme/custom-components.scss
```

**Step 2:** Delete component SCSS
```bash
# Backup first
cp src/app/features/products/components/balance-history-table/balance-history-table.component.scss \
   src/app/features/products/components/balance-history-table/balance-history-table.component.scss.bak

# Delete
rm src/app/features/products/components/balance-history-table/balance-history-table.component.scss
```

**Step 3:** Remove SCSS reference
```typescript
// balance-history-table.component.ts
@Component({
  selector: 'app-balance-history-table',
  templateUrl: './balance-history-table.component.html',
  // styleUrls: ['./balance-history-table.component.scss'], // REMOVE
  standalone: true,
  // ...
})
```

**Verification:**
```bash
# Test balance history table rendering
ionic serve
# Navigate to balance history and verify table/card styling
```

---

## 3. Accessibility Issues 🟠 HIGH

### 3.1 Touch Targets Too Small

**Impact:** Poor mobile UX, WCAG AA compliance failure

**Files Affected:**
- `src/theme/custom-components.scss` (lines 1685-1737) - `.jbh-icon-button`

**Issue:**
Current icon button sizes:
- Standard: 36px × 36px
- Small: 32px × 32px

WCAG AA requires minimum 48px × 48px for touch targets.

**Fix:**

**File:** `src/theme/custom-components.scss`

```scss
// Lines 1685-1711
.jbh-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;  // CHANGE: from 36px
  height: 48px; // CHANGE: from 36px
  padding: 0;
  border: none;
  border-radius: var(--jbh-radius-sm);
  background: transparent;
  color: var(--jbh-text-secondary);
  cursor: pointer;
  transition: all var(--jbh-transition-base);

  ion-icon {
    font-size: 24px; // CHANGE: from 20px
  }

  &:hover {
    background: rgba(102, 126, 234, 0.1);
    color: var(--jbh-primary-color);
  }

  &:active {
    transform: scale(0.95);
  }
}

.jbh-icon-button-small {
  width: 48px;  // CHANGE: from 32px (avoid using if possible)
  height: 48px; // CHANGE: from 32px

  ion-icon {
    font-size: 20px; // CHANGE: from 18px
  }
}
```

**Impact Assessment:**
- May require layout adjustments in dense UIs
- Test all pages with icon buttons after change
- Particularly check:
  - Product card actions
  - Table row actions
  - Header actions

**Verification:**
```bash
# Find all uses of jbh-icon-button
grep -r "jbh-icon-button" src/app --include="*.html" | wc -l

# Test on mobile device (iPhone 14)
ionic cap run ios -l
```

---

### 3.2 Missing ARIA Labels

**Impact:** Screen reader accessibility failure

**Files Affected:**
- All components with icon buttons
- All data tables
- All expandable sections

**Issue:**
Icon buttons lack `aria-label` attributes, making them inaccessible to screen readers.

**Fix Pattern:**

```html
<!-- ❌ BAD: No context for screen readers -->
<button class="jbh-icon-button" (click)="refresh()">
  <ion-icon name="refresh-outline"></ion-icon>
</button>

<!-- ✅ GOOD: Clear label -->
<button
  class="jbh-icon-button"
  (click)="refresh()"
  aria-label="{{ 'button.refresh' | translate }}"
  title="{{ 'button.refresh' | translate }}"
>
  <ion-icon name="refresh-outline"></ion-icon>
</button>
```

**Files to Audit:**
```bash
# Find all icon buttons without aria-label
grep -r "jbh-icon-button" src/app --include="*.html" | \
grep -v "aria-label"
```

**Fix Checklist:**
- [ ] Add `aria-label` to ALL icon buttons
- [ ] Add `role="table"` to table containers
- [ ] Add `role="row"` and `role="cell"` to table elements
- [ ] Add `aria-expanded` to expandable sections
- [ ] Add `role="status"` to loading states
- [ ] Add `role="alert"` to error messages

---

### 3.3 Color Contrast

**Impact:** WCAG AA compliance concern

**Files Affected:**
- `src/theme/custom-components.scss` (line 38) - `--jbh-text-tertiary`

**Issue:**
`--jbh-text-tertiary: #a0aec0` on white background may not meet WCAG AA 4.5:1 contrast ratio.

**Testing:**
```bash
# Use WebAIM Contrast Checker
# https://webaim.org/resources/contrastchecker/
# Foreground: #a0aec0
# Background: #ffffff
```

**Fix (if needed):**
```scss
:root {
  // If contrast fails, darken tertiary text
  --jbh-text-tertiary: #8892a0; // Darker alternative (test contrast)
}
```

**Verification:**
- Test with Lighthouse accessibility audit
- Verify all uses of `--jbh-text-tertiary` still look good

---

## 4. Theme Issues 🟡 MEDIUM

### 4.1 Undefined CSS Variable

**Impact:** Potential styling bug

**File Affected:**
- `src/theme/custom-components.scss` (line 2093)

**Issue:**
```scss
.jbh-status-toggle {
  background: var(--jbh-background-secondary); // UNDEFINED VARIABLE
}
```

**Fix Option 1: Define the variable**
```scss
:root {
  --jbh-background-secondary: #f7f8fa; // Add if needed
}
```

**Fix Option 2: Use existing variable**
```scss
.jbh-status-toggle {
  background: var(--jbh-background-light); // Use existing
}
```

**Verification:**
```bash
# Check if variable is used elsewhere
grep -r "jbh-background-secondary" src/theme/
```

---

### 4.2 Backdrop Filter on Static Element

**Impact:** Minor performance concern (not animated, so low priority)

**File Affected:**
- `src/theme/custom-components.scss` (line 1158)

**Issue:**
```scss
.jbh-menu-logo {
  backdrop-filter: blur(10px); // Expensive CSS property
}
```

**Context:**
- This is NOT animated, so impact is minimal
- Only renders once on menu open
- Could be removed for consistency with animation guidelines

**Fix (optional):**
```scss
.jbh-menu-logo {
  // backdrop-filter: blur(10px); // REMOVE
  background: rgba(255, 255, 255, 0.25); // Fallback already exists
}
```

**Decision:** LOW priority - only remove if broader performance issues arise

---

## 5. Implementation Checklist

### Phase 1: Critical Performance Fixes 🔴
- [ ] Audit all components for missing `ChangeDetectionStrategy.OnPush`
- [ ] Add `OnPush` to all components
- [ ] Inject `ChangeDetectorRef` where needed
- [ ] Add `markForCheck()` calls after async updates
- [ ] Remove getter methods in `product-card.component.ts`
- [ ] Remove getter methods in `balance-summary-cards.component.ts`
- [ ] Fix chart formatting in `balance-chart.component.ts`
- [ ] Test all affected pages

### Phase 2: Duplicated Styles 🟠
- [ ] Delete `product-card.component.scss`
- [ ] Remove `styleUrls` from `product-card.component.ts`
- [ ] Delete `balance-history-table.component.scss`
- [ ] Remove `styleUrls` from `balance-history-table.component.ts`
- [ ] Test product cards and balance tables

### Phase 3: Accessibility 🟠
- [ ] Update icon button sizes in `custom-components.scss`
- [ ] Test layout on all pages with icon buttons
- [ ] Audit all icon buttons for `aria-label`
- [ ] Add `aria-label` to all icon buttons
- [ ] Add `role` attributes to tables
- [ ] Add `aria-expanded` to expandable elements
- [ ] Add `role="status"` to loading states
- [ ] Add `role="alert"` to error messages
- [ ] Test color contrast for `--jbh-text-tertiary`
- [ ] Adjust if needed
- [ ] Run Lighthouse accessibility audit

### Phase 4: Theme Cleanup 🟡
- [ ] Fix undefined `--jbh-background-secondary` variable
- [ ] (Optional) Remove `backdrop-filter` from `.jbh-menu-logo`
- [ ] Verify all theme variables are defined and used

---

## 6. Testing Strategy

### Performance Testing
1. **Before/After Metrics:**
   - Measure FPS on product list scrolling
   - Measure time to interactive (TTI)
   - Use Chrome DevTools Performance profiler

2. **Test Cases:**
   - Product overview with 10+ products
   - Balance history with large dataset
   - Rapid navigation between pages

### Accessibility Testing
1. **Automated:**
   - Lighthouse accessibility score (target: 90+)
   - axe DevTools browser extension

2. **Manual:**
   - Screen reader testing (VoiceOver on iOS)
   - Keyboard navigation (tab through all interactive elements)
   - Touch target testing on mobile device

### Visual Regression Testing
1. **After Style Changes:**
   - Screenshot all pages before changes
   - Compare after icon button size increase
   - Ensure layouts still work

---

## 7. Progress Tracking

**Status:** 📋 Documented
**Next Steps:** Prioritize Phase 1 (Critical Performance Fixes)

**Estimated Effort:**
- Phase 1: 4-6 hours
- Phase 2: 1-2 hours
- Phase 3: 6-8 hours
- Phase 4: 1 hour

**Total:** ~12-17 hours

---

## 8. Future Improvements (Not Critical)

### Code Organization
- Consider splitting `custom-components.scss` into smaller files (e.g., `_buttons.scss`, `_forms.scss`) and importing them

### Design System
- Add Storybook for component documentation and visual testing
- Create design system site with live examples

### Testing
- Add E2E tests for critical user flows
- Add unit tests for complex components

### Developer Experience
- Create component generator CLI tool
- Add ESLint rules to enforce OnPush and other patterns
- Add pre-commit hooks to run linters

---

**Last Updated:** 2026-02-12
**Maintainer:** Development Team
