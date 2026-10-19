## Context

jbh-app is Angular 20.3 + Ionic 8.7 + Capacitor 8, with standalone components. Facts checked in the code on 2026-10-11:

- 35 HTML templates: 1 root (`app.component.html`), 8 in `shared/components`, 26 in `ui`. They use 29 different `ion-*` tags: `ion-icon` 206 times, `ion-spinner` 23, `ion-content` 23, `ion-select` 8, `ion-datetime` 6, and others.
- The trio `ion-datetime-button` + `ion-modal` + `ion-datetime` is copied 6 times in 5 files, with hard-coded ids.
- 40 TS files import `@ionic/*`: 26 in `ui`, 8 in `shared`, 4 in `core/infrastructure` (all for `Platform`), plus `main.ts` and `app.component.ts`. Pages mix `IonicModule` and `@ionic/angular/standalone`. `main.ts` keeps `IonicModule.forRoot()` with a comment that says it is temporary.
- 17 pages implement `ionViewWillEnter`; 16 also `ionViewWillLeave`. 17 files use Ionic overlay controllers (16 local copies of `showToast`, 4 delete confirms, 1 modal, 1 menu close).
- `ng lint` works today. `@angular-eslint/builder` 20.7 runs ESLint 9.39.1 in legacy mode with `.eslintrc.json`. It reports 252 errors: 249 `prefer-inject`, 2 `no-empty-lifecycle-method`, 1 `directive-selector` (`jbhDecimalFormat`, because the prefix rule allows only `app`). CI (`.github/workflows/image.yml`) runs only `ng build`.
- `src/theme/custom-components.scss` has 2,915 lines and 232 top-level `.jbh-*` classes. Templates use 246 distinct `jbh-*` names.
- Dead code: `HomePage` is not routed (`/home` redirects to `/dashboard`), and `portfolio-top-banner` is used by no template.
- Existing specs (`app.component`, `home`, `create-product`, `transfer`, `profile`) only check "should create" and give no providers.

Ionic behavior checked in `node_modules` (Ionic 8.7.11):

- `@ionic/core` fires page events with `el.dispatchEvent(new CustomEvent(name, { bubbles: false }))` on the routed page element. `@ionic/angular` `bindLifecycleEvents` listens on the same element and calls only methods that exist on the routed instance. The Ionic docs say: lifecycle methods run only on components mapped by the router, not on their children.
- `IonRouterOutlet.activateWith` calls `createComponent`, then `StackController.setActive`, which starts an async transition (`writeTask`, then `waitForReady`) and only then fires `ionViewWillEnter`. Angular `ComponentFactory.create` runs the creation pass of the template, so the constructors of child components run inside `createComponent`.
- `ion-select` finds options with `querySelectorAll('ion-select-option')` (all descendants) and watches its subtree with a `MutationObserver`. It takes option labels from `textContent`.
- `ion-datetime` builds its value with `convertDataToISO`. It adds `THH:mm:00` when the parts have an hour, so a picked date becomes `2025-10-12T09:30:00`.

Backend checked in `jbh-personal-finance`: `AddMovementRequest.entryDate` and `AddTransferRequest.transferDate` are `LocalDate`. Product metadata values of type `DATE` are stored as given, with no parsing.

## Goals / Non-Goals

**Goals:**

- One layer in `src/app/design-system/` owns all contact with Ionic, ionicons and ngx-charts.
- Pages express "page became visible" without Ionic names.
- Formatting logic is plain TypeScript that a Vue app could reuse.
- All 35 templates and their TS files move in this change. The guard is an error from the first wave and shows zero violations at the end.
- Each component has a small API and owns its CSS.
- Unit tests for the layer and the formatting core.

**Non-Goals:**

- Removing Angular or RxJS from `core/domain` use-cases (16 files). Follow-up.
- Moving ESLint to the flat config. Fixing the 249 old `prefer-inject` errors.
- Visual redesign. The 48 px touch target for icon buttons (it becomes a one-file change later).
- Replacing `HeaderActionsService` with `jbh-page` inputs. Follow-up idea.
- Tests for pages or pipes.

## Decisions

### D1 — Layer location, structure and dependency rules

```
src/app/design-system/
  components/
    index.ts                  export * from './icon', './forms', './display'
    internal/next-id.ts       unique id helper
    icon/        index.ts, icon-registry.ts, jbh-icon, jbh-spinner
    forms/       index.ts, field, text-field, number-field, textarea, date-field, select (+ option), toggle
    display/     index.ts, button, icon-button, card, alert, empty-state, skeleton,
                 page-header, table (+ parts and template directives), segment, nav-item, line-chart
  platform/
    index.ts
    page/ toolbar/ overlays/ (dialog, toast) navigation/ viewport/ device-platform/
```

- Path alias `@design-system/*` → `src/app/design-system/*` in `tsconfig.json` (leader task). Code outside the layer imports only `@design-system/components` and `@design-system/platform`.
- The layer may import: Angular, `@ionic/angular/standalone`, `ionicons`, `@swimlane/ngx-charts`, `@ngx-translate/core`, `@core/formatting`, and `@core/infrastructure` services for i18n, logging, config and the platform port. It must not import `@ui/*` or `@shared/*`. This keeps it app-agnostic and free of cycles.
- Alternatives: a folder inside `ui/` (rejected: mixed with features, harder guard paths); a separate Angular library project (rejected: more build setup, no gain now).

### D2 — Boundary guard with ESLint core rules plus a SCSS script

`ng lint` already runs the legacy config, so the guard uses it. All guard rules live in a new `.eslintrc.boundary.json`. `.eslintrc.json` gets `"extends": ["./.eslintrc.boundary.json"]`, so `ng lint` shows guard errors too. All rules are `error` from wave 1.

Overrides in `.eslintrc.boundary.json` (order matters):

