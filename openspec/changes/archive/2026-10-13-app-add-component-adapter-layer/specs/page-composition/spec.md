## ADDED Requirements

### Requirement: Every routed page uses the page shell
Every routed page template under `src/app/ui/` SHALL have `jbh-page` as its only root element. Pages that show the app toolbar SHALL project `<app-header jbhPageHeader>`. Logic that ran in `ionViewWillEnter` SHALL run in a `(pageEnter)` handler, and logic that ran in `ionViewWillLeave` SHALL run in a `(pageLeave)` handler. Pages SHALL NOT implement Ionic lifecycle interfaces.

#### Scenario: Data reloads on each visit
- **WHEN** the user opens Portfolio overview, goes to another page from the menu, and comes back
- **THEN** the product list is requested again, as it was with `ionViewWillEnter`

#### Scenario: Header config
- **WHEN** a page enters
- **THEN** its `(pageEnter)` handler sets the header config through `HeaderActionsService`, and its `(pageLeave)` handler clears it

#### Scenario: No API call in ngOnInit
- **WHEN** a page had its API calls in `ionViewWillEnter` before the change
- **THEN** those calls are in the `(pageEnter)` handler after the change and not in `ngOnInit`

### Requirement: Pages build UI from the layer and plain HTML
Page and feature-component templates SHALL use `jbh-*` components for icons, spinners, buttons, form fields, selects, toggles, date pickers, cards, alerts, empty states, skeletons, page headers, tables, segments and charts. Plain HTML elements for text and layout (`div`, `p`, `span`, `h1`–`h3`, `label`, `ul`, `li`, `form`) SHALL stay plain, with global `jbh-*` utility classes (container, typography, layout, badges, links, animations) where needed.

#### Scenario: Text field markup
- **WHEN** a page needs a text input with a label, an icon and an error
- **THEN** it uses one `jbh-text-field` element and not a hand-built `jbh-form-field` / `jbh-input-wrapper` / `jbh-field-error` block

#### Scenario: Plain text stays plain
- **WHEN** a page shows a heading and a paragraph
- **THEN** it uses `h1` and `p` elements, not a wrapper component

### Requirement: Feedback goes through the platform services
Pages and shared components SHALL show toasts only with `ToastService`, confirm dialogs and modals only with `DialogService`, and close the menu only with `NavigationService`.

#### Scenario: Delete confirmation
- **WHEN** the user taps delete on a product, a team, a member or a movement
- **THEN** a confirm dialog opens with the same title, message and button texts as before, and the item is deleted only when the user confirms

#### Scenario: Success toast
- **WHEN** a movement is saved
- **THEN** a success toast with the same message as before shows at the bottom with a close button

### Requirement: Shared components are compositions on the layer
`app-category-select` and `app-product-select` SHALL keep their selectors and inputs used by pages (except `selectInterface`, which is removed) and SHALL be built on `jbh-select`. `app-header` SHALL be built on `jbh-toolbar`. `app-menu` and `app-install-app-button` SHALL be built on `jbh-nav-item`. `app-portfolio-context-switcher` SHALL be built on `jbh-select`. `app-ios-install-modal` SHALL use plain scroll markup and layer buttons. None of them SHALL use Ionic directly.

#### Scenario: Category select still shows the description hint
- **WHEN** the user picks a category that has a description
- **THEN** the description hint shows below the select, as before

#### Scenario: Product select empty option
- **WHEN** `app-product-select` gets `emptyOption` `{ label: 'All products', value: '' }`
- **THEN** the first option is `All products` with value `''`

### Requirement: Dead code is removed
`src/app/ui/home/` (unrouted; `/home` redirects to `/dashboard`) and `src/app/shared/components/portfolio-top-banner/` (not used by any template) SHALL be deleted, with their spec, styles and the `home.*` i18n keys.

#### Scenario: Old home URL
- **WHEN** the user opens `/home`
- **THEN** the app redirects to `/dashboard`, as before

### Requirement: Old adapters are removed at the end
After all pages move, `src/main.ts` SHALL NOT call `IonicModule.forRoot()`, no file SHALL import `IonicModule`, `src/app/core/infrastructure/viewport/viewport.service.ts` and `DecimalFormatDirective` SHALL be deleted, and `src/theme/custom-components.scss` SHALL NOT keep rules for classes that no template, TS file or SCSS file under `src/app/` uses.

#### Scenario: Unused global class
- **WHEN** a class like `.jbh-ion-select-wrapper` has no use left in `src/app/**/*.html`, `src/app/**/*.ts` or `src/app/**/*.scss`
- **THEN** its rule is no longer in `src/theme/custom-components.scss`

#### Scenario: Class still used
- **WHEN** a global class like `.jbh-container` is still used in a template
- **THEN** its rule stays

### Requirement: Behavior stays the same except listed visible changes
The migration SHALL keep each page's data loading, validation, navigation, translations and layout. The only allowed visible changes SHALL be: toasts always at the bottom with a close button and 3000 ms; date fields send `YYYY-MM-DD` (or `YYYY-MM` in month mode) even after the user picks a date; product metadata date pickers use the calendar instead of the wheel; the edit-team and accept-invitation pages use the standard app toolbar (no iOS large collapsing title); the menu context switcher uses the standard select look; the date filter buttons on balance history use translated Cancel and Save texts.

#### Scenario: Movement date payload
- **WHEN** the user picks 12 October 2025 on Record movement and saves
- **THEN** the request body has `"entryDate": "2025-10-12"`
