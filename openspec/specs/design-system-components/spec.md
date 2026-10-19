# design-system-components Specification

## Purpose
TBD - created by archiving change app-add-component-adapter-layer. Update Purpose after archive.
## Requirements
### Requirement: Closed list of UI components with small APIs
The layer SHALL provide these components, exported from `@design-system/components`: `jbh-icon`, `jbh-spinner`, `jbh-field`, `jbh-text-field`, `jbh-number-field`, `jbh-textarea`, `jbh-date-field`, `jbh-select` with `jbh-select-option`, `jbh-toggle`, `button[jbhButton]` (also on `a` and `label`), `button[jbhIconButton]`, `jbh-card`, `jbh-alert`, `jbh-empty-state`, `jbh-skeleton`, `jbh-page-header`, `jbh-table` with its parts, `jbh-segment`, `jbh-nav-item` and `jbh-line-chart`. Each component SHALL have at most 8 inputs. Each SHALL use `ChangeDetectionStrategy.OnPush`, separate HTML, TS and SCSS files, and `inject()` for dependencies.

#### Scenario: Public entry
- **WHEN** a page imports `JbhTextFieldComponent` from `@design-system/components`
- **THEN** the import resolves and no deep path is needed

### Requirement: Each component owns its styles
Each component SHALL keep its styles in its own SCSS file and SHALL use only `--jbh-*` design tokens for colors, spacing, radius, shadow and typography. Global `--jbh-*` tokens and dark-mode token overrides SHALL stay in `src/theme/custom-components.scss`. Styles for Ionic overlays that render outside the component (`ion-menu`, select popovers and action sheets, alerts, toasts, modal sheets) SHALL stay global.

#### Scenario: Dark mode
- **WHEN** the system color scheme is dark
- **THEN** each component takes its dark colors from the global token overrides, with no dark-mode rule in its own SCSS

### Requirement: Form controls work with Angular forms
`jbh-text-field`, `jbh-number-field`, `jbh-textarea`, `jbh-date-field`, `jbh-select` and `jbh-toggle` SHALL implement `ControlValueAccessor`. They SHALL work with `formControlName`, `[formControl]` and `[(ngModel)]`. `writeValue` SHALL update the view. A user change SHALL call the registered change callback with the new value. Losing focus or closing a picker SHALL call the touched callback. `setDisabledState(true)` SHALL disable the inner control.

#### Scenario: Value from the form
- **WHEN** the form control value is set to `'abc'` on a `jbh-text-field`
- **THEN** the inner input shows `abc`

#### Scenario: Value from the user
- **WHEN** the user types `x` into an empty `jbh-text-field`
- **THEN** the form control value becomes `'x'`

#### Scenario: Disabled by the form
- **WHEN** the form control is disabled
- **THEN** the inner native input has the `disabled` property set to `true`

### Requirement: Fields have a label, hint and error with correct accessibility
Each form control SHALL render its label, an optional requirement marker, an optional hint and an optional error through `jbh-field`. Each instance SHALL generate a unique id. The label SHALL point to the inner control (`for` on native controls, `aria-labelledby` on Ionic controls). The `error` input SHALL be a message string: a non-empty string shows the message and puts the field in its error style; an empty string or `null` shows nothing. When an error shows, the control SHALL have `aria-invalid="true"` and `aria-describedby` SHALL include the error id. `requirement="optional"` SHALL show the translated `common.optional` text; `requirement="required"` SHALL show `*` (hidden from screen readers) and set `aria-required="true"`.

#### Scenario: Unique ids
- **WHEN** a page renders two `jbh-text-field` components
- **THEN** each inner input has a different id and each label `for` matches its own input id

#### Scenario: Error shown
- **WHEN** `error` is `'This field is required'`
- **THEN** the text `This field is required` is visible, the input has `aria-invalid="true"`, and the input `aria-describedby` contains the id of the error element

#### Scenario: No error
- **WHEN** `error` is `''`
- **THEN** no error element is rendered and the input has no `aria-invalid="true"`

### Requirement: Text field
`jbh-text-field` SHALL wrap a native `<input>`. It SHALL support `type` `text`, `email` and `password`, an optional leading `icon`, `placeholder` and `autocomplete`. For `type="password"` it SHALL show a reveal button that switches the input between `password` and `text` and has a translated `aria-label` and `aria-pressed`. It SHALL project content marked `jbhFieldSuffix` at the end of the input (for status icons).

#### Scenario: Reveal password
- **WHEN** the user presses the reveal button of a password field once
- **THEN** the input type is `text` and the button has `aria-pressed="true"`