1. `files: ["src/**/*.html"]`, `excludedFiles: ["src/app/design-system/**", "src/app/app.component.html"]`, parser `@angular-eslint/template-parser`. Rule `no-restricted-syntax` with selectors `Element[name=/^ion-/]` and `Element[name=/^ngx-charts-/]`. Message: "Use a jbh-* component from src/app/design-system/."
2. `files: ["src/**/*.ts"]`, `excludedFiles: ["src/app/design-system/**", "src/main.ts", "src/app/app.component.ts"]`, parser `@typescript-eslint/parser`. `no-restricted-imports` with pattern groups `["@ionic/*", "ionicons", "ionicons/*", "@swimlane/ngx-charts"]` and `["@design-system/*/*"]` (deep imports). `no-restricted-syntax` with `MethodDefinition[key.name=/^ionView/]`.
3. `files: ["src/app/design-system/**/*.ts"]`: `no-restricted-imports` with path `@ionic/angular` (message: use `@ionic/angular/standalone`) and patterns `["@ui/*", "@shared/*"]`.
4. `files: ["src/app/core/formatting/**/*.ts"]`: `no-restricted-imports` with patterns `@angular/*`, `rxjs`, `rxjs/*`, `@ngx-translate/*`, `@capacitor/*`, `@swimlane/*` **plus all groups of override 2**. ESLint replaces a rule's options when two overrides match the same file (formatting files also match override 2), so this list must be a superset.

Also in `.eslintrc.json`: `@angular-eslint/component-selector` becomes `[{ "type": "element", "prefix": ["app", "jbh"], "style": "kebab-case" }, { "type": "attribute", "prefix": ["app", "jbh"], "style": "camelCase" }]` (the installed rule accepts this array form), and `directive-selector` gets prefix `["app", "jbh"]`.

`scripts/check-scss-boundary.mjs` (Node, no dependencies): walk `src/app/**/*.scss` except `src/app/design-system/**` and `src/app/app.component.scss`; drop comments; report each line that matches `/(^|[^\w-])ion-[a-z]/`, `::part\(` or `var\(--ion-`; exit 1 when it finds any. It catches page rules like `ion-icon { … }` that silently stop matching once the icon is inside `jbh-icon`.

`package.json`: `"lint:boundary": "ESLINT_USE_FLAT_CONFIG=false eslint --no-eslintrc -c .eslintrc.boundary.json \"src/**/*.{ts,html}\" && node scripts/check-scss-boundary.mjs"`. This exit code ignores the old `prefer-inject` errors, so it is the acceptance check.

CI: task 8.4 adds a `npm run lint:boundary` step to the `image` job in `.github/workflows/image.yml`, after `Install dependencies` and before `Build app`, once the count is 0, so a violation stops the workflow before the image is built and pushed.

Checked in this repo (ESLint 9.39.1 legacy mode, template-parser 20.7): `Element[name=/^ion-/]` reports the 9 tags of `home.page.html`; the import patterns report `@ionic/angular`, `@ionic/angular/standalone`, `ionicons`, `ionicons/icons` and `@swimlane/ngx-charts`; the `MethodDefinition` selector reports `ionViewWillEnter`.

Alternatives: a custom ESLint plugin (rejected: core rules are enough); flat config now (rejected: out of scope, the project pins ESLint 9 where eslintrc still works); Stylelint (rejected: new dependency for one check).

### D3 — Named guard exceptions

`src/main.ts` (Ionic providers, route strategy, port binding), `src/app/app.component.ts` and `src/app/app.component.html` (`ion-app`, `ion-menu`, `ion-router-outlet`, the menu `ion-content`). SCSS exemptions: `src/global.scss` (Ionic CSS imports), `src/theme/**` (overlay CSS), `src/app/app.component.scss`. The root shell is one small file that changes only with the framework; moving it into the layer gains nothing.

### D4 — Shared components stay in `shared/` and move onto the layer

- `category-select`, `product-select`, `app-header`, `app-menu`, `install-app-button`, `ios-install-modal`, `portfolio-context-switcher` know domain types and app services, so they stay app compositions in `src/app/shared/components/`. The guard covers them with no exception.
- The Ionic parts they need become layer components: `jbh-select` (selects and context switcher), `jbh-toolbar` (app-header), `jbh-nav-item` (menu rows, install row).
- `app-header` keeps selector and no inputs, so pages do not depend on its internals: context banner + `jbh-toolbar` fed by `HeaderActionsService`.
- `ios-install-modal` drops `ion-content` for a plain scroll container. It opens with `DialogService.open(…, { sheet: true })` and closes with `DialogService.close()`.
- `category-select` / `product-select` drop the `selectInterface` input. It stays as an unused input until the cleanup wave, so pages not yet moved still compile under `strictTemplates`. Their other inputs stay.
- Delete dead code: `ui/home` and `portfolio-top-banner`.
- Alternatives: move them into the layer (rejected: the layer would carry domain code); exempt `shared/` (rejected: 8 files would keep Ionic).

### D5 — Buttons are components with attribute selectors on the native element

- `JbhButtonComponent`, selector `button[jbhButton], a[jbhButton], label[jbhButton]`. Inputs: `jbhButton` (variant, `''` means `primary`), `block`, `loading`, `icon`. Template: spinner when `loading`, else the icon when set, then `<ng-content/>`. Host classes `jbh-button`, `jbh-button--<variant>`, `jbh-button--block`, `jbh-button--loading`; `aria-busy` when loading. Pages keep `type`, `disabled`, `(click)` and `routerLink` on the native element.
- `JbhIconButtonComponent`, selector `button[jbhIconButton]`. Inputs: `jbhIconButton` (tone `default` | `primary` | `danger`), `icon` (required), `label` (required → `aria-label` and `title`), `size` (`md` | `sm`).
- `label[jbhButton]` exists for the file picker (`<label for>` styled as a button) in import-statement.
- Alternatives: element wrapper `<jbh-button>` (rejected: `type="submit"`, `disabled`, focus and form submit need forwarding and break easily); a pure attribute directive (rejected: no template, so the spinner/icon `@if` block stays copied in 23 buttons).

