# Accessibility & Maintainability Improvements
**Plan Date:** 2026-02-14
**Status:** Pending
**Priority:** Medium
**Estimated Effort:** 1-2 hours

## Context

This plan addresses the remaining medium-priority compliance issues identified during the comprehensive CLAUDE.md audit on 2026-02-14. All critical and high-priority issues have been resolved (100% completion).

**Completed in previous session:**
- ✅ All performance violations (OnPush, console.log)
- ✅ Modern Angular syntax migration (@if/@for)
- ✅ WCAG AA touch target compliance (48px icon buttons)
- ✅ ARIA labels on all icon buttons
- ✅ Consistent subscription patterns (takeUntil)

## Remaining Tasks

### 1. Sort Translation Keys Alphabetically

**Affected Files:**
- `src/assets/i18n/en.json`
- `src/assets/i18n/es.json`

**Rule:** "Sort keys alphabetically" (CLAUDE.md - i18n section)

**Issues Found:**
- Root level: `menu` appears before `login`
- `products.balanceHistory`: `totalCredits` before `table`
- `teams`: `create` before `acceptInvitation`

**Implementation Steps:**
1. **Option A (Manual):**
   - Back up both files
   - Use VS Code "Sort JSON" extension or online JSON sorter
   - Sort root level and nested objects alphabetically
   - Verify no translation keys were lost (diff check)
   - Test all pages to ensure translations still work

2. **Option B (Automated - Recommended):**
   - Install `sort-json` npm package
   - Add npm script: `"sort-i18n": "sort-json src/assets/i18n/*.json"`
   - Run script and commit changes
   - Add pre-commit hook to keep keys sorted

**Risks:**
- Low risk - purely cosmetic change
- Could break if manual sorting introduces typos
- Recommend using automated tool

**Estimated Effort:** 30 minutes (automated) or 1 hour (manual)

**Acceptance Criteria:**
- [ ] All keys at root level are sorted A-Z
- [ ] All nested object keys are sorted A-Z
- [ ] No translation keys lost (verify with `wc -l` before/after)
- [ ] All pages load without missing translation warnings

---

### 2. Add Semantic ARIA Roles to Tables

**Rule:** "Add semantic roles to tables" (CLAUDE.md - Accessibility section)

**Affected Files:**
- `src/app/ui/products/components/balance-history-table/balance-history-table.component.html`
- `src/app/ui/teams/pages/overview/overview-team.page.html` (2 tables)
- `src/app/ui/products/pages/product-movements/product-movements.page.html`

**Current Issue:**
Tables use `jbh-table`, `jbh-table-header`, `jbh-table-row`, `jbh-table-cell` classes but lack semantic ARIA roles.

**Implementation Pattern:**
```html
<!-- Before -->
<div class="jbh-table">
  <div class="jbh-table-header">
    <div class="jbh-table-row">
      <div class="jbh-table-cell">Header</div>
    </div>
  </div>
  <div class="jbh-table-body">
    <div class="jbh-table-row">
      <div class="jbh-table-cell">Data</div>
    </div>
  </div>
</div>

<!-- After -->
<div class="jbh-table" role="table" aria-label="{{ 'table.ariaLabel' | translate }}">
  <div class="jbh-table-header" role="rowgroup">
    <div class="jbh-table-row" role="row">
      <div class="jbh-table-cell" role="columnheader">Header</div>
    </div>
  </div>
  <div class="jbh-table-body" role="rowgroup">
    <div class="jbh-table-row" role="row">
      <div class="jbh-table-cell" role="cell">Data</div>
    </div>
  </div>
</div>
```

**Implementation Steps:**

#### Task 2.1: Balance History Table
**File:** `src/app/ui/products/components/balance-history-table/balance-history-table.component.html`

1. Add `role="table"` to `.jbh-table` wrapper
2. Add `aria-label` with translated label (e.g., "Balance history table")
3. Add `role="rowgroup"` to header and body sections
4. Add `role="row"` to each `.jbh-table-row`
5. Add `role="columnheader"` to header cells
6. Add `role="cell"` to data cells

**Estimated Effort:** 10 minutes

#### Task 2.2: Team Overview Tables
**File:** `src/app/ui/teams/pages/overview/overview-team.page.html`

Contains 2 tables:
- Desktop members table (`.jbh-members-table.jbh-hide-mobile`)
- Mobile cards view (`.jbh-members-cards.jbh-hide-desktop`)

Apply same pattern as 2.1 to desktop table. Mobile cards don't need table roles (use `role="list"` and `role="listitem"` instead).

