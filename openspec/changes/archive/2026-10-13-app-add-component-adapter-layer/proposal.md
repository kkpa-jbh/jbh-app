## Why

Pages use Ionic and other libraries directly. Today there are 35 templates with `<ion-*>` tags (206 `ion-icon` alone), 38 TS files that import `@ionic/angular`, and 17 pages that depend on Ionic lifecycle names (`ionViewWillEnter`). Every upgrade of Angular or Ionic touches all pages. A move away from Ionic, or to Vue, means rewriting every page. We want one thin layer that owns all contact with Ionic and external UI libraries, so a future migration changes that layer and not 35 templates.

## What Changes

- New folder `src/app/design-system/` with two parts:
  - `components/`: `jbh-*` UI components, each with its own SCSS. Form controls (`jbh-text-field`, `jbh-number-field`, `jbh-textarea`, `jbh-date-field`, `jbh-select`, `jbh-toggle`), actions (`button[jbhButton]`, `button[jbhIconButton]`), display (`jbh-icon`, `jbh-spinner`, `jbh-card`, `jbh-alert`, `jbh-empty-state`, `jbh-skeleton`, `jbh-page-header`, `jbh-table`, `jbh-segment`, `jbh-nav-item`, `jbh-line-chart`).
  - `platform/`: `jbh-page` (page shell with its own `pageEnter` / `pageLeave` events), `jbh-toolbar`, `DialogService`, `ToastService`, `NavigationService`, a viewport helper, and the Ionic adapter for a new `DevicePlatform` port.
- New framework-free formatting core in `src/app/core/formatting/` (plain TypeScript). The 7 pipes in `src/app/shared/pipes/` become thin adapters over it.
- All 35 templates and their TS files move onto the layer in this change. One reference page (`add-movement`) moves first, in its own wave, with a user check before the other pages.
- Shared components (`app-header`, `app-menu`, `category-select`, `product-select`, `install-app-button`, `ios-install-modal`, `portfolio-context-switcher`) stay in `src/app/shared/components/` and move onto the layer.
- Dead code is deleted: the unrouted `HomePage` (`src/app/ui/home/`) and the unused `portfolio-top-banner` component.
- A boundary guard, as an **error** from the first wave: ESLint rules forbid `<ion-*>` and `<ngx-charts-*>` tags, imports of `@ionic/*`, `ionicons` and `@swimlane/ngx-charts`, and `ionView*` methods outside `src/app/design-system/`. A small script checks page SCSS for Ionic selectors. Named exceptions: `src/main.ts`, `src/app/app.component.ts`, `src/app/app.component.html`.
- **BREAKING (internal API only):** `ViewportService` leaves `core/infrastructure`. `DecimalFormatDirective` and the static helpers of `JbhDatePipe` are removed after their last user moves. `IonicModule.forRoot()` is removed from `main.ts`. Global classes in `src/theme/custom-components.scss` that no template uses any more are removed.
- Small visible changes, accepted by the user: toasts are always at the bottom with a close button; date fields send `YYYY-MM-DD`; metadata date pickers use the calendar, not the wheel; two team pages lose the iOS large collapsing title; the menu context switcher uses the standard select.
- Unit tests (Karma) for the new layer and the formatting core only. No page tests.

## Capabilities

### New Capabilities

- `ui-adapter-boundary`: the guard. Which files may touch Ionic and other UI libraries, the lint rules and the SCSS check that enforce it, and the acceptance command.
- `design-system-components`: the `jbh-*` UI components, their small public APIs, form-control behavior (ControlValueAccessor, label, hint, error, generated ids, accessibility), and CSS ownership.
- `platform-adapters`: the page shell and its page-enter / page-leave events, the toolbar, dialogs, toasts, menu navigation, viewport and device-platform adapters.
- `formatting-core`: framework-free formatting functions and the pipes as thin adapters.
- `page-composition`: how pages and shared components are built on the layer, and which behavior must stay the same after the migration.

### Modified Capabilities

(none; `openspec/specs/` is empty)

## Impact

- Code: every template and page TS file under `src/app/ui/` and `src/app/shared/components/`; `src/app/shared/pipes/`; 4 services in `src/app/core/infrastructure/` (token refresh, push, PWA install, viewport); `src/app/core/infrastructure/header/header-actions.service.ts` (one optional field); `src/main.ts`; `src/theme/custom-components.scss`; `src/assets/i18n/en.json` and `es.json`.
- Tooling (leader-owned): `tsconfig.json` (path alias `@design-system/*`), `.eslintrc.json` plus a new `.eslintrc.boundary.json`, `package.json` (script `lint:boundary`), a new script in `scripts/`, and a `lint:boundary` step in `.github/workflows/image.yml` (added at the end, when the count is 0).
- Docs (leader-owned): `.claude/CLAUDE.md` and `.claude/docs/*` (styles rule, select rule, lifecycle rule, test rule, list of `jbh-*` components, the guard).
- Dependencies: no new packages. Ionic, ionicons and ngx-charts stay, but only the layer imports them.
- Backend: no API change. Date fields now send `YYYY-MM-DD`, which is the format the backend `LocalDate` fields already expect.
- Database: none.
- Out of scope (follow-up): removing Angular and RxJS from `core/domain` use-cases (16 files); moving ESLint to the flat config; the 249 existing `prefer-inject` lint errors.
