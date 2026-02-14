# Compliance Audit Skill

**Skill Name:** compliance-audit
**Invocation:** `/compliance-audit` or `@compliance-audit`
**Purpose:** Validate that all code in the codebase follows the guidelines and rules defined in `.claude/CLAUDE.md`

## ⚠️ IMPORTANT: User-Controlled Execution Only

**DO NOT run this skill automatically.** This skill should ONLY be invoked when the user explicitly requests it by typing:
- `/compliance-audit`
- `@compliance-audit`
- "Run the compliance audit"
- "Check code compliance"

**DO NOT** run this audit:
- When the user asks general questions
- During regular code changes
- As part of other tasks
- Proactively or unsolicited

## Skill Description

Performs a comprehensive audit of the codebase to identify violations of project guidelines defined in `.claude/CLAUDE.md`. Returns a detailed report organized by severity level (Critical, High, Medium) with specific file locations and recommended fixes.

## Audit Scope

### 1. Performance (CRITICAL)
- ✅ All components use `ChangeDetectionStrategy.OnPush`
- ✅ No getter methods for formatting (use pipes instead)
- ✅ All subscriptions use `takeUntil(destroy$)` pattern (not manual unsubscribe)
- ✅ All `@for` loops have `trackBy`
- ✅ No `console.*` usage (use `LoggerService` instead)
- ✅ No `backdrop-filter: blur()` on animated elements
- ✅ Pipes used for display, directives only for form inputs
- ✅ Backend JSON translation keys use `jbhTranslationKey` pipe

### 2. Ionic Lifecycle (CRITICAL)
- ✅ API calls in `ionViewWillEnter()`, NOT `ngOnInit()`
- ✅ `HeaderActionsService` configuration in `ionViewWillEnter()`
- ✅ `HeaderActionsService.clearPageConfig()` in `ionViewWillLeave()`
- ✅ Correct `showBackButton` usage (false for top-level, true for detail pages)

### 3. Charts (CRITICAL)
- ✅ All ngx-charts components have `[animations]="false"`

### 4. Accessibility (HIGH PRIORITY)
- ✅ All icon buttons have `aria-label` and `title` attributes
- ✅ Minimum touch target size: 48px × 48px
- ✅ Semantic ARIA roles on tables (`role="table"`, `role="row"`, etc.)
- ✅ State elements have roles (`role="status"`, `role="alert"`)
- ✅ Expandable elements have `aria-expanded` and `aria-controls`

### 5. i18n (HIGH PRIORITY)
- ✅ No hardcoded text in templates (use `{{ 'key' | translate }}`)
- ✅ All translation keys exist in both `en.json` AND `es.json`
- ✅ Translation keys are sorted alphabetically (MEDIUM priority)

### 6. Angular Syntax (HIGH PRIORITY)
- ✅ Use `@if`, `@for`, `@switch` (NOT `*ngIf`, `*ngFor`, `*ngSwitchCase`)
- ✅ All components are standalone
- ✅ Separate files for HTML, TS, SCSS (no inline templates)

### 7. Forms (MEDIUM PRIORITY)
- ✅ Use `ion-select` with `interface="selectInterface"` (not native `<select>`)
- ✅ Reactive Forms with `hasError()` and `getErrorMessage()` methods

### 8. Architecture (MEDIUM PRIORITY)
- ✅ Models organized under `src/app/core/domain/features/{feature}/`
- ✅ API responses in `api/responses/`, domain models in `models/`
- ✅ File naming: kebab-case with context (e.g., `create-product.page.ts`)
- ✅ No feature-specific theme files (all styles in `custom-components.scss`)

### 9. Authentication & Errors (MEDIUM PRIORITY)
- ✅ Public APIs marked with `IS_PUBLIC_API` context token
- ✅ Errors typed as `JBHError` (not `any` or `unknown`)
- ✅ Validation errors (422) show server message, other errors show generic

## Execution Steps

When invoked, perform the following steps:

### Step 1: Performance Audit
```bash
# Check for components without OnPush
grep -r "@Component" src/app/ui/ --include="*.ts" -A 5 | grep -v "OnPush"

# Check for console.* usage
grep -r "console\." src/app/ --include="*.ts" | grep -v "// " | grep -v "LoggerService"

# Check for getter methods that might be used in templates
grep -r "^\s*get " src/app/ui/ --include="*.ts" -B 2 -A 3

# Check for @for without trackBy
grep -r "@for" src/app/ui/ --include="*.html" | grep -v "track"

# Check for manual Subscription (should use takeUntil)
grep -r "Subscription" src/app/ui/ --include="*.ts" -A 5 | grep -v "takeUntil"
```

