# app module

Agent-Name: app

## Doc-Pack (module)

None beyond the project base (`.claude/CLAUDE.md`, `.claude/docs/architecture.md`, `.claude/docs/theming.md`, `.claude/docs/forms.md`). Search `.claude/docs/ux-design-system.md` and `.claude/docs/i18n.md` when a task needs a detail; do not read them in full.

## Responsibility

The whole JBH frontend: Ionic 8 + Angular 20 standalone app, packaged with Capacitor for iOS, Android and the web. It shows the user's financial products, movements, balance reports, teams and settings, and talks to the JBH backend through the gateway (`/jbh-api`).

## Structure and public interface

- `app.routes.ts`: all routes (lazy `loadComponent`), guarded by `authGuard`, `guestGuard`, `teamReadOnlyGuard`. Routes are the public interface of the module.
- `app.component.*`: root shell (`ion-app`, side menu, router outlet).
- `core/domain/`: models, repository interfaces (abstract classes), use-cases. Feature models live in `core/domain/features/<feature>/` (`api/requests`, `api/responses`, `models`, `types`, barrel `index.ts`).
- `core/infrastructure/`: repository implementations, HTTP interceptors, auth token refresh, i18n, logging, config, header actions, push, PWA, and the `DevicePlatform` port (`platform/device-platform.ts`; the layer binds it in `src/main.ts`).
- `core/formatting/`: plain TypeScript formatting (currency, growth, dates, relative time, display name, translation key, decimal input). No Angular, RxJS, Ionic or Capacitor import. Language, time and separators are parameters. The `jbh*` pipes are thin adapters over it.
- `design-system/`: the UI adapter layer. It is the only place that touches Ionic, `ionicons` and ngx-charts.
  - `components/` (`@design-system/components`): `jbh-icon`, `jbh-spinner`; form controls (`jbh-field`, `jbh-text-field`, `jbh-number-field`, `jbh-textarea`, `jbh-date-field`, `jbh-select` + `jbh-select-option`, `jbh-toggle`); display (`button[jbhButton]`, `button[jbhIconButton]`, `jbh-card`, `jbh-alert`, `jbh-empty-state`, `jbh-skeleton`, `jbh-page-header`, `jbh-table` + its template directives, `jbh-segment`, `jbh-nav-item`, `jbh-line-chart`).
  - `platform/` (`@design-system/platform`): `jbh-page`, `jbh-toolbar`, `ToastService`, `DialogService`, `NavigationService`, `JbhViewportService`, `IonicDevicePlatform`.
  - Everything else in the folder is internal.
- `shared/`: app compositions on top of the layer (`app-header`, `app-menu`, `install-app-button`, `ios-install-modal`, `portfolio-context-switcher`, `app-category-select`, `app-product-select`) and the `jbh*` pipes.
- `ui/<feature>/`: pages and feature components.

## Imports

- `ui` may import `core`, `shared`, `@design-system/components`, `@design-system/platform`, and Angular / ngx-translate. It must not import `@ionic/*`, `ionicons` or `@swimlane/ngx-charts`.
- `shared` may import `core` and the two layer entry points. It must not import `ui`, and has the same Ionic ban as `ui`.
- `design-system` may import Angular, `@ionic/angular/standalone` (never `@ionic/angular`), `ionicons`, ngx-charts, ngx-translate, `@core/formatting` and `@core/infrastructure` services (i18n, logging, config, platform port). It must not import `@ui/*` or `@shared/*`.
- Code outside the layer imports only `@design-system/components` and `@design-system/platform`, never a deeper path.
- `core/formatting` imports no framework (Angular, RxJS, ngx-translate, Capacitor, Ionic, ngx-charts).
- `core/domain` must not import `core/infrastructure` implementations, `shared` or `ui`. Repository implementations are bound in `src/main.ts`.
- Path aliases: `@core/*`, `@shared/*`, `@ui/*`, `@design-system/*`, `@environments/*`.
- Named exceptions to the Ionic ban: `src/main.ts`, `src/app/app.component.*` (root shell with `ion-app`, `ion-menu`, `ion-router-outlet`), `src/global.scss`, `src/theme/**` and `src/app/app.component.scss`.

## Guard

- `npm run lint:boundary` must exit 0. It runs `.eslintrc.boundary.json` over `src/**/*.{ts,html}` (no `ion-*` or `ngx-charts-*` tags, no Ionic, ionicons or ngx-charts imports, no deep layer imports, no `ionView*` methods, layer and formatting import rules) and `scripts/check-scss-boundary.mjs` (no `ion-*` selectors, `::part(` or `--ion-` variables in SCSS outside the layer).
- `ng lint` includes the same boundary rules. Selector prefixes allowed: `app` and `jbh`.

## Pages

- `jbh-page` must be the root element of every routed template. Its parent element is the routed page, which is where Ionic fires the page events. Anywhere else the events never arrive.
- Use `(pageEnter)` for data loading and header setup, and `(pageLeave)` for `headerActions.clearPageConfig()`. Do not write `ionViewWillEnter` / `ionViewWillLeave`.
- Put `<app-header jbhPageHeader>` inside `jbh-page` for the header slot.
- Toasts, confirms, modals and menu close go through `ToastService`, `DialogService` and `NavigationService`.
- Page SCSS may style `jbh-*` hosts (`jbh-icon { font-size: 24px }`). It never targets Ionic elements or internals.

## Data

No local database. Data comes from the backend through repositories in `core/infrastructure/repositories/`. Tokens: `TokenStorageService` (Capacitor Preferences; refresh token in an HTTP-only cookie on the web). Use-cases may cache lists in memory (for example the products cache).

## DTO conventions

- `*Response` / `*ApiResponse` interfaces match backend names exactly and are used only in repositories.
- `*Request` interfaces for what is sent.
- Domain models are classes mapped from responses; view models are UI-only.
- One export per file; feature barrels for imports.

## Testing notes

- Test runner: Karma + Jasmine (`ng test`). The user runs tests and builds; agents may run only ESLint (`npx eslint <paths>` or `npx ng lint`).
- Project rule: do not generate `spec.ts` files. Exception: specs live next to their file under `src/app/design-system/**` and `src/app/core/formatting/**`. No page or pipe specs.
- Layer specs use `provideIonicAngular()` for components that render Ionic elements, `TranslateModule.forRoot()` without a loader, and Jasmine spies for Ionic controllers. No real overlays.
- Existing page specs only check "should create" and give no providers. Run layer and formatting specs with `--include='src/app/design-system/**/*.spec.ts' --include='src/app/core/formatting/**/*.spec.ts'` so they do not mix with these.
- `ng lint` uses the legacy `.eslintrc.json` through `@angular-eslint/builder` and already reports old `prefer-inject` errors.
