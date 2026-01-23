# Theming: Centralized Design System

## Critical Rule: Single Source of Truth
**ALL reusable styles MUST be defined in `src/theme/custom-components.scss`**

### ❌ NEVER
- Create feature-specific theme files (NO `auth-theme.scss`, `dashboard-theme.scss`)
- Define component-specific styles in component SCSS files
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
| `jbh-button-secondary` | Secondary action (white/border) |
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
