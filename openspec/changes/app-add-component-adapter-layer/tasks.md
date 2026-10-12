Rules for every task:

- Group number = wave number. Tasks in one wave run in parallel only when they touch different files; dependencies are named.
- `[leader]` = outside `src/` (integration). `[user]` = the user runs it. No tag = `app` worker.
- New code: signal APIs, `inject()`, OnPush, standalone, separate HTML/TS/SCSS, Ionic only from `@ionic/angular/standalone` (design.md D17).
- Specs only under `src/app/design-system/**` and `src/app/core/formatting/**`, written against the design.md test contract (D20). No page or pipe specs.
- Component SCSS copies the look from `src/theme/custom-components.scss`. Do not delete global rules before wave 7 (D16).
- Only tasks 3.17 and 6.7 edit `src/assets/i18n/*.json`. Other tasks report missing keys to the leader (D18).
- Before reporting, run `npx eslint` on the touched files: no boundary errors and no new errors of other rules in new files.

## 1. Wave 1 — Tooling and guard [leader]

- [x] 1.1 [leader] Add the path alias `"@design-system/*": ["src/app/design-system/*"]` to `tsconfig.json` (D1).
- [x] 1.2 [leader] Create `.eslintrc.boundary.json` with the 4 overrides of D2, in that order (all rules `error`). Add `"extends": ["./.eslintrc.boundary.json"]` to `.eslintrc.json`. Change `@angular-eslint/component-selector` and `@angular-eslint/directive-selector` to accept the prefixes `app` and `jbh` (D2).
- [x] 1.3 [leader] Add `scripts/check-scss-boundary.mjs` and the `lint:boundary` script to `package.json` (D2).
- [x] 1.4 [leader] Run the 8 stdin checks of the "Guard" test contract; each result must match. Run `npm run lint:boundary` and record the baseline number of violations in the wave notes (expected: more than 0). Depends on 1.2, 1.3.

## 2. Wave 2 — Foundation (2.1→2.2 and 2.3→2.4, 2.5 run in parallel)

- [x] 2.1 Create `src/app/core/formatting/` with `currency.ts`, `growth.ts`, `date.ts`, `relative-time.ts`, `display-name.ts`, `translation-key.ts`, `decimal-input.ts` and `index.ts`, with the functions of D15. Plain TypeScript; no framework import. Depends on 1.2.
- [x] 2.2 Write one `*.spec.ts` per file of 2.1 with the exact values of the "Formatting core" test contract. Depends on 2.1.
- [x] 2.3 Create the layer skeleton: `src/app/design-system/components/index.ts`, `components/internal/next-id.ts` (+ spec: two calls give different ids), barrels `components/icon/index.ts`, `components/forms/index.ts`, `components/display/index.ts` (the last two start as `export {};`), and `src/app/design-system/platform/index.ts` (`export {};`). Depends on 1.1.
- [x] 2.4 Build `components/icon/`: `icon-registry.ts` with every icon name used today (template names, `getTypeIcon()`, `getMovementIcon()`, `getStatusIcon()`, `getGrowthIcon()`, menu items, header actions, `close`), `jbh-icon` and `jbh-spinner`, with specs per the contract; export them from `components/icon/index.ts` (D10). Depends on 2.3.
- [x] 2.5 Build the viewport helper in `src/app/design-system/platform/viewport/` (`wide` signal, ≥ 1024 px, 100 ms debounced resize, no Ionic) + spec; export it from `platform/index.ts` (D14). Depends on 2.3.

## 3. Wave 3 — Layer components and platform (tracks A, B and C run in parallel)

Track A — only `src/app/design-system/components/forms/**`:

