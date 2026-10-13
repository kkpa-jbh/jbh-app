## ADDED Requirements

### Requirement: Formatting logic lives in plain TypeScript
All display-formatting logic of the 7 pipes in `src/app/shared/pipes/`, the decimal input logic, and the chart axis currency format SHALL live as pure functions in `src/app/core/formatting/`, exported from `src/app/core/formatting/index.ts`. The functions SHALL NOT read global state: the language, the current time and the number separators SHALL be parameters.

#### Scenario: Relative time is testable
- **WHEN** `formatRelativeTime('2025-06-01T11:55:00Z', new Date('2025-06-01T12:00:00Z'))` is called
- **THEN** it returns `5m ago` without reading the system clock

### Requirement: Currency, profit and growth
`formatCurrency(value, currency = 'USD', fractionDigits = 2)` SHALL format with `Intl.NumberFormat('en-US')` in currency style and SHALL return `''` for `null` and `undefined`. `formatProfit(value, currency = 'USD')` SHALL add `+` for positive values and treat `null` as 0. `formatGrowth(value)` SHALL return the value with 2 decimals and `%`, add `+` for positive values, and treat `null` as 0.

#### Scenario: Currency values
- **WHEN** `formatCurrency` is called with `1234.5`, `-50`, `0`, `null`, (`1234.5`, `'EUR'`) and (`1234.56`, `'USD'`, `0`)
- **THEN** it returns `$1,234.50`, `-$50.00`, `$0.00`, `''`, `€1,234.50` and `$1,235`

#### Scenario: Profit values
- **WHEN** `formatProfit` is called with `100`, `-100`, `0` and `null`
- **THEN** it returns `+$100.00`, `-$100.00`, `$0.00` and `$0.00`

#### Scenario: Growth values
- **WHEN** `formatGrowth` is called with `12.3`, `-4.5`, `0` and `null`
- **THEN** it returns `+12.30%`, `-4.50%`, `0.00%` and `0.00%`

### Requirement: Dates and periods
The core SHALL provide `toPeriod(date)` (`YYYY-MM`), `periodToDate(period)` (first day of the month, or `null` when invalid), `formatMonthYear(date)`, `formatPeriod(period)`, `formatFullDate(date)`, `formatShortDate(date)`, `normalizePeriod(value)`, `formatDate(value, format)` with the formats `monthYear` (default), `fullDate`, `shortDate` and `period`, and `toDateValue(value, mode)` for the date field. All text formats SHALL use the `en-US` locale, as the pipe does today.

#### Scenario: Period helpers
- **WHEN** `toPeriod(new Date(2024, 0, 15))`, `formatPeriod('2024-01')`, `formatPeriod('bad')` and `periodToDate('2024-13')` are called
- **THEN** they return `2024-01`, `Jan 2024`, `bad` and `null`

#### Scenario: Date formats
- **WHEN** `formatFullDate(new Date(2024, 0, 15))` and `formatShortDate(new Date(2024, 0, 15))` are called
- **THEN** they return `January 15, 2024` and `01/15/2024`

#### Scenario: Normalize period
- **WHEN** `normalizePeriod` is called with `2025-12-28T23:59:00`, `2024-05` and `''`
- **THEN** it returns `2025-12`, `2024-05` and `''`

#### Scenario: formatDate
- **WHEN** `formatDate('2024-01')`, `formatDate('2024-01', 'period')` and `formatDate(null)` are called
- **THEN** they return `Jan 2024`, `2024-01` and `''`

#### Scenario: Date field values
- **WHEN** `toDateValue` is called with (`2025-10-11T10:20:00`, `'date'`), (`2025-10-11`, `'date'`), (`2025-10-11T10:20:00`, `'month'`), (`2025-10`, `'month'`) and (`''`, `'date'`)
- **THEN** it returns `2025-10-11`, `2025-10-11`, `2025-10`, `2025-10` and `null`

### Requirement: Relative time
`formatRelativeTime(value, now)` SHALL return `Just now` under 1 minute, `<n>m ago` under 1 hour, `<n>h ago` under 1 day, and `date.toLocaleDateString()` from 1 day on. It SHALL return `''` for `null`, `undefined` and `''`.