### Requirement: Number field
`jbh-number-field` SHALL wrap a native `<input inputmode="decimal">` and hold a `number | null` value. It SHALL accept at most `decimals` decimal places (default 2; 0 means integers only). It SHALL reject a keystroke or paste that makes the text invalid by keeping the previous valid text. On focus it SHALL remove thousands separators. On blur it SHALL remove a trailing decimal separator and show thousands separators. The separators SHALL come from `APP_CONFIG.numberFormat`. The logic SHALL live in the formatting core.

#### Scenario: Type and blur
- **WHEN** the user types `1234.56` and leaves the field
- **THEN** the field shows `1,234.56` and the form value is the number `1234.56`

#### Scenario: Too many decimals
- **WHEN** `decimals` is 2, the text is `12.34` and the user types `5`
- **THEN** the text stays `12.34` and the form value stays `12.34`

#### Scenario: Value from the form
- **WHEN** the form value is set to `1234.5`
- **THEN** the field shows `1,234.5`; when the form value is set to `null`, the field shows an empty text

### Requirement: Textarea
`jbh-textarea` SHALL support `rows` (default 3), `placeholder`, an optional leading `icon` and `maxlength`. The textarea SHALL grow with its content. When `maxlength` is set, it SHALL show a counter `<length>/<maxlength> <translated common.characters>`.

#### Scenario: Counter
- **WHEN** `maxlength` is 500 and the value is `abc`
- **THEN** the counter shows `3/500` followed by the translated word for characters

### Requirement: Date field
`jbh-date-field` SHALL open a date picker. `mode="date"` SHALL use a calendar and its form value SHALL be a `YYYY-MM-DD` string. `mode="month"` SHALL use a month-and-year picker and its form value SHALL be a `YYYY-MM` string. It SHALL accept any ISO 8601 value from the form and show it. It SHALL support `min` and `max`. It SHALL link its trigger and its picker with a generated id that is unique in the whole document. The picker buttons SHALL use the translated `common.cancel` and `common.save` texts.

#### Scenario: Picked date with a time part
- **WHEN** the picker emits `2025-10-12T09:30:00` in date mode
- **THEN** the form value becomes `2025-10-12`

#### Scenario: Month mode
- **WHEN** the picker emits `2025-03-01T00:00:00` in month mode
- **THEN** the form value becomes `2025-03`

#### Scenario: Two date fields on cached pages
- **WHEN** two `jbh-date-field` components exist in the DOM at the same time
- **THEN** each trigger opens its own picker, because each picker id is different

### Requirement: Select
`jbh-select` SHALL render a native-looking select with options given as projected `jbh-select-option` elements, so option labels are written in the template with pipes. It SHALL choose the overlay type itself: a popover when the viewport is at least 1024 px wide, an action sheet otherwise. It SHALL use its `label` as the overlay header. It SHALL support `placeholder`, an optional leading `icon` and `loading`; while `loading` is true it SHALL show a spinner and be disabled.

#### Scenario: Projected options
- **WHEN** the template projects three `jbh-select-option` elements with values `A`, `B` and `C`
- **THEN** the overlay lists three options with the projected label texts

#### Scenario: Selection
- **WHEN** the user picks the option with value `B`
- **THEN** the form value becomes `'B'` and the control is marked as touched

#### Scenario: Overlay type
- **WHEN** the viewport is 800 px wide
- **THEN** the select uses an action sheet; at 1280 px it uses a popover

### Requirement: Toggle
`jbh-toggle` SHALL have a required visible `label`. It SHALL work as a form control and also without a form, through a two-way `checked` binding and a `disabled` input. The control is disabled when the form or the `disabled` input says so.

#### Scenario: Toggle outside a form
- **WHEN** the user switches a toggle that has `[checked]="true"` and no form control
- **THEN** `checkedChange` emits `false`

### Requirement: Buttons keep native behavior
`button[jbhButton]`, `a[jbhButton]` and `label[jbhButton]` SHALL be components with an attribute selector on the native element, so `type="submit"`, `disabled`, keyboard focus and form submission keep their native behavior. The `jbhButton` value SHALL be one of `primary` (default), `secondary`, `outline`, `text`, `danger`, `success`. Inputs `block` and `loading` SHALL set the full-width and loading styles. Input `icon` SHALL show a leading icon. While `loading` is true the button SHALL show a spinner in place of the icon and set `aria-busy="true"`. `button[jbhIconButton]` SHALL require `icon` and `label`; the `label` SHALL become both `aria-label` and `title`. It SHALL support the tones `default`, `primary`, `danger` and the sizes `md`, `sm`.

#### Scenario: Submit button in a form
- **WHEN** the user clicks `<button jbhButton type="submit">` inside a reactive form
- **THEN** the form `ngSubmit` event fires once