- [x] 3.1 `jbh-field` (label, requirement marker, hint, error, ids) + spec (D6). Export from `forms/index.ts`.
- [x] 3.2 `jbh-text-field` (CVA, native input, password reveal, `[jbhFieldSuffix]` slot) + spec. Depends on 3.1.
- [x] 3.3 `jbh-number-field` (CVA, core decimal helpers, `APP_CONFIG_TOKEN` separators) + spec (D7). Depends on 3.1, 2.1.
- [x] 3.4 `jbh-textarea` (CVA, auto-grow, counter with `maxlength`) + spec. Depends on 3.1.
- [x] 3.5 `jbh-date-field` (CVA, unique picker id, `toDateValue`, translated picker buttons) + spec (D8). Depends on 3.1, 2.1.
- [x] 3.6 `jbh-select` and `jbh-select-option` (CVA, projected options, overlay type from the viewport helper, label as overlay header, loading) + spec (D9). Depends on 3.1, 2.5.
- [x] 3.7 `jbh-toggle` (CVA, `checked` model, `disabled` input, required label) + spec. Depends on 3.1.

Track B — only `src/app/design-system/components/display/**`:

- [x] 3.8 `button[jbhButton]` / `a[jbhButton]` / `label[jbhButton]` and `button[jbhIconButton]` + specs (D5). Export from `display/index.ts`.
- [x] 3.9 `jbh-card`, `jbh-alert`, `jbh-empty-state`, `jbh-skeleton`, `jbh-page-header` + specs.
- [x] 3.10 `jbh-table`, `jbh-table-row`, `jbh-table-cell` and the `jbhTableHead` / `jbhTableRow` / `jbhTableCard` template directives + spec (D11).
- [x] 3.11 `jbh-segment` and `jbh-nav-item` + specs (D21).
- [x] 3.12 `jbh-line-chart` (ngx-charts, animations off) + spec (D21).

Track C — `src/app/design-system/platform/**` (except `viewport/`), `src/app/core/infrastructure/platform/`, `src/app/core/infrastructure/header/`, the 3 core services, `src/main.ts`, `src/assets/i18n/*.json`:

- [x] 3.13 `jbh-page` (header slot, `pageEnter` / `pageLeave` from the parent element, `--jbh-page-*` properties) + spec (D12). Export from `platform/index.ts`.
- [x] 3.14 `jbh-toolbar` (title, back / menu button, `backHref`, actions) + spec (D12).
- [x] 3.15 `ToastService`, `DialogService`, `NavigationService` + specs (D13).
- [x] 3.16 `DevicePlatform` port in `core/infrastructure/platform/device-platform.ts`; `IonicDevicePlatform` + spec; binding in `src/main.ts`; rewire `token-refresh.service.ts`, `push-notification.service.ts` and `pwa-install.service.ts` to the port (D14).
- [x] 3.17 Add optional `defaultBackHref` to `PageHeaderConfig` in `header-actions.service.ts`. Add `common.showPassword` and `common.hidePassword` to `en.json` and `es.json`, sorted (D18).

## 4. Wave 4 — Pipes and shared selects (4.1 and 4.2 run in parallel)

- [x] 4.1 Make the 7 pipes in `src/app/shared/pipes/` thin adapters over `@core/formatting` (same names, purity and output). `JbhDatePipe` static methods delegate to the core until task 7.2 (D15). Depends on 2.1.
- [x] 4.2 Rebuild `app-category-select` and `app-product-select` on `jbh-select`, `jbh-select-option` and `jbh-icon`. Keep their inputs, the category description hint and `emptyOption`. Keep `selectInterface` as an unused input until task 7.1, so pages not yet moved still compile (D4, D9). Depends on 3.6.

## 5. Wave 5 — Reference page, alone

