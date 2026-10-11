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
- `core/infrastructure/`: repository implementations, HTTP interceptors, auth token refresh, i18n, logging, config, header actions, viewport, push, PWA.
- `shared/`: reusable components (`app-header`, `app-menu`, `app-category-select`, `app-product-select`, …), pipes (`jbh*`), directives.
- `ui/<feature>/`: pages and feature components.
- Planned: `design-system/` (UI adapter layer for Ionic and other UI libraries) and `core/formatting/` (framework-free formatting). This file is updated when they land.

## Imports

- `ui` may import `core`, `shared` and Angular / Ionic / ngx-translate.
- `shared` may import `core`. It must not import `ui`.
- `core/domain` must not import `core/infrastructure` implementations, `shared` or `ui`. Repository implementations are bound in `src/main.ts`.
- Path aliases: `@core/*`, `@shared/*`, `@ui/*`, `@environments/*`.

## Data

No local database. Data comes from the backend through repositories in `core/infrastructure/repositories/`. Tokens: `TokenStorageService` (Capacitor Preferences; refresh token in an HTTP-only cookie on the web). Use-cases may cache lists in memory (for example the products cache).

## DTO conventions

- `*Response` / `*ApiResponse` interfaces match backend names exactly and are used only in repositories.
- `*Request` interfaces for what is sent.
- Domain models are classes mapped from responses; view models are UI-only.
- One export per file; feature barrels for imports.

## Testing notes

- Test runner: Karma + Jasmine (`ng test`). The user runs tests and builds; agents may run only ESLint (`npx eslint <paths>` or `npx ng lint`).
- Project rule: do not generate `spec.ts` files, except where a change explicitly allows it.
- Existing page specs only check "should create" and give no providers. Run new specs with `--include` so they do not mix with these.
- `ng lint` uses the legacy `.eslintrc.json` through `@angular-eslint/builder` and already reports old `prefer-inject` errors.