#### Scenario: Relative time values
- **WHEN** `now` is `2025-06-01T12:00:00Z` and the values are `2025-06-01T11:59:30Z`, `2025-06-01T11:55:00Z` and `2025-06-01T09:00:00Z`
- **THEN** the results are `Just now`, `5m ago` and `3h ago`

#### Scenario: Older than a day
- **WHEN** the value is `2025-05-30T12:00:00Z` with the same `now`
- **THEN** the result equals `new Date('2025-05-30T12:00:00Z').toLocaleDateString()`

### Requirement: Multi-language labels
`pickDisplayName(displayName, lang, fallback = '')` SHALL return the text for `lang`, else the `en` text, else `fallback`. `parseTranslationKey(json, lang)` SHALL parse a JSON string like `{"en":"Salary","es":"Salario"}` and return the `es` text when `lang` is `es` and the `en` text otherwise; it SHALL return the input when it is not valid JSON and `''` for empty input.

#### Scenario: Display names
- **WHEN** `pickDisplayName` is called with (`{en:'Salary', es:'Salario'}`, `'es'`), (`{en:'Salary'}`, `'es'`), (`null`, `'en'`, `'fallback'`) and (`{fr:'Salaire'}`, `'es'`, `'alias'`)
- **THEN** it returns `Salario`, `Salary`, `fallback` and `alias`

#### Scenario: Translation keys
- **WHEN** `parseTranslationKey` is called with the JSON above and `'es'`, `'en'`, `'fr'`, then with `'Salary'` and `'es'`, then with `null`
- **THEN** it returns `Salario`, `Salary`, `Salary`, `Salary` and `''`

### Requirement: Decimal input helpers
With separators `{ decimalSeparator: '.', thousandsSeparator: ',' }`, the core SHALL provide `groupThousands(text, sep)`, `stripThousands(text, sep)`, `isAllowedDecimalText(text, maxDecimals, sep)`, `parseDecimal(text, sep)`, `cleanDecimalOnBlur(text, maxDecimals, sep)` and `formatDecimalForDisplay(value, sep)`.

#### Scenario: Grouping
- **WHEN** `groupThousands` is called with `1234567.89`, `-1234` and `''`
- **THEN** it returns `1,234,567.89`, `-1,234` and `''`; and `stripThousands('1,234,567.89')` returns `1234567.89`

#### Scenario: Allowed text while typing
- **WHEN** `isAllowedDecimalText` is called with (`12.34`, 2), (`12.345`, 2), (`12`, 0), (`12.5`, 0), (`-`, 2), (`''`, 2) and (`abc`, 2)
- **THEN** it returns `true`, `false`, `true`, `false`, `true`, `true` and `false`

#### Scenario: Parse and clean
- **WHEN** `parseDecimal('1234.5')`, `parseDecimal('')`, `cleanDecimalOnBlur('12.', 2)`, `cleanDecimalOnBlur('12.3456', 2)` and `formatDecimalForDisplay(1234.5)` are called
- **THEN** they return `1234.5`, `null`, `12`, `12.34` and `1,234.5`; and `formatDecimalForDisplay(null)` returns `''`

#### Scenario: Other separators
- **WHEN** the separators are `{ decimalSeparator: ',', thousandsSeparator: '.' }` and `parseDecimal('1234,5')` and `groupThousands('1234567,89')` are called
- **THEN** they return `1234.5` and `1.234.567,89`

### Requirement: Pipes are thin adapters
Each pipe (`jbhCurrency`, `jbhDate`, `jbhDisplayName`, `jbhGrowth`, `jbhProfit`, `jbhRelativeTime`, `jbhTranslationKey`) SHALL keep its name, inputs, purity and output, and SHALL only call the matching core function. Pipes that need the language SHALL read it from `TranslationService` and pass it in. `jbhRelativeTime` SHALL pass `new Date()` as `now`. The static helper methods of `JbhDatePipe` SHALL be removed once no caller uses them; callers SHALL import the core functions instead.

#### Scenario: Same output as before
- **WHEN** a template renders `{{ 1234.5 | jbhCurrency }}`
- **THEN** it shows `$1,234.50`, the same as before the change