- [x] 5.1 Migrate `src/app/ui/products/pages/add-movement/` (HTML, TS, SCSS): `jbh-page` root with `<app-header jbhPageHeader>`; `(pageEnter)` / `(pageLeave)` replace the Ionic hooks; `jbh-card variant="form"` and `jbh-page-header variant="form"`; movement type on `jbh-select`; `jbh-date-field` (max today); two `jbh-number-field`; `jbh-textarea` with `maxlength` 500 (drop the hand-made counter); submit with `button[jbhButton]` `loading` and `icon`; `jbh-skeleton`; `ToastService`; product and category selects without `selectInterface`. Remove `IonicModule`, `ViewportService`, `addIcons`, `ToastController`, `DecimalFormatDirective`, `ViewWillEnter` / `ViewWillLeave`. Page SCSS: `--jbh-page-background`, `ion-icon` selectors → `jbh-icon`. Depends on waves 2–4.
- [x] 5.2 Run `npx eslint src/app/ui/products/pages/add-movement`: zero boundary errors. Depends on 5.1.
- [x] 5.3 [user] Gate before wave 6. Run `npx ng build` and `ionic serve`, then check on web (narrow and wide) and, if possible, on a device: (a) Record movement loads products on first open; (b) go to another page from the menu and back: data reloads and the header title is right; (c) `/transactions/record-movement/<productId>` shows the product card and loads categories; (d) the select opens an action sheet below 1024 px and a popover above; (e) pick a date and save: the request body has `entryDate` as `YYYY-MM-DD`; (f) type `1234.56` in the amount: `1,234.56` on blur, `1234.56` in the request; (g) required errors show under the fields; (h) save shows a success toast at the bottom with a close button; (i) layout and dark mode look as before. Wave 6 starts only after the user confirms.

## 6. Wave 6 — Feature migration (6.1–6.7 run in parallel; each task touches only its folders)

Each task: routed templates have `jbh-page` as the only root; no `<ion-*>` or `<ngx-charts-*>`; no `@ionic/*`, `ionicons` or ngx-charts import; no `ionView*` method; `(pageEnter)` / `(pageLeave)` replace the old hooks; toasts, confirms and menu close go through the platform services; page SCSS fixed (no Ionic selectors, `ion-icon` → `jbh-icon`); `npx eslint` on the folders shows zero boundary errors. Depends on 5.3.

- [x] 6.1 Auth: `src/app/ui/auth/pages/login`, `src/app/ui/auth/pages/signup` (password reveal from `jbh-text-field`, status icons and spinners in `[jbhFieldSuffix]`, `jbh-alert` for form errors; keep the Google button overlay).
- [x] 6.2 Dashboard, reports, settings and profile: `src/app/ui/dashboard/pages/dashboard` (`ion-card` → `jbh-card`), `src/app/ui/reports/pages/growth-analysis`, `src/app/ui/settings/pages/categories` (`jbh-segment`, `jbh-empty-state`, `jbh-skeleton`), `src/app/ui/settings/pages/team-preferences` (`jbh-toggle`, `button[jbhButton]`), `src/app/ui/profile/pages/profile` (two `jbh-select`, `jbh-number-field`).
- [x] 6.3 Product forms: `src/app/ui/products/pages/create`, `edit`, `transfer`, `import-statement` (metadata fields by value type: `jbh-text-field`, `jbh-number-field`, `jbh-toggle`, `jbh-date-field`; file picker with `label[jbhButton]`; result table with `jbh-table`).
- [x] 6.4 Product lists and reports: `src/app/ui/products/pages/overview` with `components/product-card` and `components/balance-summary-cards`; `pages/product-movements` (`jbh-table` with card template, `DialogService.confirm`); `pages/balance-history` with `components/balance-chart` (`jbh-line-chart`, core `formatCurrency` and `formatPeriod`), `components/balance-history-filter` (`jbh-date-field mode="month"`, core date functions) and `components/balance-history-table` (`jbh-table` with card template).
- [x] 6.5 Teams: `src/app/ui/teams/pages/create`, `edit` (standard header with `showBackButton: true` and `defaultBackHref: '/settings/teams/overview'`; add a `(pageLeave)` clear), `invite`, `overview` (`jbh-table` with card template, three confirms), `accept-invitation` (standard header set in `(pageEnter)`; keep its data loading where it is today).
- [x] 6.6 Shared chrome: `src/app/shared/components/app-header` (`jbh-toolbar`, pass `defaultBackHref`), `app-menu` (`jbh-nav-item`, `NavigationService.closeMenu`, `ToastService`), `install-app-button` (`jbh-nav-item`, `DialogService.open(…, { sheet: true })`, `ToastService`), `ios-install-modal` (plain scroll content, `DialogService.close`, layer buttons), `portfolio-context-switcher` (`jbh-select`).
- [x] 6.7 Delete dead code: `src/app/ui/home/` (page, template, SCSS, spec) and `src/app/shared/components/portfolio-top-banner/`; remove the `home.*` keys from `en.json` and `es.json`.
- [x] 6.8 [leader] After merging wave 6, run `npm run lint:boundary`: zero violations expected. Depends on 6.1–6.7.