### D6 — Form controls: ControlValueAccessor plus one field frame

- `jbh-field` renders the label (`for` or `id`), the requirement marker, the projected control, the hint (`<id>-hint`) and the error (`<id>-error`, `role="alert"`). Inputs: `label`, `controlId`, `hint`, `error`, `requirement`. It is exported for rare custom controls; normal pages use the controls below.
- Each control implements `ControlValueAccessor` (provided with `NG_VALUE_ACCESSOR` and `forwardRef`), keeps its state in signals (`value`, `disabledByForm`), and uses OnPush. Signals mark the view for check; `markForCheck` is needed only if a plain field is set in an async callback.
- `nextId(prefix)` in `components/internal/next-id.ts` returns `<prefix>-<n>` from a module counter.
- Error contract: `error: string | null`; a non-empty string shows. Pages pass `hasError('x') ? getErrorMessage('x') : ''` and keep their `hasError()` / `getErrorMessage()` methods (forms.md pattern).
- Inputs per control:
  - `jbh-text-field`: `label`, `type` (`text` | `email` | `password`), `icon`, `placeholder`, `autocomplete`, `hint`, `error`, `requirement`; slot `[jbhFieldSuffix]`; built-in reveal button for passwords.
  - `jbh-number-field`: `label`, `decimals`, `icon`, `placeholder`, `hint`, `error`, `requirement`.
  - `jbh-textarea`: `label`, `rows`, `maxlength`, `icon`, `placeholder`, `hint`, `error`, `requirement`.
  - `jbh-date-field`: `label`, `mode`, `min`, `max`, `hint`, `error`, `requirement`.
  - `jbh-select`: `label`, `placeholder`, `icon`, `loading`, `hint`, `error`, `requirement`; projected `jbh-select-option` (`value`).
  - `jbh-toggle`: `label`, `checked` (`model()`), `disabled`.
- Alternatives: a field shell with a projected native input (rejected: the agreed pattern is CVA; pages would still write raw input markup); fields that read `NgControl` and an error map (rejected: duplicates page messages, bigger API).

### D7 — Number field replaces the decimal directive

- `jbh-number-field` does what `DecimalFormatDirective` does on focus, input, paste and blur, with core helpers. Value type `number | null`. Separators from `APP_CONFIG_TOKEN`.
- The directive cannot run inside a CVA: it needs `NgControl` on the same input and writes with `emitEvent: false`, so an inner control would never tell the outer form.
- Differences: the field calls `onChange`, so `valueChanges` now emits while the user types (no page subscribes to amount changes today; each migration task checks it). `writeValue` now shows grouped text.
- `DecimalFormatDirective` is deleted in the cleanup wave, when no template uses it.

### D8 — Date field with a unique picker id and a plain value format

- Template: `ion-datetime-button [datetime]="pickerId"` + `ion-modal [keepContentsMounted]="true"` + `ion-datetime [id]="pickerId"`, `presentation` = `date` or `month-year`, `[min]`, `[max]`, `[showDefaultButtons]="true"`, translated `cancelText` / `doneText`, `[value]`, `(ionChange)`.
- `pickerId = nextId('jbh-date-picker')`. Ionic keeps several pages in the DOM. Create and edit product can both hold `datetime-maturityDate` today, so a trigger may open the wrong picker. Unique ids fix this.
- Value contract: the field emits `toDateValue(detail.value, mode)`, so `YYYY-MM-DD` or `YYYY-MM`. This matches the backend `LocalDate` fields and the values the pages already send when the user does not touch the date. A native `<input type="date">` or `type="month"` gives the same formats, so the contract survives Ionic.
- Accessible name: `aria-labelledby` on the trigger (a `label for` cannot point to a custom element).
- No wheel option. One picker per mode keeps Ionic ideas out of the API. Product metadata dates move from wheel to calendar.

### D9 — Select with projected options

- `jbh-select` renders the optional icon, `ion-select` (`[value]`, `[interface]`, `[interfaceOptions]="{ header: label }"`, `[placeholder]`, `[disabled]`, `(ionChange)`, `(ionDismiss)`) with `<ng-content select="jbh-select-option">` inside, and a spinner while `loading`.
- `jbh-select-option` renders `<ion-select-option [value]><ng-content/></ion-select-option>`. This works because `ion-select` searches all descendants and watches the subtree. Labels stay in templates with pipes (`jbhDisplayName`, `translate`), so the project rule "formatting in templates only" holds.
- Overlay type comes from the layer viewport helper (≥ 1024 px → `popover`, else `action-sheet`). Pages stop passing `selectInterface`.
- Touched on `ionDismiss` and on change.
- Alternative: an `options` array of label strings (rejected: labels would be built in TS, and impure language pipes would not update).

### D10 — One icon registry, Ionicons names as the vocabulary

- `jbh-icon` renders `ion-icon` by `name`. `components/icon/icon-registry.ts` holds one map from name to the `ionicons/icons` export and calls `addIcons` once (an idempotent `registerJbhIcons()`, called by `JbhIconComponent`, `ToastService` and `jbh-toolbar`).
- Names stay the current Ionicons kebab names: static names in templates, plus the names from `ProductListItem.getTypeIcon()`, `getMovementIcon()`, `getStatusIcon()`, `getGrowthIcon()`, menu items, header actions and the toast close button. A new icon set later changes only this file. Semantic renaming was rejected: 206 uses and domain helpers would change with no gain now.
- `name` is a `string`, because domain helpers return `string`. An unknown name renders nothing and logs one `LoggerService.warn` per name.
- Today some icons show only because another page called `addIcons` first. One registry removes this hidden order.
- Host: `display: inline-flex; font-size: inherit; color: inherit`; the inner icon is 1em.
- Trade-off: about 70 icons (about 40 KB of SVG text) load in the shared chunk instead of per page. Accepted.

### D11 — Table driven by templates, no column config

