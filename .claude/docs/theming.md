# Theming: Design System and Styles

> **See Also:** [UX & Design System Guide](ux-design-system.md) for page patterns and component examples.

## Who owns which style

| Where | What |
|---|---|
| `src/app/design-system/**/*.scss` | The look of each `jbh-*` component (buttons, fields, cards, alerts, tables, skeletons, empty state, page header, …). Each component owns its SCSS. |
| `src/theme/custom-components.scss` | Global only: tokens and dark overrides, typography, layout utilities, links, animations, badges, feature classes that templates still use, Ionic overlay rules (`ion-menu`, `::part`). |
| Page / feature component SCSS | Page layout only. It may style `jbh-*` hosts (`jbh-icon { font-size: 24px }`). Never Ionic elements, `::part(` or `--ion-` variables. |

### ❌ NEVER
- Create feature-specific theme files (NO `auth-theme.scss`, `dashboard-theme.scss`)
- Copy a component's look into a page or into `custom-components.scss`
- Style Ionic elements or internals outside `src/app/design-system/`
- Hardcode colors, spacing, or typography values

### ✅ ALWAYS
- Use `jbh-*` components for controls, cards, alerts, tables and states
- Use global utility classes for layout and text
- Reference CSS variables with `--jbh-*` prefix

### Cleaning `custom-components.scss`
Remove a rule when its class has zero uses. Search the class as a whole word in `src/app/**/*.{html,ts,scss}`, TS strings included.
For classes built by string joins (`'movement-' + type`), search the prefix and the returned values.

## Component Reference (styles live in the component)

### Buttons
| Use | Description |
|-------|-------------|
| `button[jbhButton]` / `[jbhButton]="'primary'"` | Primary action (gradient). `''` means `primary` |
| `jbhButton="secondary"` | Secondary action (tonal: soft indigo tint) |
| `jbhButton="outline"` | Outlined button |
| `jbhButton="text"` | Text-only button |
| `jbhButton="danger"` | Destructive action |
| `jbhButton="success"` | Success action |
| `block` | Full-width |
| `[loading]="true"` | Spinner, `aria-busy` |
| `icon="save-outline"` | Leading icon |
| `button[jbhIconButton]` | Icon-only button: `icon`, `label` (required), tone `default` \| `primary` \| `danger`, `size` `md` \| `sm` |

Also on `a[jbhButton]` (links) and `label[jbhButton]` (file picker).

### Form controls
See [forms.md](forms.md): `jbh-text-field`, `jbh-number-field`, `jbh-textarea`, `jbh-date-field`, `jbh-select`, `jbh-toggle`, `jbh-field`.
`jbh-label` stays global for the plain label above `app-category-select` / `app-product-select`.

### Cards, alerts and states
| Use | Description |
|-------|-------------|
| `<jbh-card>` | Standard card. `variant`: `default` \| `elevated` \| `flat` \| `form` |
| `<jbh-alert tone="error">` | Message box. `tone`: `error` \| `warning` \| `info` \| `success` |
| `<jbh-empty-state>` | `icon`, `title`, `message`, projected actions |
| `<jbh-skeleton>` | `shape`: `line` \| `label` \| `input` \| `select` \| `header` \| `table` \| `block`; `width`, `height` |
| `<jbh-page-header>` | `icon`, `title`, `subtitle`, `variant` `page` \| `form` |

### Global utility classes (`custom-components.scss`)
| Class | Description |
|-------|-------------|
| `jbh-container` | Centered content |
| `jbh-divider` | Divider line |
| `jbh-hide-mobile` | Hidden below the desktop breakpoint |
| `jbh-title` | Page title |
| `jbh-subtitle` | Page subtitle |
| `jbh-text-muted` | Muted text |
| `jbh-link` | Standard link |
| `jbh-label` | Plain form label |
| `jbh-status-badge`, `jbh-role-badge` | Badges |
| `jbh-animate-fade-in` | Fade-in animation |
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

// Soft tints: use the RGB channels, never a raw rgba() value.
background: rgba(var(--jbh-primary-rgb), 0.1);   // also --jbh-secondary-rgb, --jbh-error-rgb
--jbh-error-strong: #e53e3e;    // solid danger fill
--jbh-success-strong: #38a169;  // solid success fill

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