## 7. Wave 7 — Cleanup (one worker, in this order)

- [x] 7.1 Remove the unused `selectInterface` input from `app-category-select` and `app-product-select`. Delete `src/app/core/infrastructure/viewport/` after checking no import is left.
- [x] 7.2 Remove the `JbhDatePipe` static helpers after checking no caller is left.
- [x] 7.3 Delete `DecimalFormatDirective` and its export in `src/app/shared/directives/index.ts` after checking no template uses `jbhDecimalFormat`; delete the folder if it is empty.
- [x] 7.4 Remove `importProvidersFrom(IonicModule.forRoot())` and the `IonicModule` import from `src/main.ts`; check that no file imports `IonicModule`.
- [x] 7.5 Clean `src/theme/custom-components.scss` with the D16 method: remove rules whose look moved into a component or whose classes have zero uses; keep tokens, dark overrides, utilities and Ionic overlay rules. List the removed sections in the task notes.
- [x] 7.6 Update `src/app/AGENTS.md`: the layer folders, public entry points, allowed imports, the guard, the `jbh-page` root rule, where specs live.
- [x] 7.7 Run `npx eslint src/app src/main.ts`: zero boundary errors and zero selector-prefix errors. Report the remaining count of old `prefer-inject` errors.

## 8. Wave 8 — Docs and final checks [leader / user]

- [x] 8.1 [leader] Update `.claude/CLAUDE.md`: styles rule per D16; `jbh-select` instead of `ion-select`; `jbh-page` `(pageEnter)` / `(pageLeave)` and the root-element rule instead of the Ionic lifecycle section; header config in `(pageEnter)` / `(pageLeave)`; `jbh-number-field` instead of `jbhDecimalFormat`; spec rule exception for `design-system` and `core/formatting`; the closed list of `jbh-*` components and platform services; the guard and `npm run lint:boundary`; `app-category-select` without `selectInterface`.
- [x] 8.2 [leader] Update `.claude/docs/theming.md`, `forms.md`, `architecture.md` (structure with `design-system/` and `core/formatting/`) and the affected sections of `ux-design-system.md` (component library, form patterns, CSS class reference).
- [x] 8.3 [leader] Final guard: `npm run lint:boundary` exits 0; the 8 stdin checks still match.
- [x] 8.4 [leader] Add the boundary check to CI: in `.github/workflows/image.yml`, job `image`, add a step `name: Check UI boundary`, `run: npm run lint:boundary`, after the `Install dependencies` step and before the `Build app` step (so it also runs before the Docker login and build-push steps). Depends on 8.3 (the count must be 0 first, or CI on `main` fails).
- [ ] 8.5 [user] Run `npx ng build --configuration production`; run `npx ng test --watch=false --browsers=ChromeHeadless --include='src/app/design-system/**/*.spec.ts' --include='src/app/core/formatting/**/*.spec.ts'`; smoke-test every route in light and dark mode, narrow and wide: login, signup, dashboard, portfolio overview / create / edit, transfer, record movement (with and without product), import statement, balance trends, growth analysis, product movements, preferences, categories, team preferences, teams overview / create / edit / invite / accept invitation, the side menu, the install row and the iOS install sheet.