#### Scenario: Loading
- **WHEN** `loading` is true on a button with `icon="save-outline"`
- **THEN** a spinner is rendered, the save icon is not rendered, and the button has `aria-busy="true"`

#### Scenario: Icon button name
- **WHEN** an icon button has `label="Delete"`
- **THEN** it has `aria-label="Delete"` and `title="Delete"`

### Requirement: Icons come from one registry
`jbh-icon` SHALL render icons by name from one closed registry in the layer. All icon registration SHALL happen in that registry. The registry SHALL contain every icon name used in templates, menus, header actions, toasts and the names returned by domain or page helpers (for example `ProductListItem.getTypeIcon()`). An unknown name SHALL render nothing and SHALL log one warning through `LoggerService`. Without a `label` the icon SHALL be `aria-hidden="true"`; with a `label` it SHALL have `role="img"` and that `aria-label`. Icon size and color SHALL follow the `font-size` and `color` of the `jbh-icon` element.

#### Scenario: Known icon
- **WHEN** a template renders `<jbh-icon name="trash-outline">`
- **THEN** the trash icon shows and the element is hidden from screen readers

#### Scenario: Unknown icon
- **WHEN** a template renders `<jbh-icon name="not-an-icon">` twice
- **THEN** no icon shows and `LoggerService.warn` is called once with a message that contains `not-an-icon`

### Requirement: Display components
`jbh-spinner` SHALL show a loading indicator with a translated accessible name. `jbh-card` SHALL project content with `variant` `default`, `elevated`, `flat` or `form`. `jbh-alert` SHALL project content with `tone` `error`, `warning`, `info` or `success`, show a matching icon, and use `role="alert"` for `error` and `role="status"` for the others. `jbh-empty-state` SHALL show `icon`, `title` and `message`, project optional actions, and use `role="status"`. `jbh-skeleton` SHALL show a placeholder with `shape` `line`, `label`, `input`, `select`, `header`, `table` or `block`, optional `width` and `height`, and `aria-hidden="true"`. `jbh-page-header` SHALL show `icon`, `title` (as `h1`) and optional `subtitle`, project optional actions, and support `variant` `page` and `form`.

#### Scenario: Error alert
- **WHEN** a page renders `<jbh-alert tone="error">Wrong password</jbh-alert>`
- **THEN** the element with `role="alert"` contains `Wrong password`

#### Scenario: Empty state with an action
- **WHEN** an empty state projects a `<button jbhButton>`
- **THEN** the button renders below the message

### Requirement: Table without column config
`jbh-table` SHALL take `rows`, an optional `trackBy` function and a `label`. It SHALL render a header from an `ng-template` marked `jbhTableHead` and one row per item from an `ng-template` marked `jbhTableRow`, with the item as the template context. Pages SHALL build header and rows from `jbh-table-row` and `jbh-table-cell` (`header` input for column headers). When an `ng-template` marked `jbhTableCard` is present, the table SHALL show the rows as a table on wide screens and as a list of cards on small screens, with the same breakpoint the app uses today (768 px). The table SHALL set `role="table"`, `rowgroup`, `row`, `columnheader`, `cell`, and `list` / `listitem` for the cards.

#### Scenario: Rows and roles
- **WHEN** `rows` has 3 items and the head template has 2 header cells
- **THEN** the table has `role="table"` with the given `aria-label`, 4 elements with `role="row"`, 2 with `role="columnheader"`, and 6 with `role="cell"` when each row has 2 cells

#### Scenario: Mobile cards
- **WHEN** a `jbhTableCard` template is present and `rows` has 3 items
- **THEN** the DOM also has 1 element with `role="list"` and 3 with `role="listitem"`

#### Scenario: Empty rows
- **WHEN** `rows` is empty
- **THEN** only the header row renders

### Requirement: Segment, navigation item and chart
`jbh-segment` SHALL render options from an `options` input (`value`, `label`, optional `icon`) with a two-way `value` binding and an accessible group `label`. `jbh-nav-item` SHALL render a clickable menu row with `icon`, projected label, `level` (1, 2 or 3), `active`, an optional `expanded` chevron, and an end slot. `jbh-line-chart` SHALL take `series` (`name`, `points` of `label` and `value`), `showLegend` and a `valueFormatter` for the value axis, and SHALL always render with animations off.

#### Scenario: Segment change
- **WHEN** the user picks the `EXPENSE` option of a segment bound to `INCOME`
- **THEN** `valueChange` emits `'EXPENSE'`

#### Scenario: Chart axis format
- **WHEN** `valueFormatter` returns `$1,235` for `1234.56`
- **THEN** the value axis tick for `1234.56` reads `$1,235`