- `jbh-table` inputs: `rows` (required), `trackBy` (default `(index, row) => row`), `label`. Content queries find `ng-template[jbhTableHead]` (required), `ng-template[jbhTableRow]` (required) and `ng-template[jbhTableCard]` (optional). Parts: `jbh-table-row` (`role="row"`) and `jbh-table-cell` (`header` → `columnheader`, else `cell`).
- Render: `div role="table"` with `aria-label`; a header row group with the head template; a body row group with `@for (row of rows(); track trackBy()($index, row))` and the row template (context `{ $implicit: row, index }`). With a card template, also a `div role="list"` of `role="listitem"` wrappers. CSS shows the table from 768 px and the list below 768 px, like `jbh-hide-mobile` / `jbh-hide-desktop` today.
- The page owns the row element inside its row template, so per-row classes (`[class.gap-period]`) stay in the page. Column widths stay in page SCSS on cell classes: templates render in the page view, so page styles apply.
- Template context is typed `any`, like the Angular CDK table.
- Alternatives: a `[columns]` config (rejected by the user); parts only, with the page's own `@for` (rejected: the table/cards pair is copied in 3 places and roles are easy to forget).

### D12 — Page shell, page events and toolbar

- `jbh-page` template: `<ng-content select="[jbhPageHeader]"/>` then `<ion-content><ng-content/></ion-content>`. Host: `display: flex; flex-direction: column; height: 100%`, so `ion-content` fills the `.ion-page` box as it does today next to `app-header`.
- Its SCSS sets `ion-content { --background: var(--jbh-page-background, …); --padding-top: …; --padding-bottom: … }`. Outer styles beat the Ionic `:host` defaults; plain inheritance would not.
- Events: in the constructor, take `inject(ElementRef).nativeElement.parentElement` (the routed page element). Listen with `Renderer2.listen` to `ionViewWillEnter` → `pageEnter.emit()` and `ionViewWillLeave` → `pageLeave.emit()`. Remove the listeners with `DestroyRef.onDestroy`.
- Why the timing is safe: the constructor runs inside `createComponent`, and Ionic fires the event later, after an async transition (see Context). The listener is registered in the Angular zone, and the page binds `(pageEnter)` in its template, so Angular marks the OnPush page for check.
- Rule: `jbh-page` must be the root element of a routed template. In any other place its parent is not the routed element and the events never come.
- `jbh-toolbar` inputs: `title`, `back`, `backHref`, `actions` (`id`, `icon`, `label?`, `handler`, same shape as `HeaderAction`). It renders `ion-header` / `ion-toolbar`, `ion-back-button [defaultHref]` or `ion-menu-button`, `ion-title`, and one `ion-button` per action with an accessible name.
- Alternatives: a host directive on each page (robust, but more code per page); `IonRouterOutlet` events (no per-page leave event, needs identity matching); keep `ionViewWillEnter` (fails the goal).

### D13 — Toasts, dialogs and menu navigation as services

