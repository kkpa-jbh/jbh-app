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

- Do not use any function from console. Use the servie `private logger: LoggerService` instead.

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

#### Ionic Lifecycle (CRITICAL)
15. **NEVER call APIs in `ngOnInit()`** - Ionic reuses component instances when navigating
16. **Use `ionViewWillEnter()`** for API calls and data loading - this runs every time the page is displayed
17. **Implement `ViewWillEnter`** interface: `implements OnInit, OnDestroy, ViewWillEnter`
18. **Pattern**:
    - `ngOnInit()`: Form initialization, static setup, event subscriptions
    - `ionViewWillEnter()`: API calls, data refresh, dynamic state reset

#### File Naming Convention
19. **Kebab-case with context**: Include feature context in generic page names
    - `create-product.page.ts` (NOT `create.page.ts`)
    - `edit-user.page.ts` (NOT `edit.page.ts`)
    - `list-orders.page.ts` (NOT `list.page.ts`)
20. **Pattern**: `[action]-[entity].page.ts` for clarity across features

#### Responsive
21. **Mobile-first CSS**
22. **Ionic Grid** for layouts
23. **Test** on 3+ viewport sizes

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