**Estimated Effort:** 15 minutes

#### Task 2.3: Product Movements Table
**File:** `src/app/ui/products/pages/product-movements/product-movements.page.html`

Apply same pattern as 2.1.

**Estimated Effort:** 10 minutes

**Acceptance Criteria:**
- [ ] All `.jbh-table` elements have `role="table"` and `aria-label`
- [ ] All headers use `role="rowgroup"` and `role="columnheader"`
- [ ] All body sections use `role="rowgroup"` and `role="cell"`
- [ ] Screen reader testing passes (VoiceOver/NVDA announces tables correctly)

---

### 3. Add Roles to State Elements

**Rule:** "Add roles to state elements" (CLAUDE.md - Accessibility section)

**Current Issue:**
Loading and error states lack ARIA live regions, so screen readers don't announce state changes.

**Implementation Pattern:**
```html
<!-- Loading states -->
<div role="status" aria-live="polite" aria-busy="true">
  <ion-spinner></ion-spinner>
  <span>{{ 'common.loading' | translate }}</span>
</div>

<!-- Error states -->
<div role="alert" aria-live="assertive">
  <ion-icon name="alert-circle"></ion-icon>
  <span>{{ errorMessage }}</span>
</div>

<!-- Success states -->
<div role="status" aria-live="polite">
  <ion-icon name="checkmark-circle"></ion-icon>
  <span>{{ successMessage }}</span>
</div>
```

**Files to Update:**
Search for all instances of:
- Loading spinners without `role="status"`
- Error messages without `role="alert"`
- Success messages without `role="status"`

**Search Commands:**
```bash
# Find loading states
grep -r "jbh-loading" src/app/ui/ --include="*.html"
grep -r "ion-spinner" src/app/ui/ --include="*.html"

# Find error states
grep -r "jbh-alert-error" src/app/ui/ --include="*.html"
grep -r "errorMessage" src/app/ui/ --include="*.html"

# Find success states
grep -r "jbh-alert-success" src/app/ui/ --include="*.html"
```

**Common Files to Update:**
- All page templates with loading states
- All forms with validation errors
- All components with async operations

**Implementation Steps:**
1. Add `role="status" aria-live="polite"` to all loading states
2. Add `role="alert" aria-live="assertive"` to all error alerts
3. Add `role="status" aria-live="polite"` to all success messages
4. Optionally add `aria-busy="true"` to loading containers

**Estimated Effort:** 30-45 minutes (depends on number of files)

**Acceptance Criteria:**
- [ ] All loading states have `role="status" aria-live="polite"`
- [ ] All error states have `role="alert" aria-live="assertive"`
- [ ] Screen reader announces state changes (test with VoiceOver/NVDA)

---

## Implementation Order

**Recommended sequence:**
1. **ARIA roles to tables** (Task 2) - Clear pattern, low risk
2. **Roles to state elements** (Task 3) - Important for screen readers
3. **Sort translation keys** (Task 1) - Lower priority, use automated tool

## Testing Checklist

After implementing all tasks:

### Accessibility Testing
- [ ] Test with VoiceOver (macOS): `Cmd+F5`
- [ ] Test with NVDA (Windows) or screen reader of choice
- [ ] Verify tables are announced with row/column counts
- [ ] Verify state changes are announced (loading → loaded)
- [ ] Run Lighthouse accessibility audit (should score 90+)

### Functional Testing
- [ ] All pages load without errors
- [ ] All translations display correctly (no missing keys)
- [ ] No console errors
- [ ] Tables render correctly on mobile and desktop

### Code Quality
- [ ] Run `npm run lint` - no new errors
- [ ] Run `npm run build` - successful build
- [ ] Git diff review - only expected changes

## Success Metrics

**Before:**
- WCAG AA compliance: ~85%
- Lighthouse Accessibility: ~88
- i18n maintainability: Medium (unsorted keys)

**After:**
- WCAG AA compliance: 95%+
- Lighthouse Accessibility: 95+
- i18n maintainability: High (sorted, easy to find keys)
- Screen reader support: Excellent

## References

- [WCAG 2.1 Table Requirements](https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html)
- [ARIA Table Role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/table_role)
- [ARIA Live Regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions)
- Project: `.claude/CLAUDE.md` - Section 13 (Accessibility Guidelines)

## Notes

- All critical and high-priority issues from the 2026-02-14 audit are complete
- These tasks are **enhancements**, not blocking issues
- Can be implemented incrementally over multiple sprints
- Consider adding to "accessibility debt" backlog if deferring