- `ToastService.show(message, tone = 'info')`: `ToastController.create({ message, duration: 3000, position: 'bottom', color, buttons: [{ icon: 'close', role: 'cancel' }] })`, then `present()`. Color: `success`→`success`, `error`→`danger`, `warning`→`warning`, `info`→`medium`. It replaces 16 local `showToast` copies.
- `DialogService.confirm({ title, message, confirmText, cancelText?, destructive? }): Promise<boolean>`: alert with `header`, `message`, a `cancel` button (default text `common.cancel`) and a confirm button with role `destructive` or `confirm`. It awaits `onWillDismiss()` and returns `true` for `confirm` / `destructive`. Pages write `if (await this.dialog.confirm({…})) { this.deleteX(); }`.
- `DialogService.open(component, { sheet? })`: modal; with `sheet`, `breakpoints: [0, 0.5, 0.8, 1]` and `initialBreakpoint: 0.8` (today's values). `close()`: `ModalController.dismiss()`.
- `NavigationService.closeMenu()`: `MenuController.close()`. Pages keep the Angular `Router`; the app uses no Ionic navigation feature (`NavController`, `routerDirection`).

### D14 — Device platform port, viewport helper

- Port: `src/app/core/infrastructure/platform/device-platform.ts`, `abstract class DevicePlatform` with `isNativeApp()`, `isIos()`, `isAndroid()`.
- Adapter: `design-system/platform/device-platform/ionic-device-platform.service.ts` with Ionic `Platform`: `is('hybrid')`, `is('ios')`, `is('android')`. Bound in `main.ts` with `{ provide: DevicePlatform, useClass: IonicDevicePlatform }`, like the repositories.
- Rewire `TokenRefreshService` (`is('capacitor')` → `isNativeApp()`; the same in a Capacitor-only app), `PushNotificationService` and `PwaInstallService`.
- Viewport: the only users of `ViewportService` read `selectInterface`. The layer gets its own helper in `platform/viewport/` with a `wide` signal (≥ 1024 px), `window.innerWidth` (what `Platform.width()` returns) and a 100 ms debounced resize listener. The core service is deleted in cleanup.
- Alternatives: core imports the layer (rejected: core would depend on UI); Capacitor plus own user-agent checks (rejected now: re-implements Ionic's iPad detection; easy later inside the adapter).

### D15 — Framework-free formatting core in `src/app/core/formatting/`

- Files (each with a spec): `currency.ts` (`formatCurrency`, `formatProfit`), `growth.ts` (`formatGrowth`), `date.ts` (`toPeriod`, `periodToDate`, `formatMonthYear`, `formatPeriod`, `formatFullDate`, `formatShortDate`, `normalizePeriod`, `formatDate`, `toDateValue`, type `DateFormat`), `relative-time.ts` (`formatRelativeTime(value, now)`), `display-name.ts` (`pickDisplayName`), `translation-key.ts` (`parseTranslationKey`), `decimal-input.ts` (`DecimalSeparators` and the 6 helpers), `index.ts`.
- Language, current time and separators are parameters. `DecimalSeparators` is declared here, not imported from `app.config.ts`.
- Pipes keep name, purity and output and call the core. `JbhTranslationKeyPipe` keeps its cache; `JbhDisplayNamePipe` stays impure. `JbhDatePipe` statics delegate to the core in wave 4; callers (`balance-chart`, `balance-history-filter`) switch to core functions in wave 6; the statics go in cleanup (wave 7).
- `balance-chart` axis format uses `formatCurrency(value, currency, 0)`.
- Why here: this code must survive a UI framework change; the layer is the part we would rewrite.

### D16 — CSS ownership and global cleanup

- Each component copies the rules for its look from `custom-components.scss` into its own SCSS (adapted to `:host`). The global rules stay until wave 7, because pages not yet moved still use them.
- Global keeps: tokens and dark overrides, typography, layout utilities, links, animations, badges, feature classes still used, Ionic overlay rules (`ion-menu`, `::part`), and menu layout classes outside `jbh-nav-item`.
- Page SCSS may style `jbh-*` hosts (`jbh-icon { font-size: 24px }`), never Ionic internals. Each migration task fixes selectors that targeted elements now inside a component (`ion-icon`, `input`, `ion-select`).
- Cleanup method (wave 7): list each class selector in `custom-components.scss`; search it as a whole word in `src/app/**/*.{html,ts,scss}`, including TS strings; for classes built by string joins (`'movement-' + type`, `getProfitClass()`), search the prefix and the returned literals; remove only rules with zero hits.

### D17 — Angular conventions in the layer, end of `IonicModule`

- Signal APIs (`input()`, `input.required()`, `output()`, `model()`, `computed()`), `inject()`, OnPush, standalone, separate HTML/TS/SCSS files, Ionic only from `@ionic/angular/standalone`. New code passes `prefer-inject`.
- Cleanup removes `importProvidersFrom(IonicModule.forRoot())` from `main.ts`. The layer imports every Ionic component it renders, so nothing depends on `forRoot()` element registration.

### D18 — Texts inside the layer

- The layer may use `TranslatePipe` for its own fixed texts: `common.cancel`, `common.save`, `common.optional`, `common.characters`, `common.loading` (existing), and new `common.showPassword`, `common.hidePassword` (en and es, sorted). Pages pass translated strings for all page text.
- Only the layer task (3.17) and the dead-code task (6.7) edit `en.json` / `es.json`. Page tasks must not add keys; they report a need to the leader.

### D19 — Order of work

- Wave 1 (leader): alias, guard, script, baseline count.
- Wave 2: formatting core; layer skeleton, `nextId`, icon registry, `jbh-icon`, `jbh-spinner`; viewport helper.
- Wave 3 (3 parallel tracks): form controls; display components; platform.
- Wave 4: pipes as adapters; `category-select` and `product-select` on `jbh-select`.
- Wave 5: reference page `add-movement` alone. It proves text, number, date and select fields, textarea, loading button, toast, skeleton, header config and `pageEnter` / `pageLeave`. **User gate**: the user builds, opens the page, and checks the list in task 5.3 before wave 6 starts.
- Wave 6 (parallel by feature folder): auth; dashboard, reports, settings and profile; product forms; product lists and reports; teams; shared chrome; dead code.
- Wave 7: cleanup.
- Wave 8 (leader and user): docs, final guard check, the CI step, user checks.
- Parallel tasks touch disjoint files. Barrels are split per group (`icon`, `forms`, `display`, `platform`) so the wave-3 tracks never edit the same file.

### D20 — Unit tests for the layer and the core only

- Karma + Jasmine, `*.spec.ts` next to each file, only under `src/app/design-system/**` and `src/app/core/formatting/**`. This is an agreed exception to the project rule "no spec.ts files".
- TestBed: `provideIonicAngular()` for components that render Ionic elements; `TranslateModule.forRoot()` with no loader (keys render as keys) for components with fixed texts; Jasmine spies for `ToastController`, `AlertController`, `ModalController`, `MenuController`, `Platform` and `LoggerService`. No real overlays.
- Ionic events are simulated with `triggerEventHandler('ionChange', { detail })` or `dispatchEvent(new CustomEvent(name))`.
- Run with `--include`, so the old page specs (no providers) do not mix in.

### D21 — Segment, navigation item and chart wrappers

- `jbh-segment` renders `ion-segment` with one `ion-segment-button` per item of `options` (`value`, `label`, `icon?`), so the buttons stay direct children as Ionic expects. Inputs: `options`, `value` (`model()`), `label` (group `aria-label`). Used by the categories page.
- `jbh-nav-item` renders `ion-item` (`button`, no detail arrow, no lines) with a start `jbh-icon`, the projected label, an optional chevron and a `[jbhNavItemEnd]` slot. Inputs: `icon`, `level` (1 | 2 | 3), `active`, `expanded` (`boolean | null`; `null` hides the chevron). Output: `activate`. The `.jbh-menu-item*` / `-subitem*` / `-nested-subitem*` look moves into its SCSS. Used by `app-menu` and `install-app-button`.
- `jbh-line-chart` wraps `ngx-charts-line-chart` with `animations` off, both axes, `autoScale`, and the current hex palette (SVG attributes cannot read CSS variables). Inputs: `series`, `showLegend`, `valueFormatter`. `balance-chart` keeps its data preparation.

## Database

No database object changes. The design gate `database` does not apply.

## Test contract

The expected values below come from this design and from the current pipe behavior. Tests must be written against them, not against the new code.

### Formatting core (`src/app/core/formatting/*.spec.ts`)

| Function call | Expected |
|---|---|
| `formatCurrency(1234.5)` / `(-50)` / `(0)` / `(null)` / `(undefined)` | `$1,234.50` / `-$50.00` / `$0.00` / `''` / `''` |
| `formatCurrency(1234.5, 'EUR')` / `formatCurrency(1234.56, 'USD', 0)` | `€1,234.50` / `$1,235` |
| `formatProfit(100)` / `(-100)` / `(0)` / `(null)` / `(1234.5, 'EUR')` | `+$100.00` / `-$100.00` / `$0.00` / `$0.00` / `+€1,234.50` |
| `formatGrowth(12.3)` / `(-4.5)` / `(0)` / `(null)` | `+12.30%` / `-4.50%` / `0.00%` / `0.00%` |
| `toPeriod(new Date(2024, 0, 15))` | `2024-01` |
| `periodToDate('2024-03')` / `('2024-13')` / `('')` | `new Date(2024, 2, 1)` / `null` / `null` |
| `formatMonthYear(new Date(2024, 11, 1))` | `Dec 2024` |
| `formatPeriod('2024-01')` / `('bad')` | `Jan 2024` / `bad` |
| `formatFullDate(new Date(2024, 0, 15))` / `formatShortDate(same)` | `January 15, 2024` / `01/15/2024` |
| `normalizePeriod('2025-12-28T23:59:00')` / `('2024-05')` / `('')` | `2025-12` / `2024-05` / `''` |
| `formatDate('2024-01')` / `('2024-01', 'period')` / `(new Date(2024, 0, 15), 'fullDate')` / `(null)` | `Jan 2024` / `2024-01` / `January 15, 2024` / `''` |
| `toDateValue('2025-10-11T10:20:00', 'date')` / `('2025-10-11', 'date')` | `2025-10-11` / `2025-10-11` |
| `toDateValue('2025-10-11T10:20:00', 'month')` / `('2025-10', 'month')` / `('', 'date')` / `(null, 'month')` | `2025-10` / `2025-10` / `null` / `null` |
| `formatRelativeTime(v, now)` with `now = new Date('2025-06-01T12:00:00Z')`, `v` = `'2025-06-01T11:59:30Z'` / `'2025-06-01T11:55:00Z'` / `'2025-06-01T09:00:00Z'` | `Just now` / `5m ago` / `3h ago` |
| same `now`, `v = '2025-05-30T12:00:00Z'` / `v = null` | `new Date('2025-05-30T12:00:00Z').toLocaleDateString()` / `''` |
| `pickDisplayName({en:'Salary', es:'Salario'}, 'es')` / `({en:'Salary'}, 'es')` / `(null, 'en', 'fallback')` / `({fr:'Salaire'}, 'es', 'alias')` | `Salario` / `Salary` / `fallback` / `alias` |
| `parseTranslationKey('{"en":"Salary","es":"Salario"}', 'es' / 'en' / 'fr')` | `Salario` / `Salary` / `Salary` |
| `parseTranslationKey('Salary', 'es')` / `(null, 'es')` | `Salary` / `''` |

Decimal helpers, separators `{ decimalSeparator: '.', thousandsSeparator: ',' }` unless noted:

| Function call | Expected |
|---|---|
| `groupThousands('1234567.89')` / `('-1234')` / `('')` | `1,234,567.89` / `-1,234` / `''` |
| `stripThousands('1,234,567.89')` | `1234567.89` |
| `isAllowedDecimalText('12.34', 2)` / `('12.345', 2)` / `('12', 0)` / `('12.5', 0)` / `('-', 2)` / `('', 2)` / `('abc', 2)` | `true` / `false` / `true` / `false` / `true` / `true` / `false` |
| `parseDecimal('1234.5')` / `('')` | `1234.5` / `null` |
| `cleanDecimalOnBlur('12.', 2)` / `('12.3456', 2)` / `('12.30', 2)` | `12` / `12.34` / `12.30` |
| `formatDecimalForDisplay(1234.5)` / `(null)` | `1,234.5` / `''` |
| with `{ decimalSeparator: ',', thousandsSeparator: '.' }`: `parseDecimal('1234,5')` / `groupThousands('1234567,89')` | `1234.5` / `1.234.567,89` |

### Components (`src/app/design-system/components/**/*.spec.ts`)

| Unit | Input / action | Expected |
|---|---|---|
| `jbh-field` | `label="Email"`, `controlId="c1"`, `error="Required"`, `hint="We never share it"` | `label[for=c1]` text `Email`; element `#c1-error` with `role="alert"` and text `Required`; `#c1-hint` text `We never share it` |
| `jbh-field` | `requirement="required"` / `"optional"` | `*` with `aria-hidden="true"` / the text of `common.optional` |
| `jbh-text-field` | two instances | different input ids; each `label[for]` equals its own input id |
| `jbh-text-field` | `writeValue('abc')` | input value `abc` |
| `jbh-text-field` | user input `x` | change callback called with `'x'` |
| `jbh-text-field` | input blur | touched callback called once |
| `jbh-text-field` | `setDisabledState(true)` | `input.disabled === true` |
| `jbh-text-field` | `error='Required'` / `error=''` | `aria-invalid="true"` and `aria-describedby` contains the error id / no error element, no `aria-invalid="true"` |
| `jbh-text-field` | `type="password"`, click reveal once / twice | input type `text`, `aria-pressed="true"` / type `password`, `aria-pressed="false"` |
| `jbh-number-field` | type `1234.56`, blur | shows `1,234.56`; last change value `1234.56` |
| `jbh-number-field` | `decimals=2`, text `12.34`, input event with `12.345` | text back to `12.34`; no new change value |
| `jbh-number-field` | `decimals=0`, input `12.5` | text back to previous value |
| `jbh-number-field` | `writeValue(1234.5)` / `writeValue(null)` | shows `1,234.5` / `''` |
| `jbh-number-field` | focus on `1,234.5` | shows `1234.5` |
| `jbh-textarea` | `maxlength=500`, `writeValue('abc')` | counter text starts with `3/500` |
| `jbh-textarea` | `ionInput` with `detail.value = 'hello'` | change callback called with `'hello'` |
| `jbh-date-field` | `writeValue('2025-10-11')` | inner `ion-datetime` value `2025-10-11` |
| `jbh-date-field` | `ionChange` with `detail.value = '2025-10-12T09:30:00'`, mode `date` | change callback called with `'2025-10-12'` |
| `jbh-date-field` | same with `'2025-03-01T00:00:00'`, mode `month` | change callback called with `'2025-03'`; `presentation` is `month-year` |
| `jbh-date-field` | two instances | different picker ids; each trigger `datetime` attribute equals its own picker id |
| `jbh-select` | 3 projected options `A`, `B`, `C` | 3 `ion-select-option` elements with values `A`, `B`, `C` |
| `jbh-select` | `ionChange` with `detail.value = 'B'` | change callback `'B'`; touched callback called |
| `jbh-select` | viewport helper `wide = false` / `true` | `interface` `action-sheet` / `popover` |
| `jbh-select` | `label="Team"` | `interfaceOptions.header === 'Team'` |
| `jbh-select` | `loading=true` | spinner rendered; `ion-select` disabled |
| `jbh-toggle` | `writeValue(true)` | inner toggle checked |
| `jbh-toggle` | no form, `[checked]=true`, `ionChange` with `detail.checked = false` | `checkedChange` emits `false` |
| `jbh-toggle` | `disabled=true` input | inner toggle disabled |
| `button[jbhButton]` | `jbhButton="secondary" block` | host classes `jbh-button--secondary` and `jbh-button--block` |
| `button[jbhButton]` | empty `jbhButton` | host class `jbh-button--primary` |
| `button[jbhButton]` | `loading=true`, `icon="save-outline"` | one `jbh-spinner`; no `jbh-icon[name=save-outline]`; `aria-busy="true"` |
| `button[jbhButton]` | `type="submit"` in a reactive form, click | `ngSubmit` fires once |
| `button[jbhIconButton]` | `label="Delete"`, `icon="trash-outline"`, tone `danger` | `aria-label="Delete"`, `title="Delete"`, class `jbh-icon-button--danger`, one `jbh-icon` |
| `jbh-icon` | `name="trash-outline"` | one `ion-icon` with name `trash-outline`; host `aria-hidden="true"` |
| `jbh-icon` | `label="Warning"` | host `role="img"`, `aria-label="Warning"`, no `aria-hidden` |
| `jbh-icon` | `name="not-an-icon"` in two instances | no `ion-icon`; `LoggerService.warn` called once, message contains `not-an-icon` |
| icon registry | every name in the registry map | resolves to an SVG string |
| `jbh-spinner` | default | element with `role="status"` and `aria-label` = text of `common.loading` |
| `jbh-alert` | `tone="error"` / `"info"` | `role="alert"` / `role="status"`; projected text shown |
| `jbh-empty-state` | `title="No data"`, `message="Add one"`, projected button | `role="status"`; texts shown; the button inside |
| `jbh-skeleton` | `shape="input"`, `width="60%"`, `height="20px"` | class `jbh-skeleton--input`; inline width `60%`, height `20px`; `aria-hidden="true"` |
| `jbh-page-header` | `title="Movements"`, `subtitle="All"`, `variant="form"` | `h1` text `Movements`; subtitle shown; class `jbh-page-header--form` |
| `jbh-card` | `variant="elevated"` | class `jbh-card--elevated`; projected content shown |
| `jbh-table` | 3 rows, head with 2 header cells, row with 2 cells | `role="table"` with `aria-label`; 4 `role="row"`; 2 `columnheader`; 6 `cell` |
| `jbh-table` | with card template, 3 rows | 1 `role="list"`; 3 `role="listitem"` |
| `jbh-table` | `rows = []` | 1 `role="row"` (header only) |
| `jbh-table` | row template uses `let-item` | template receives each row object in order |
| `jbh-segment` | options `INCOME`, `EXPENSE`, value `INCOME`; `ionChange` with `detail.value = 'EXPENSE'` | `valueChange` emits `'EXPENSE'` |
| `jbh-nav-item` | `level=2`, `active=true`, click | host classes `jbh-nav-item--level-2` and `jbh-nav-item--active`; `activate` emits once |
| `jbh-nav-item` | `expanded=true` / `false` / `null` | chevron `chevron-up-outline` / `chevron-down-outline` / no chevron |
| `jbh-line-chart` | series with 2 points; `valueFormatter = v => 'X' + v` | chart rendered with `animations` false; axis formatter returns `X1234.56` for `1234.56` |

### Platform (`src/app/design-system/platform/**/*.spec.ts`)

| Unit | Input / action | Expected |
|---|---|---|
| `jbh-page` | test host page renders `<jbh-page (pageEnter)="n = n + 1">`; dispatch `new CustomEvent('ionViewWillEnter')` on the host element | `n === 1` |
| `jbh-page` | dispatch it a second time | `n === 2` |
| `jbh-page` | dispatch `ionViewWillLeave` | `pageLeave` emitted once |
| `jbh-page` | destroy fixture, then dispatch `ionViewWillEnter` on the old host element | no new emission |
| `jbh-page` | `[jbhPageHeader]` element and a `div.body` | header element is not inside `ion-content`; `div.body` is inside it |
| `jbh-toolbar` | `back=true`, `backHref='/x'` | `ion-back-button` with `defaultHref="/x"`; no `ion-menu-button` |
| `jbh-toolbar` | `back=false` | `ion-menu-button`; no back button |
| `jbh-toolbar` | action `{ id: 'refresh', icon: 'refresh-outline', handler }`, click | `handler` called once; button `aria-label="refresh"` |
| `ToastService` | `show('Saved', 'success')` | `create` called with `{ message: 'Saved', duration: 3000, position: 'bottom', color: 'success', buttons: [{ icon: 'close', role: 'cancel' }] }`; `present` called |
| `ToastService` | tones `error`, `warning`, `info`, none | colors `danger`, `warning`, `medium`, `medium` |
| `DialogService` | `confirm({ title: 'T', message: 'M', confirmText: 'Delete', cancelText: 'Cancel', destructive: true })` | `create` called with `header: 'T'`, `message: 'M'`, buttons `[{ text: 'Cancel', role: 'cancel' }, { text: 'Delete', role: 'destructive' }]` |
| `DialogService` | `onWillDismiss` resolves role `destructive` / `confirm` / `cancel` / `backdrop` | resolves `true` / `true` / `false` / `false` |
| `DialogService` | `confirm` without `cancelText` | cancel text = text of `common.cancel` |
| `DialogService` | `open(C, { sheet: true })` / `open(C)` | `create` called with `component: C`, `breakpoints: [0, 0.5, 0.8, 1]`, `initialBreakpoint: 0.8` / without breakpoints; `present` called |
| `DialogService` | `close()` | `ModalController.dismiss` called |
| `NavigationService` | `closeMenu()` | `MenuController.close` called once |
| viewport helper | `innerWidth` 800 / 1024 / 1280 | `wide()` `false` / `true` / `true` |
| viewport helper | resize from 800 to 1280, advance 100 ms (`fakeAsync`) | `wide()` becomes `true` |
| `IonicDevicePlatform` | `Platform.is` spy: `hybrid` true | `isNativeApp()` true |
| `IonicDevicePlatform` | `ios` true, `hybrid` false | `isIos()` true, `isNativeApp()` false |
| `IonicDevicePlatform` | `android` true | `isAndroid()` true |

### Guard (no test files; leader runs these with stdin)

| Command (prefix `ESLINT_USE_FLAT_CONFIG=false npx eslint --no-eslintrc -c .eslintrc.boundary.json --stdin --stdin-filename`) | stdin | Expected |
|---|---|---|
| `src/app/ui/x/guard-check.page.html` | `<ion-button></ion-button>` | 1 error, `no-restricted-syntax` |
| `src/app/design-system/components/x/x.component.html` | same | 0 errors |
| `src/app/ui/x/guard-check.page.ts` | `import { IonicModule } from '@ionic/angular';` | 1 error, `no-restricted-imports` |
| `src/app/ui/x/guard-check.page.ts` | `import { X } from '@design-system/components/forms/x';` | 1 error, `no-restricted-imports` |
| `src/app/ui/x/guard-check.page.ts` | `export class X { ionViewWillEnter(): void {} }` | 1 error, `no-restricted-syntax` |
| `src/app/core/formatting/x.ts` | `import { Injectable } from '@angular/core';` | 1 error |
| `src/app/core/formatting/x.ts` | `import { IonIcon } from '@ionic/angular/standalone';` | 1 error (superset list works) |
| `src/app/design-system/x/x.ts` | `import { JbhCurrencyPipe } from '@shared/pipes';` | 1 error |

## Risks / Trade-offs

- [Page events depend on Ionic internals: the event name and the element it is fired on] → One file uses them. The `jbh-page` spec pins the contract. The reference wave checks first visit and return visit on web and device. If Ionic changes this, only `jbh-page` changes.
- [`jbh-page` is not the root element of a routed template] → Its events never fire and data never loads. The spec states the rule; each page task checks it; CLAUDE.md gets the rule.
- [Page SCSS rules for `ion-icon`, `input` or `ion-select` stop matching after the move] → The SCSS check catches Ionic selectors; each page task reviews its SCSS; the user checks pages visually.
- [Removing `IonicModule.forRoot()` breaks an element in production builds] → Done in cleanup after the guard shows zero; the user runs `ng build --configuration production` and a smoke test of all pages.
- [Payload change: date fields send `YYYY-MM-DD`] → Backend uses `LocalDate` for movements and transfers. Metadata dates are stored as strings, so new values lose the time part. The user accepted this: they are calendar dates.
- [Visible changes] → Toast position and close button, metadata date picker style, no iOS large title on two team pages, context switcher look, translated date-filter buttons. The user accepted all five.
- [`valueChanges` now emits while typing in number fields] → Each page task checks subscriptions on amount controls.
- [Many tasks in wave 6 run in parallel] → Disjoint files; i18n edits serialized; barrels split; the leader merges per wave.
- [The guard is an error from day one while pages still use Ionic] → `ng lint` already fails today (old `prefer-inject` errors) and CI does not lint during the change, so nothing new breaks. The count goes down per wave. CI gets the boundary check only in wave 8, after the count is 0.
- [Bundle] → The icon registry moves about 40 KB of SVG text into the shared chunk. Accepted.
- [Old page specs fail without providers] → They are not run in this change (`--include`). They stay as they are.

## Migration Plan

1. Wave 1 (leader): alias, guard config, SCSS script, `lint:boundary`; record the baseline count.
2. Waves 2–4 add the layer without touching pages, except the two shared selects in wave 4.
3. Wave 5 moves `add-movement`. The user checks it before wave 6.
4. Wave 6 moves all other templates by feature, in parallel.
5. Wave 7 removes old adapters and unused global CSS.
6. Wave 8 updates the docs, checks that `npm run lint:boundary` exits 0, then adds it as a CI step in `.github/workflows/image.yml` (job `image`, before `Build app`), and ends with the user checks.

Rollback: each wave is one leader commit. Reverting a wave commit restores the state before it. Waves 2–4 add files only (plus the two shared selects, the port and the core service rewiring), so reverting them is safe.

## Resolved Questions

Answered by the user on 2026-10-11 (binding):

1. Acceptance check: `npm run lint:boundary` exits 0. The 249 old `prefer-inject` errors stay out of scope (separate change).
2. CI: yes. `npm run lint:boundary` becomes a step of the `image` job in `.github/workflows/image.yml`, added in wave 8 after the count is 0 (task 8.4).
3. Dead code: `src/app/ui/home/` and `portfolio-top-banner` are deleted (task 6.7).
4. Buttons: D5 is confirmed (a component with an attribute selector on the native element).
5. Visible changes: all 5 are accepted (toasts at the bottom with a close button; metadata dates use the calendar; edit-team and accept-invitation lose the iOS large title; standard select look for the context switcher; translated balance-history filter buttons).
6. Date value: `YYYY-MM-DD` / `YYYY-MM` only. New product metadata dates lose the time part; accepted, because they are calendar dates (`MATURITY_DATE`, `OPENING_DATE`, …).
