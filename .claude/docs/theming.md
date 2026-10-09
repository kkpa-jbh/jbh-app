# Theming: Centralized Design System

> **See Also:** [UX & Design System Guide](ux-design-system.md) for comprehensive patterns, page templates, and component usage examples.

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

## Critical Rule: Single Source of Truth
**ALL reusable styles MUST be defined in `src/theme/custom-components.scss`**

### ❌ NEVER
- Create feature-specific theme files (NO `auth-theme.scss`, `dashboard-theme.scss`)
- Define component-specific styles in the component SCSS files itself.
- Defined component-specific styles will not be placed on the custom-components.scss file.
- Hardcode colors, spacing, or typography values

### ✅ ALWAYS
- Use reusable theme classes from `custom-components.scss`
- Component SCSS files should ONLY contain page-specific layout
- Reference CSS variables with `--jbh-*` prefix

## CSS Classes Reference

### Buttons
| Class | Description |
|-------|-------------|
| `jbh-button-primary` | Primary action (gradient) |
| `jbh-button-secondary` | Secondary action (tonal: soft indigo tint) |
| `jbh-button-outline` | Outlined button |
| `jbh-button-text` | Text-only button |
| `jbh-button-danger` | Destructive action |
| `jbh-button-success` | Success action |
| `jbh-button-block` | Full-width |
| `jbh-button-loading` | Loading state |

### Form Elements
| Class | Description |
|-------|-------------|
| `jbh-form-field` | Field container |
| `jbh-label` | Form label |
| `jbh-input` | Text input |
| `jbh-input-wrapper` | Input with icons |
| `jbh-input-icon` | Icon inside input (use with `.left`/`.right`) |
| `jbh-input-icon-left` | Input with left icon padding |
| `jbh-field-error` | Error message |

### Select (Mobile)
| Class | Description |
|-------|-------------|
| `jbh-ion-select-wrapper` | Wrapper with icon support |
| `jbh-ion-select-icon` | Icon for select |
| `jbh-ion-select` | Styled ion-select |

### Cards & Containers
| Class | Description |
|-------|-------------|
| `jbh-card` | Standard card |
| `jbh-card-elevated` | Card with shadow |
| `jbh-container` | Centered content |
| `jbh-form-card` | Form card with animation |

### Typography
| Class | Description |
|-------|-------------|
| `jbh-title` | Page title |
| `jbh-subtitle` | Page subtitle |
| `jbh-text-muted` | Muted text |
| `jbh-link` | Standard link |

### Alerts
| Class | Description |
|-------|-------------|
| `jbh-alert-error` | Error message |
| `jbh-alert-success` | Success message |
| `jbh-alert-warning` | Warning message |
| `jbh-alert-info` | Info message |

## CSS Variables

```scss
// Colors
--jbh-primary-color: #667eea;
--jbh-secondary-color: #764ba2;
--jbh-error-color: #f56565;
--jbh-success-color: #48bb78;

// Text on a colored fill (gradient, brand, error, success). White in both modes.
--jbh-text-on-color: #ffffff;
// NEVER use --jbh-background-white as a text color: dark mode turns it into #1a202c.

// Tonal fill (secondary button). Dark mode has its own values.
--jbh-tonal-background: rgba(102, 126, 234, 0.12);
--jbh-tonal-text: #4c51bf;

// Spacing
--jbh-spacing-xs: 0.5rem;   // 8px
--jbh-spacing-sm: 1rem;      // 16px
--jbh-spacing-md: 1.5rem;    // 24px
--jbh-spacing-lg: 2rem;      // 32px
--jbh-spacing-xl: 3rem;      // 48px

// Typography
--jbh-font-size-sm: 0.875rem;
--jbh-font-size-base: 1rem;
--jbh-font-size-lg: 1.125rem;

// Border Radius
--jbh-radius-sm: 8px;
--jbh-radius-md: 12px;
--jbh-radius-lg: 16px;

// Shadows
--jbh-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--jbh-shadow-xl: 0 10px 40px rgba(0, 0, 0, 0.15);
```

## Usage Example

### ✅ Correct - Using Theme Classes
```html
<div class="jbh-container">
  <div class="jbh-card-elevated">
    <h1 class="jbh-title">{{ 'page.title' | translate }}</h1>

    <div class="jbh-form-field">
      <label class="jbh-label">{{ 'field.label' | translate }}</label>
      <div class="jbh-input-wrapper">
        <ion-icon name="person-outline" class="jbh-input-icon left"></ion-icon>
        <input class="jbh-input jbh-input-icon-left" formControlName="name" />
      </div>
    </div>

    <button class="jbh-button-primary jbh-button-block">
      {{ 'common.save' | translate }}
    </button>
  </div>
</div>
```

```scss
// page.page.scss - ONLY page-specific layout
.custom-header {
  display: flex;
  gap: var(--jbh-spacing-md);  // Use variables!
}
// That's it! No button/input/card styles here
```

### ❌ Wrong - Component-Specific Styles
```scss
// DON'T DO THIS
.my-button {
  background: #667eea;  // Hardcoded color
  padding: 14px 24px;   // Custom styling
}
```

## Modifying Theme Globally
To change styles app-wide, edit `src/theme/custom-components.scss`:
```scss
:root {
  --jbh-primary-color: #4299e1;  // All buttons update!
}
```

---

## Common Mistakes

### ❌ Mistake 1: Duplicating Theme Styles in Component Files
**Problem:**
```scss
// my-component.component.scss
.jbh-button-primary {  // Redefining global class
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  // ... duplicated code
}
```

**Why Bad:**
- Violates single source of truth
- Creates maintenance burden
- Can cause style conflicts
- Increases bundle size