### ✅ Correct - Layer components and global utilities
```html
<jbh-page (pageEnter)="onPageEnter()">
  <app-header jbhPageHeader></app-header>
  <div class="jbh-container">
    <jbh-card variant="elevated">
      <h1 class="jbh-title">{{ 'page.title' | translate }}</h1>

      <jbh-text-field
        formControlName="name"
        icon="person-outline"
        [label]="'field.label' | translate"
      />

      <button type="submit" jbhButton block>
        {{ 'common.save' | translate }}
      </button>
    </jbh-card>
  </div>
</jbh-page>
```

```scss
// page.page.scss - ONLY page-specific layout
.custom-header {
  display: flex;
  gap: var(--jbh-spacing-md);  // Use variables!
}

// Allowed: size a layer host
jbh-icon {
  font-size: 24px;
}
// No button/input/card styles here
```

### ❌ Wrong
```scss
// DON'T DO THIS
.my-button {
  background: #667eea;  // Hardcoded color, copies the button look
  padding: 14px 24px;
}

ion-select::part(text) { ... }  // Ionic internals outside the layer
```

## Modifying Theme Globally
Change a token in `src/theme/custom-components.scss`. Components read the tokens:
```scss
:root {
  --jbh-primary-color: #4299e1;  // All buttons update!
}
```
To change how one control looks, edit its SCSS in `src/app/design-system/components/`.

---

## Common Mistakes

### ❌ Mistake 1: Copying a component's look into a page
**Problem:**
```scss
// my-page.page.scss
.save-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

**Solution:** use `button[jbhButton]` with a variant. If no variant fits, add one to the layer.

---

### ❌ Mistake 2: Hardcoding Colors and Spacing
**Problem:**
```scss
.custom-element {
  color: #667eea;        // Hardcoded color
  padding: 24px;         // Hardcoded spacing
  border-radius: 12px;   // Hardcoded radius
}
```

**Solution:**
```scss
.custom-element {
  color: var(--jbh-primary-color);
  padding: var(--jbh-spacing-md);
  border-radius: var(--jbh-radius-md);
}
```

---

### ❌ Mistake 3: Creating Feature-Specific Theme Files
Do not create `src/app/ui/<feature>/styles/<feature>-theme.scss`.
Global things go in `custom-components.scss`, component looks in the layer, page layout in the page SCSS.

---

### ❌ Mistake 4: Styling Ionic elements outside the layer
**Problem:**
```scss
// my-page.page.scss
ion-icon { font-size: 20px; }        // stops matching: the icon is inside jbh-icon
ion-content { --background: #fff; }  // Ionic variable outside the layer
```

**Solution:** style the `jbh-*` host (`jbh-icon { font-size: 20px; }`). `npm run lint:boundary` reports these rules.
## Accessibility Requirements

### Minimum Touch Target Size
**WCAG AA:** 48px × 48px minimum for interactive elements.
`button[jbhIconButton]` is 48px (`size="md"`, the default). `size="sm"` is 32px: use it only inside dense rows.

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
`jbh-table` sets `role="table"`, the row groups, `role="row"` (`jbh-table-row`) and `role="cell"` / `role="columnheader"` (`jbh-table-cell`, `header` input). Pass `[label]` for the table's `aria-label`.

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

:host(.jbh-button--primary) {  // jbh-button.component.scss
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
div.container .jbh-card .product-row .product-name {
  font-weight: 600;
}

// ✅ GOOD: Simple, reusable
.product-name {
  font-weight: 600;
}

// ✅ GOOD: Use modifier classes for variants
.product-name--muted {
  color: var(--jbh-text-secondary);
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

## Checklist: Adding a New Style

- [ ] Is it the look of one layer component? Put it in that component's SCSS under `src/app/design-system/`.
- [ ] Is it a new control, wrapper or repeated markup? Add a layer component, not a global class. Tell the team first.
- [ ] Is it a token, utility, typography rule or feature class used by several features? Add it to `src/theme/custom-components.scss`.
- [ ] Is it page layout only? Put it in the page SCSS.
- [ ] Use `jbh-*` naming and `--jbh-*` variables.
- [ ] No `ion-*` selectors, `::part(` or `--ion-` variables outside the layer (`npm run lint:boundary`).
- [ ] Test in light and dark modes, on mobile and desktop.
