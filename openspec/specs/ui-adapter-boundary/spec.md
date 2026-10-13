# ui-adapter-boundary Specification

## Purpose
TBD - created by archiving change app-add-component-adapter-layer. Update Purpose after archive.
## Requirements
### Requirement: Only the layer touches Ionic and external UI libraries
Outside `src/app/design-system/`, no template SHALL contain an `<ion-*>` or `<ngx-charts-*>` element, and no TypeScript file SHALL import `@ionic/*`, `ionicons`, `ionicons/*` or `@swimlane/ngx-charts`. The only exceptions SHALL be the bootstrap and root files `src/main.ts`, `src/app/app.component.ts` and `src/app/app.component.html`.

#### Scenario: Ionic tag in a page template
- **WHEN** ESLint checks `src/app/ui/x/guard-check.page.html` with the content `<ion-button></ion-button>`
- **THEN** it reports exactly 1 error from `no-restricted-syntax` with a message that names `src/app/design-system/`

#### Scenario: Ionic import in a page TS file
- **WHEN** ESLint checks `src/app/ui/x/guard-check.page.ts` with the line `import { IonicModule } from '@ionic/angular';`
- **THEN** it reports 1 error from `no-restricted-imports`

#### Scenario: Standalone Ionic, ionicons and ngx-charts imports outside the layer
- **WHEN** a TS file outside the layer imports `@ionic/angular/standalone`, `ionicons`, `ionicons/icons` or `@swimlane/ngx-charts`
- **THEN** ESLint reports 1 `no-restricted-imports` error for each import

#### Scenario: The same code inside the layer
- **WHEN** ESLint checks `src/app/design-system/components/x/x.component.html` with `<ion-button></ion-button>`
- **THEN** it reports no boundary error

#### Scenario: Root exceptions
- **WHEN** ESLint checks `src/main.ts`, `src/app/app.component.ts` and `src/app/app.component.html` as they are after the change
- **THEN** it reports no boundary error

### Requirement: Pages do not use Ionic lifecycle method names
Outside `src/app/design-system/`, no class SHALL declare a method whose name starts with `ionView`. Pages SHALL use the `pageEnter` and `pageLeave` events of `jbh-page` instead.

#### Scenario: ionViewWillEnter in a page
- **WHEN** ESLint checks a TS file in `src/app/ui/` that declares `ionViewWillEnter(): void {}`
- **THEN** it reports 1 `no-restricted-syntax` error

### Requirement: The layer keeps its own boundaries
Inside `src/app/design-system/`, TS files SHALL NOT import from `@ui/*` or `@shared/*`, and SHALL NOT import from the `@ionic/angular` root entry (only `@ionic/angular/standalone`). Files outside the layer SHALL import it only through its public entry points `@design-system/components` and `@design-system/platform`.

#### Scenario: Deep import into the layer
- **WHEN** a page imports `@design-system/components/forms/text-field/jbh-text-field.component`
- **THEN** ESLint reports a `no-restricted-imports` error

#### Scenario: Layer imports a feature module
- **WHEN** a file in `src/app/design-system/` imports from `@shared/pipes`
- **THEN** ESLint reports a `no-restricted-imports` error

#### Scenario: Layer imports the module-based Ionic entry
- **WHEN** a file in `src/app/design-system/` imports `IonicModule` from `@ionic/angular`
- **THEN** ESLint reports a `no-restricted-imports` error

### Requirement: The formatting core is framework-free
Files in `src/app/core/formatting/` SHALL NOT import `@angular/*`, `rxjs`, `rxjs/*`, `@ngx-translate/*`, `@ionic/*`, `ionicons`, `@capacitor/*` or `@swimlane/*`.

#### Scenario: Angular import in the formatting core
- **WHEN** ESLint checks a file in `src/app/core/formatting/` that imports `Injectable` from `@angular/core`
- **THEN** it reports a `no-restricted-imports` error

### Requirement: Page and shared SCSS do not style Ionic internals
Component SCSS files under `src/app/` outside `src/app/design-system/` SHALL NOT contain Ionic element selectors (`ion-` not preceded by a letter, digit or `-`), `::part(` or `var(--ion-`. Global files `src/global.scss`, `src/theme/**` and `src/app/app.component.scss` SHALL be exempt.

#### Scenario: Page SCSS targets ion-icon
- **WHEN** the SCSS check runs and `src/app/ui/x/x.page.scss` contains `ion-icon { font-size: 24px; }`
- **THEN** the check prints the file and line and exits with code 1

#### Scenario: Class names that contain "ion-"
- **WHEN** a page SCSS file contains the class `.jbh-ion-select-wrapper`
- **THEN** the check does not report it

### Requirement: One command reports only boundary problems
The project SHALL provide `npm run lint:boundary`. It SHALL run only the boundary ESLint rules and the SCSS check, and it SHALL exit with code 0 only when there are zero boundary violations. `ng lint` SHALL also report the boundary rules, because `.eslintrc.json` extends the boundary config. At the end of the change, the `image` job in `.github/workflows/image.yml` SHALL run `npm run lint:boundary` after installing dependencies and before building the app.

#### Scenario: End of the change
- **WHEN** the user runs `npm run lint:boundary` after the last wave
- **THEN** it exits with code 0 and prints no boundary violation

#### Scenario: CI stops on a boundary violation
- **WHEN** a push to `main` contains a page template with `<ion-icon>`
- **THEN** the `image` job fails at the `lint:boundary` step, and the build and push steps do not run

#### Scenario: Other lint errors do not hide the result
- **WHEN** `ng lint` still reports the old `@angular-eslint/prefer-inject` errors
- **THEN** `npm run lint:boundary` still exits with code 0 when there is no boundary violation

### Requirement: Selector prefixes allow the layer
The lint rules for component and directive selectors SHALL accept the prefixes `app` and `jbh`, with kebab-case element selectors and camelCase attribute selectors, so `jbh-*` elements and `jbh*` attributes pass.

#### Scenario: Attribute selector component
- **WHEN** ESLint checks a component with selector `button[jbhButton], a[jbhButton], label[jbhButton]`
- **THEN** it reports no `@angular-eslint/component-selector` error

