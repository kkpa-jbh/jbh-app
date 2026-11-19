Rules for every task:

- Wave number = group number. Tasks in one wave run in parallel only when they touch different files. Dependencies are named.
- `[leader]` = the leader runs it. `[user]` = the user runs it in the browser. No tag = `app` worker.
- No unit tests and no `spec.ts` (design.md D12). Test-First is off, so there is no blueprint group.
- New code: `inject()`, no `console.*` (use `LoggerService`), every function cyclomatic <= 10, cognitive <= 15, <= 40 lines.
- Before reporting, a worker runs `npx eslint` on the files it touched. It runs no build and no test.
- Do not edit `jbh-deploy`.

## 1. Wave 1 — Setup (1.1 to 1.4 run in parallel)

- [ ] 1.1 [leader] Run `npm install --save-exact @grafana/faro-web-sdk@2.14.0 @grafana/faro-web-tracing@2.14.0`. `package.json` must show `"2.14.0"` for both, with no `^` or `~`, and `package-lock.json` must change (D1).
- [ ] 1.2 Add the `observability` block to `src/environments/environment.ts`, `environment.prod.ts` and `environment.stg.ts` with the values of the D2 table. Do not change other fields.
- [ ] 1.3 Create `src/app/core/infrastructure/observability/faro-url.ts` with `stripUrlQueries(text: string): string` (removes `?...` and `#...` from every `http://` or `https://` URL inside the text) and `toPathTemplate(url: string): string` (path only, numeric and UUID segments become `{id}`, returns `/unknown` for a URL that does not parse) (D9, D10). Pure functions, no import.
- [ ] 1.4 Edit `.github/workflows/image.yml`: the `Build app` step runs `npx ng build --configuration production --define "JBH_GIT_SHA='$GITHUB_SHA'"`. Extend the step comment (what `--define` does, why the SHA, why the inner quotes) in the file's comment style (D8).

## 2. Wave 2 — Observability code (2.1 and 2.2 run in parallel, then 2.3 and 2.4)

- [ ] 2.1 Create `faro-privacy.ts` in the same folder: `scrubTransportItem(item: TransportItem): TransportItem | null` and small helpers (`scrubValue`, `scrubObject`, `scrubString`) with the rules, `DROP_KEYS` and `CUT_KEYS` of D9. New objects only, `try/catch` returns `null`. Depends on 1.3.
- [ ] 2.2 Create `faro-reporter.service.ts`: `FaroReporterService` with `reportError(error: unknown)`, `reportApiFailure(request: HttpRequest<unknown>, status: number)` and `isReportableStatus` as in D10. Guard with `environment.observability.enabled`. Skip `JBHError` in `reportError`. `try/catch` in both public methods. Depends on 1.2, 1.3.
- [ ] 2.3 Create `faro.init.ts`: `initFaro(): void` as in D3, D4, D5, D6, D8, D11 and D15 (guard, `try/catch` with `LoggerService`, `declare const JBH_GIT_SHA`, `getWebInstrumentations({ captureConsole: false })`, `TracingInstrumentation` with `propagateTraceHeaderCorsUrls: []`, `beforeSend: scrubTransportItem`, `internalLoggerLevel: InternalLoggerLevel.OFF`, `batching`). No `setUser`. Depends on 1.2, 2.1.
- [ ] 2.4 Create `faro-error-handler.ts`: `FaroErrorHandler implements ErrorHandler` (D10): report, then `new ErrorHandler()` fallback. `Injectable()`. Depends on 2.2.

## 3. Wave 3 — Wiring and docs (3.1 to 3.3 run in parallel)

- [ ] 3.1 Edit `src/main.ts`: call `initFaro()` before `bootstrapApplication`, and add `{ provide: ErrorHandler, useClass: FaroErrorHandler }` to the providers with a one-line comment (D4, D10). Depends on 2.3, 2.4.
- [ ] 3.2 Edit `src/app/core/infrastructure/interceptors/error.interceptor.ts`: add the lazy getter `faroReporter` (same `injector.get` pattern as the other getters) and one call `this.faroReporter.reportApiFailure(request, error.status)` at the start of the `catchError` callback in `intercept`. Do not touch `extractLocalizedMessage` and do not add a branch to `intercept` (D10). Depends on 2.2.
- [ ] 3.3 Add the "Observability" section to `.claude/CLAUDE.md` and the new folder to its "Key files" tree: signals (traces, errors, web vitals, `api_request_failed`), the `observability` values per environment (D2 table), the privacy rules (D9), the same-origin header rule (D6), the `--define` version (D8), how to turn Faro off locally, and the local check steps (M2, M3, M5). Depends on 1.2.

## 4. Wave 4 — Checks

- [ ] 4.1 `npx eslint` on every file created or changed in `src/`. Result: 0 errors in the new files, no new error in `error.interceptor.ts` (report any old `prefer-inject` error as old). Depends on 3.1, 3.2.
- [ ] 4.2 [leader] Run V1, V2, V3, V4, V5a and V5b of design.md. Record the complexity result of the project's check for `FaroReporterService`, `scrubTransportItem` and its helpers. Depends on 1.1, 4.1.
- [ ] 4.3 [user] Run M1 to M8 of design.md and report the results, including whether `api_request_failed` has a `trace` field (M5). Depends on 4.2 and on the local stack (Alloy) running.

Size estimate: 14 files, ~1000 changed lines (tests and docs included; about 550 of them are in `package-lock.json`)