### Step 2: Ionic Lifecycle Audit
```bash
# Check for API calls in ngOnInit (should be in ionViewWillEnter)
grep -r "ngOnInit" src/app/ui/*/pages/ --include="*.ts" -A 10 | grep -E "(http\.|subscribe|useCase)"

# Check for missing ionViewWillLeave cleanup
grep -r "ionViewWillEnter" src/app/ui/*/pages/ --include="*.ts" | while read file; do
  if ! grep -q "ionViewWillLeave" "$file"; then
    echo "Missing ionViewWillLeave in $file"
  fi
done
```

### Step 3: Accessibility Audit
```bash
# Check for icon buttons without aria-label
grep -r "jbh-icon-button" src/app/ui/ --include="*.html" -A 2 | grep -v "aria-label"

# Check for tables without ARIA roles
grep -r "jbh-table" src/app/ui/ --include="*.html" | grep -v "role=\"table\""

# Check for loading/error states without roles
grep -r "ion-spinner" src/app/ui/ --include="*.html" | grep -v "role="
grep -r "jbh-alert-error" src/app/ui/ --include="*.html" | grep -v "role="
```

### Step 4: i18n Audit
```bash
# Check for hardcoded text (excluding comments and test files)
grep -r ">[A-Z][a-z]" src/app/ui/ --include="*.html" | grep -v "translate" | grep -v "<!--"

# Check for missing translations (keys in en.json not in es.json)
diff <(jq -r 'keys[]' src/assets/i18n/en.json | sort) <(jq -r 'keys[]' src/assets/i18n/es.json | sort)
```

### Step 5: Angular Syntax Audit
```bash
# Check for old control flow syntax
grep -r "\*ngIf" src/app/ui/ --include="*.html"
grep -r "\*ngFor" src/app/ui/ --include="*.html"
grep -r "\*ngSwitch" src/app/ui/ --include="*.html"
```

### Step 6: Generate Report

Create a structured report with:

1. **Executive Summary**
   - Total violations found
   - Files affected
   - Overall compliance percentage

2. **Critical Violations** (must fix immediately)
   - List each violation with file:line
   - Show current code
   - Show recommended fix
   - Explain impact

3. **High Priority Violations** (should fix soon)
   - Same structure as Critical

4. **Medium Priority Violations** (nice to have)
   - Same structure as Critical

5. **What's Working Well** ✅
   - List rules that are being followed correctly
   - Praise good patterns found

6. **Recommended Action Plan**
   - Prioritized list of fixes
   - Estimated effort for each
   - Dependencies between fixes

## Output Format

```markdown
# CLAUDE.md Compliance Audit Report
**Generated:** [timestamp]
**Auditor:** Claude Sonnet 4.5
**Codebase:** JBH App

## Executive Summary
- **Total Violations:** [number]
- **Critical:** [number] | **High:** [number] | **Medium:** [number]
- **Files Affected:** [number]
- **Overall Compliance:** [percentage]%

## Critical Violations (MUST FIX) - [count]

### 1. [Violation Name]
**Rule:** "[exact rule from CLAUDE.md]"
**Severity:** Critical
**Files Affected:** [count]

**Example:**
```typescript
// File: path/to/file.ts:123
// Current (WRONG):
[code snippet]

// Fix (CORRECT):
[code snippet]
```

**Impact:** [explanation of why this is critical]
**Estimated Fix Time:** [time]

[Repeat for each violation type]

## High Priority Violations (SHOULD FIX) - [count]
[Same structure]

## Medium Priority Violations (NICE TO HAVE) - [count]
[Same structure]

## What's Working Well ✅
- ✅ [Pattern 1]: [description]
- ✅ [Pattern 2]: [description]

## Action Plan
1. **Phase 1 (Critical):** [list of tasks]
   - Estimated effort: [time]
2. **Phase 2 (High):** [list of tasks]
   - Estimated effort: [time]
3. **Phase 3 (Medium):** [list of tasks]
   - Estimated effort: [time]

## Verification Steps
[Commands to verify fixes]
```

## Usage Examples

**User types:**
```
/compliance-audit
```

**Claude responds:**
```
🔍 Running comprehensive CLAUDE.md compliance audit...

Scanning 247 files across src/app/...
✓ Performance checks
✓ Ionic lifecycle patterns
✓ Accessibility guidelines
✓ i18n compliance
✓ Angular syntax
✓ Architecture patterns

📊 Generating detailed report...
```

Then outputs the full report as specified above.

## Notes for Claude

- This audit can take 2-3 minutes to complete thoroughly
- Use parallel grep/find commands where possible for speed
- Focus on **actionable** findings with clear fix instructions
- Include file:line numbers for every violation
- Show code snippets to make fixes obvious
- Prioritize by impact, not just count
- Celebrate what's working well (positive reinforcement)
- Provide realistic time estimates
- Group related violations together
- Link to specific CLAUDE.md sections

## Maintenance

This skill should be updated when:
- New rules are added to CLAUDE.md
- New critical patterns are identified
- Audit commands are optimized
- Report format needs improvement

**Version:** 1.0
**Last Updated:** 2026-02-14
**Maintained By:** Development Team