**Solution:**
```scss
// my-component.component.scss
// Component-specific layout ONLY
.custom-layout {
  display: flex;
  gap: var(--jbh-spacing-md);  // Use theme variables
}
```

---

### ❌ Mistake 2: Hardcoding Colors and Spacing
**Problem:**
```scss
// my-component.component.scss
.custom-element {
  color: #667eea;        // Hardcoded color
  padding: 24px;         // Hardcoded spacing
  border-radius: 12px;   // Hardcoded radius
}
```

**Why Bad:**
- Can't be changed globally
- Breaks design consistency
- Won't update if theme changes

**Solution:**
```scss
// my-component.component.scss
.custom-element {
  color: var(--jbh-primary-color);
  padding: var(--jbh-spacing-md);
  border-radius: var(--jbh-radius-md);
}
```

---

### ❌ Mistake 3: Creating Feature-Specific Theme Files
**Problem:**
```
src/app/ui/products/
  └── styles/
      └── product-theme.scss  // DON'T DO THIS
```

**Why Bad:**
- Violates single source of truth
- Styles not reusable across features
- Hard to find and maintain

**Solution:**
- ALL reusable styles go in `src/theme/custom-components.scss`
- Component SCSS only for page-specific layout

---

### ❌ Mistake 4: Not Using Existing Classes
**Problem:**
```html
<!-- Reinventing the wheel -->
<button class="my-custom-button">
  Save
</button>
```

```scss
.my-custom-button {
  // Duplicate of jbh-button-primary
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  // ...
}
```

**Solution:**
```html
<!-- Use existing class -->
<button class="jbh-button-primary">
  Save
</button>
```

---

## Accessibility Requirements

### Minimum Touch Target Size
**WCAG AA:** 48px × 48px minimum for interactive elements

**Current Issue:**
```scss
// src/theme/custom-components.scss
.jbh-icon-button {
  width: 36px;   // TOO SMALL - needs to be 48px
  height: 36px;  // TOO SMALL - needs to be 48px
}
```

**Planned Fix:**
```scss
.jbh-icon-button {
  width: 48px;
  height: 48px;

  ion-icon {
    font-size: 24px;  // Increase from 20px
  }
}
```

---

### Color Contrast
**WCAG AA:** Minimum 4.5:1 for normal text, 3:1 for large text

**Review Required:**
```scss
:root {
  --jbh-text-tertiary: #a0aec0;  // May not meet 4.5:1 on white
}
```

**Testing:**
- Use WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Chrome DevTools Lighthouse accessibility audit

---

### Semantic Roles
**Add to theme classes:**
```scss
// Document in comments
.jbh-table-header {
  // Use with role="rowgroup"
}

.jbh-table-row {
  // Use with role="row"
}

.jbh-table-cell {
  // Use with role="cell" or role="columnheader"
}
```

---

## Performance Implications

### CSS-Only Animations (Preferred)
```scss
// ✅ GOOD: Pure CSS, GPU-accelerated
.jbh-skeleton {
  animation: jbh-skeleton-loading 1.5s infinite;
}

@keyframes jbh-skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

### Avoid Expensive Properties in Animations
```scss
// ❌ BAD: Triggers repaints every frame
@keyframes expensive-animation {
  from { backdrop-filter: blur(0); }
  to { backdrop-filter: blur(10px); }
}

// ✅ GOOD: GPU-accelerated properties only
@keyframes smooth-animation {
  from {
    opacity: 0;
    transform: translateY(20px);
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
- `top`, `left`, `margin`, `padding`

---

### Use CSS Variables for Dynamic Values
```scss
// ✅ GOOD: Change once, updates everywhere
:root {
  --jbh-primary-color: #667eea;
}

.jbh-button-primary {
  background: var(--jbh-gradient-primary);  // Uses variable
}

.jbh-link {
  color: var(--jbh-primary-color);  // Uses same variable
}
```

---

### Minimize CSS Selector Specificity
```scss
// ❌ BAD: Overly specific, hard to override
div.container ion-content .jbh-card .jbh-button-primary {
  background: red;
}

// ✅ GOOD: Simple, reusable
.jbh-button-primary {
  background: var(--jbh-gradient-primary);
}

// ✅ GOOD: Use modifier classes for variants
.jbh-button-primary.custom-variant {
  background: red;
}
```

---

## Dark Mode Support (Implemented)

```scss
@media (prefers-color-scheme: dark) {
  :root {
    --jbh-text-primary: #e2e8f0;
    --jbh-text-secondary: #a0aec0;
    --jbh-text-tertiary: #718096;
    --jbh-border-color: #4a5568;
    --jbh-background-light: #2d3748;
    --jbh-background-white: #1a202c;
    --jbh-error-background: #742a2a;
    --jbh-success-background: #22543d;
    --jbh-warning-background: #7c2d12;
    --jbh-info-background: #1e3a8a;
  }
}
```

**Usage:**
- Colors automatically adjust based on system preference
- No need to manually handle dark mode in components
- All `--jbh-*` variables are theme-aware

---

## Checklist: Adding a New Reusable Style

- [ ] Is this style reusable across multiple features? (If not, use component SCSS)
- [ ] Does a similar class already exist? (Check complete list first)
- [ ] Add to `src/theme/custom-components.scss`
- [ ] Use `jbh-*` naming convention
- [ ] Use CSS variables for colors, spacing, typography
- [ ] Add to appropriate section (buttons, forms, cards, etc.)
- [ ] Document in this file (add to class reference table)
- [ ] Add to UX Design System guide if it's a pattern
- [ ] Test in light and dark modes
- [ ] Test on mobile and desktop
