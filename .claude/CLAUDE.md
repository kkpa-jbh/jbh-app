# JBH App - Ionic/Angular Mobile Development Guide

Expert guidance for Ionic/Angular hybrid mobile apps using Clean Architecture, DDD, responsive design, and consistent theming.

## Detailed Documentation
- [Architecture](docs/architecture.md) - Hexagonal/DDD/Clean Architecture, project structure
- [Theming](docs/theming.md) - CSS classes, variables, design system
- [Forms](docs/forms.md) - Reactive forms, validation, mobile patterns
- [i18n](docs/i18n.md) - Internationalization, translations
- [Responsive](docs/responsive.md) - Breakpoints, grid system, viewport detection

## Quick Reference

### Project Structure
```
src/app/
├── core/domain/          # Models, repositories, use-cases
├── core/infrastructure/  # API, persistence, implementations
├── features/             # Lazy-loaded feature modules
├── shared/               # Reusable components, pipes, utilities
└── theme/                # custom-components.scss (single source)
```

### Critical Rules

#### Theme System
1. **ALL styles** in `src/theme/custom-components.scss` - NO feature-specific theme files
2. **Use `jbh-*` classes**: `jbh-button-primary`, `jbh-input`, `jbh-card`, etc.
3. **Use `--jbh-*` variables** for colors, spacing, typography
4. Component SCSS = page layout only

#### i18n
5. **NEVER hardcode text** - use `{{ 'key' | translate }}`
6. **Both languages**: en.json AND es.json
7. **Sort keys alphabetically**
8. **Use `common`** namespace for shared text

#### Forms
9. **Use `ion-select`** (not native `<select>`) with `interface="action-sheet"`
10. **Angular control flow**: `@if`, `@for` (not `*ngIf`, `*ngFor`)
11. **Reactive Forms** with `hasError()`, `getErrorMessage()` methods

#### Components
12. **Separate files**: HTML, TS, SCSS (never inline)
13. **Standalone components** with proper imports
14. **Always include** `TranslateModule` in imports

#### Responsive
15. **Mobile-first CSS**
16. **Ionic Grid** for layouts
17. **Test** on 3+ viewport sizes

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
