## Context

Ticket plan JBH-55, section 7 (sub-issue JBH-83). Faro (`@grafana/faro-web-sdk` + `@grafana/faro-web-tracing`) sends browser traces, errors and web vitals to a collector. Local collector: Alloy `faro.receiver` at `http://localhost:12347/collect` (already merged in `jbh-deploy`, CORS allows `http://localhost:8100`). Prod collector: Grafana Cloud, but prod stays off until JBH-84.

Facts checked in the Faro 2.14.0 source and types (read from the npm package, not from memory):

- `faro` is exported with a no-op `api` until `initializeFaro` runs. Calling `faro.api.pushError` before init does nothing.
- `getWebInstrumentations({ captureConsole: false })` removes the console instrumentation.
- `TracingInstrumentation({ instrumentationOptions: { propagateTraceHeaderCorsUrls } })` is the only place that sets which cross-origin hosts get `traceparent`. Same-origin requests always get it (OpenTelemetry fetch and XHR instrumentation).
- Faro builds the tracing `ignoreUrls` from the transports' URLs, so the collector URL is never traced. `ignoreUrls` cannot be overridden in `instrumentationOptions`.
- `beforeSend` is a hook `(item) => item | null`. Spans go through `api.pushTraces` -> `transports.execute` -> the same hooks. So one hook sees all item types: `trace`, `exception`, `event`, `measurement`, `log`. No OpenTelemetry span processor is needed. Span attributes arrive in OTLP shape: `{ key: 'http.url', value: { stringValue: '...' } }`.
- `faro.api.pushEvent(name, attributes, domain)` adds the active trace context by itself when a span is active. Attribute values must be strings.
- `internalLoggerLevel: InternalLoggerLevel.OFF` silences Faro's own log lines. `batching.sendTimeout` sets the flush interval. Batches also flush on `visibilitychange` and `pagehide`.
- Angular `ErrorHandler` catches errors inside the zone, so Faro's global `error` listener does not see them. The handler is needed.
- Angular `HttpClient` here uses the XHR backend (`provideHttpClient(withInterceptorsFromDi())`, no `withFetch`). The XHR instrumentation patches `XMLHttpRequest`, so Faro must start before the first request.
- `@angular-devkit/build-angular:application` (Angular 20.3) has the option `define`: "String values must be put in quotes" (read in `@angular/build` `schema.json`). CLI form: `--define KEY=VALUE`.

There is no `Content-Security-Policy` in `src/index.html`, `deploy/Caddyfile` or `../jbh-deploy/jbh.caddy` (leader checked). See D14.

## Goals / Non-Goals

**Goals:** browser traces linked to the gateway trace, JavaScript errors, web vitals and failed API calls in Grafana; no personal data; Faro fully off when `enabled: false`; Faro never breaks the app.

**Non-Goals:** see "Not included".

## Decisions

### D1: Pinned versions

Both packages at exact `2.14.0` (the current version, `npm view` on 2026-11-19; both packages share the number). `package.json` has `"2.14.0"` with no `^` or `~`. The leader runs `npm install --save-exact @grafana/faro-web-sdk@2.14.0 @grafana/faro-web-tracing@2.14.0` so the lock file matches. Why exact: the OpenTelemetry packages under Faro change often, and an unplanned minor version could change what the SDK sends.

### D2: Environment block and values

Every environment file gets the same shape:

```ts
observability: {
  enabled: boolean,
  collectorUrl: string,
  appName: 'jbh-web',
  environment: string
}
```

| File | enabled | collectorUrl | environment |
|---|---|---|---|
| `environment.ts` (local) | `true` | `http://localhost:12347/collect` | `local` |
| `environment.prod.ts` | `false` | `https://faro-collector-prod-sa-east-1.grafana.net/collect/8f35433c4b772e526d0ec81d2532faf3` | `prod` |
| `environment.stg.ts` | `false` | `''` | `stg` |

- `local` and `prod` are the same names as the backend `deployment.environment.name`.
- The prod URL is public by design (it ships in the bundle), so it is committed. Prod `enabled` flips to `true` in JBH-84, not here.
- Staging: `enabled: false` with an empty URL. No staging collector exists, and `environment.stg.ts` still points at a placeholder API (`stg-api.yourdomain.com`), so the staging build is not a real target. An empty URL cannot send data by mistake. A real staging collector is a later decision.
- The existing `environmentName` (`production`, `staging`) and `appVersion` (`1.0.0`) fields are not changed. The Faro names are separate on purpose, so no other code is affected.
- Local is `true` because the point of the local stack is to see browser traces. A developer without Alloy sets it to `false` (see D11 for what they see otherwise).

### D3: Disabled means off

`initFaro()` starts with `if (!environment.observability.enabled) { return; }`. It is the only caller of `initializeFaro` in the code base, and the guard comes before any other Faro call. Instrumentations patch `fetch` and `XMLHttpRequest` only inside `initializeFaro` (their `initialize()` runs there), so no patch, no request. The `FaroReporterService` has the same guard, so a disabled app makes no Faro call at all.

Cost: the Faro and OpenTelemetry code is still in the bundle (static import) and the app pays its download size. A lazy `import()` would remove that cost, but it would make the start asynchronous and break D4. The production budget (2 MB warning for the initial bundle) must be checked by the leader's build.

Rejected: removing the code with a build-time constant per environment. It would add a second switch to keep in line with `enabled`.

### D4: Init in `main.ts`, synchronous, before bootstrap

`src/main.ts` calls `initFaro()` as its first statement after the imports, before `bootstrapApplication`. `main.ts` is a named exception in the boundary rules and already imports from `core/infrastructure`. Why not `APP_INITIALIZER`: it runs during bootstrap, and `TranslateHttpLoader` may already request `assets/i18n/*.json` by then. That request would have no `traceparent` and no span. Calling it first means every request, including the first one, is instrumented. `initFaro()` is in `src/app/core/infrastructure/observability/faro.init.ts` (the single init file asked by the ticket).

`initFaro()` wraps the Faro call in `try/catch`. On failure it writes one line with `LoggerService` (`new LoggerService()` is safe: the service has no dependencies) and returns, so the app still starts.

### D5: Instrumentations

```ts
instrumentations: [
  ...getWebInstrumentations({ captureConsole: false }),
  new TracingInstrumentation({
    instrumentationOptions: { propagateTraceHeaderCorsUrls: [] }
  })
]
```

All other default instrumentations stay on: errors (`window.onerror` and unhandled rejections), web vitals, performance (resource and navigation timings), session, view, navigation, frustration, user actions and CSP. They only send tag names and timings, and the hook in D9 cleans their URLs. I checked the frustration instrumentation: it sends `target` as the tag name, not the element text.

### D6: Trace header to the same origin only (user decision)

The user decided: `traceparent` goes to the same origin only. Faro does this by default for same-origin requests (`/jbh-api` and same-origin static files such as `assets/i18n/en.json`). The app sets `propagateTraceHeaderCorsUrls: []` explicitly, so no code or later change adds a host by accident. No custom propagation code. The Google sign-in script and any other cross-origin host get no header. The done-check is "no `traceparent` header to any other host".

Side effect that the user accepted: same-origin static files also get spans and a header. This adds a few spans per page load.

### D7: The collector is not traced

Faro adds the transport URL to the tracing `ignoreUrls` (checked in `TracingInstrumentation.getIgnoreUrls`). No code needed. Without it, every batch would create a span, and that span would create another batch.

### D8: App version from the git SHA (user decision)

- `.github/workflows/image.yml`, step `Build app`, becomes: `npx ng build --configuration production --define "JBH_GIT_SHA='$GITHUB_SHA'"`. The inner single quotes are required: the builder pastes the value into the code, and string values must be quoted. `GITHUB_SHA` is the same source the deploy step in that file uses. The comment block of the step gets two lines: what `--define` does and why the version is the SHA (same value as the image tag and the backend `service.version`).
- In `faro.init.ts`: `declare const JBH_GIT_SHA: string | undefined;` and `const version = typeof JBH_GIT_SHA === 'string' ? JBH_GIT_SHA : 'dev';`. The `typeof` form does not throw when the constant is missing (`ionic serve`, local builds).
- The `define` option works with `@angular-devkit/build-angular:application`, which uses the same esbuild builder as `@angular/build`. The leader's build check (V7) proves the replacement.
- Rejected: writing the SHA into `environment.prod.ts` in CI (it changes a tracked file during the build) and the existing `appVersion: '1.0.0'` (never updated).

### D9: Privacy: no console capture, strip queries, no user (user decision)

- Console capture is off (D5). The `ErrorHandler` (D10) reports errors.
- No `setUser`, no `metas` with user data. The IAM subject may be a username, which is personal data. The Faro session id is random and stays.
- A `beforeSend` hook `scrubTransportItem(item)` in `faro-privacy.ts` returns a **new** item (it never edits Faro's shared `meta` object) with `meta` and `payload` cleaned by a recursive walk:
  1. A string value: first, if its key is in `DROP_KEYS` (`url.query`, `http.query`) the value becomes `''`. Otherwise, if its key is in `CUT_KEYS` (`url`, `url.full`, `http.url`, `http.target`, `name`) the value is cut at the first `?` or `#`. Then `stripUrlQueries` runs on every string: it finds each `http://` or `https://` URL inside the text and removes `?...` and `#...` from it. This also cleans error messages, such as the Angular `Http failure response for http://host/x?y=1: 500`, and stack traces.
  2. An OTLP attribute `{ key, value: { stringValue } }` is cleaned with its `key`. For any other object, the key of each property is used.
  3. Arrays are mapped. Numbers, booleans and `null` pass unchanged.
- Fail closed: the hook runs in `try/catch` and returns `null` (drop the event) on any error. A missing event is better than a leaked query.
- The path (`/products/<uuid>`) is kept, except path segments that hold an email. `deleteMember` calls `teams/{teamId}/members/{email}`, so a segment with text on both sides of `@` or `%40` becomes `{id}`, in `toPathTemplate` and in every scrubbed string (review round 1, R1). The query and the fragment are removed (invitation tokens and similar).
- Not covered: free text in an error message that the app itself writes (for example, a validation text with a name). Mitigation: `JBHError` is not reported by the handler (D10), and the docs tell developers not to put personal data in error messages.

### D10: ErrorHandler, error interceptor and reporter

- `FaroErrorHandler implements ErrorHandler`. `handleError(error)`: (1) `reporter.reportError(error)`, (2) `this.fallback.handleError(error)`, where `fallback = new ErrorHandler()` is Angular's default implementation, which writes to the console. The order is report first, then fallback. If the report throws, `FaroReporterService` has already caught it, so the fallback always runs. It is provided in `main.ts` with `{ provide: ErrorHandler, useClass: FaroErrorHandler }`, also when Faro is off (the reporter does nothing then, and the console behaviour is the same as today). The new code does not call `console.*`: the console line comes from Angular's own handler (rule in `CLAUDE.md`).
- `FaroReporterService` (`providedIn: 'root'`, no dependencies) is the only code outside `faro.init.ts` that touches `faro`:
  - `reportError(error: unknown)`: does nothing when disabled or when `error instanceof JBHError` (the interceptor already reported API failures, and a `JBHError` message is a server text). A non-`Error` value is replaced with `new Error('Non-Error value thrown')`, so no object data is copied. Then `faro.api.pushError(err)`. Whole body in `try/catch`.
  - `reportApiFailure(request: HttpRequest<unknown>, status: number)`: does nothing when disabled or when `!isReportableStatus(status)`. Then `faro.api.pushEvent('api_request_failed', { status: String(status), method: request.method, path_template: toPathTemplate(request.url) }, 'api')`. `try/catch` around it.
  - `isReportableStatus(status)`: `status === 0 || (status >= 400 && status !== 401 && status !== 422)`. Why: `401` is the routine token refresh and `422` is normal form validation. Both would be noise. `403`, `404`, `5xx` and network failures (`0`) are signals.
- `ErrorInterceptor.intercept` gets one new line at the top of the `catchError` callback: `this.faroReporter.reportApiFailure(request, error.status);`, plus a lazy getter `faroReporter` that follows the file's existing `injector.get` pattern. `extractLocalizedMessage` (cyclomatic 11 today) is not touched. `intercept` does not get a new branch. The `422`, `401` and `403` paths and the returned `JBHError` do not change. Only the first failure of a request is reported (a request retried after a token refresh is not reported again; the retry runs inside `handle401Error`).
- **Trace id (limit):** the event does not pass a trace id by hand. `pushEvent` adds the active trace context by itself. In an `HttpClient` error callback there is usually no active span (the XHR span is closed), so `trace` may be missing on the event. The span of the same request is still sent by Faro with the same trace id and its status, and the event has the session id and a time stamp. The user checks this in V5. If the trace id is missing and the user wants it, a follow-up change can record the span context in the XHR `applyCustomAttributesOnSpan` hook.

### D11: Fail safe

- `internalLoggerLevel: InternalLoggerLevel.OFF`: Faro writes no line of its own, also when the collector is down.
- `batching: { enabled: true, sendTimeout: 5000, itemLimit: 50 }`: a batch goes out at most every 5 seconds, and only when it has data. The default is every 250 ms. Batches flush when the tab is hidden.
- Retries stay on (user decision after M7). Faro's `FetchTransport` tries a failed batch up to 3 times, after about 1 s and 2 s. So with the collector down, each batch gives up to 3 failed requests. M7 measured 21 in 56 s. The retries keep data when the prod collector has a short problem.
- Every call into Faro from app code is in `try/catch` (`initFaro`, reporter, hook).
- Limit: the browser itself prints a red `net::ERR_CONNECTION_REFUSED` line in DevTools for each failed batch. No code can hide it. Local developers without Alloy can set `enabled: false`; the docs say so.

### D12: No unit tests

User decision (ticket plan, 2026-11-15), and the repo forbids `spec.ts` outside `design-system/**` and `core/formatting/**`. `Test-First` is off. The checks are in "Verification contract".

### D13: Boundary

Faro is not Ionic, ionicons or ngx-charts, so `core/infrastructure` may import it (`.eslintrc.boundary.json` bans only `@ionic/*`, `ionicons` and `@swimlane/ngx-charts` in `src/**/*.ts`; it has no rule about `@grafana/*`). `core/infrastructure/observability/` imports `@environments/environment`, `@angular/core`, `@angular/common/http` (types) and `@core/domain/models/jbh-error.model` (the same import `error.interceptor.ts` already makes). Nothing in `core/domain`, `ui`, `shared` or `design-system` imports the new folder. `main.ts` and `ErrorInterceptor` do. No circular dependency.

### D14: CSP

There is no `Content-Security-Policy` in `src/index.html`, `deploy/Caddyfile` or `../jbh-deploy/jbh.caddy`. Nothing to change and `jbh-deploy` is not edited. If a CSP is added later, `connect-src` must allow the collector URL, or Faro requests are blocked silently.

### D15: Names of the browser app

`app.name = observability.appName` (`jbh-web`), `app.namespace = 'jbh'`, `app.environment = observability.environment`, `app.version` from D8. These become the resource attributes `service.name`, `service.namespace`, `deployment.environment.name` and `service.version`, the same names as the backend. Faro also writes the older `deployment.environment`; that is Faro's own and cannot be turned off.

## Verification contract

No unit tests. These are the checks and their expected results. The leader or the user runs them; the worker runs only ESLint.

**Static (leader, after the wave):**

| ID | Command | Expected |
|---|---|---|
| V1 | `npm run lint:boundary` | exit 0 |
| V2 | `npx eslint src/main.ts src/app/core/infrastructure/observability src/app/core/infrastructure/interceptors/error.interceptor.ts src/environments` | 0 errors in the new files. No `console.*` use (rule `no-console` if enabled) |
| V3 | `grep -rn "initializeFaro(" src/` | exactly 1 match, in `faro.init.ts`, after the `enabled` guard |
| V4 | `grep -rn "setUser\|propagateTraceHeaderCorsUrls" src/` | no `setUser`; exactly one `propagateTraceHeaderCorsUrls: []` |
| V5a | `npx ng build --configuration production --define "JBH_GIT_SHA='abc123'"` | build passes, no budget error; `grep -l abc123 www/*.js` finds the main bundle |
| V5b | `npx ng build --configuration production` | build passes (version falls back to `dev`) |

**Manual in the browser (user):**

| ID | Steps | Expected |
|---|---|---|
| M1 Faro off | Serve the prod build (`npx http-server www` or the Docker image). Open DevTools. In the console: `window.faro`, `fetch.toString()`, `XMLHttpRequest.prototype.open.toString()` | `window.faro` is `undefined`; both functions show `[native code]`; Network has no request with `collect` in the URL |
| M2 Header scope | Local stack running (Alloy up). `ionic serve`, open `http://localhost:8100`, sign in, open a page. In Network add the request header column `traceparent` (right-click the column header, Manage Header Columns) | every `/jbh-api/*` row has a `traceparent`; rows for `localhost:12347/collect` (including the `OPTIONS` preflight, whose `Access-Control-Request-Headers` has no `traceparent`) and any `google` host have none. Count of cross-origin rows with `traceparent`: 0 |
| M3 Query strip | Open `http://localhost:8100/?probe=SECRET1#frag1`, then trigger an API call. In Network, open a `collect` request and search its payload for `SECRET1` | 0 matches; `page.url` has no `?` and no `#` |
| M4 No personal data | Sign in with a test email. Search `collect` payloads for the email, `Authorization` and `Bearer` | 0 matches; the `meta` has no `user` object |
| M5 API failure | Stop the gateway, trigger an API call | an `api_request_failed` event with `status=0`, the `method` and a `path_template` such as `/jbh-api/products/{id}`; the app shows its usual error. Note if the event has a `trace` field (D10 limit) |
| M6 Error handler | Temporarily throw in a click handler (do not commit). Click it | one exception in Faro; the console still shows Angular's error line |
| M7 Collector down | Stop Alloy, use the app for a minute | the app works; no `[Faro]` line in the console; each batch (at most one every 5 s) gives at most 3 failed `collect` requests |
| M8 Version | In the `collect` payload, read `meta.app.version` | `dev` with `ionic serve`; the SHA for the CI image |

## Responsibilities

| File | Single job | Who asks for a change |
|---|---|---|
| `src/app/core/infrastructure/observability/faro.init.ts` (new) | Build the Faro config from `environment.observability` and call `initializeFaro` once, or do nothing when disabled | Observability owner (which instrumentations, batching, version source) |
| `src/app/core/infrastructure/observability/faro-privacy.ts` (new) | `beforeSend` hook: clean URLs in every event, fail closed | Privacy rules (a new key or event shape to clean) |
| `src/app/core/infrastructure/observability/faro-url.ts` (new) | Pure helpers: `stripUrlQueries(text)` and `toPathTemplate(url)` | Privacy rules, or a new id format in API paths |
| `src/app/core/infrastructure/observability/faro-reporter.service.ts` (new) | The only app-code door to `faro.api`: `reportError`, `reportApiFailure`; never throws | Which errors and which API statuses are reported |
| `src/app/core/infrastructure/observability/faro-error-handler.ts` (new) | Angular `ErrorHandler`: call the reporter, then Angular's default handler | Change of console behaviour for errors |
| `src/app/core/infrastructure/interceptors/error.interceptor.ts` (changed) | Gets one more call: hand the failed request to the reporter. Its job (map HTTP errors to `JBHError`) does not change | HTTP error mapping rules |
| `src/main.ts` (changed) | Call `initFaro()` before bootstrap; bind `ErrorHandler` to `FaroErrorHandler` | App wiring |
| `src/environments/environment.ts`, `environment.prod.ts`, `environment.stg.ts` (changed) | Hold the `observability` values per environment | JBH-84 (prod on), a new environment |
| `.github/workflows/image.yml` (changed) | Pass the git SHA to the build with `--define` | CI owner |
| `package.json`, `package-lock.json` (changed) | Pin the two Faro packages | Dependency upgrades |
| `.claude/CLAUDE.md` (changed) | "Observability" section: signals, values, local check | Docs owner |

`ErrorInterceptor` gets a second reason to change only by a single forwarding call. The reporting rules live in `FaroReporterService`, not in the interceptor.

## Concurrency

none.

Checked paths:

- **Init order.** `initFaro()` runs synchronously at the top of `main.ts`, before `bootstrapApplication`. JavaScript is single-threaded, so no HTTP call can start before it finishes. This is why D4 rejects `APP_INITIALIZER` (the translation loader could send a request first). No guard is needed.
- **Double init.** `main.ts` runs once per page load. Faro itself protects the patching of `fetch` and XHR with a single tracing owner on the global object, so a second call (for example by hot reload) only logs a warning inside Faro, which is silenced.
- **Reporter and hook.** They hold no state, and the hook builds new objects, so a handler that runs twice only sends two events (Faro `dedupe` removes equal ones).
- **Faro batching.** Done inside Faro with its own timer. The app shares no data with it.

## Risks / Trade-offs

- A Faro or OpenTelemetry upgrade may change the attribute names of spans. Mitigation: pinned version (D1), and the hook cleans by URL text too, not only by key.
- Bundle size grows, also with Faro off (D3). Mitigation: the leader's production build checks the budget.
- Trace id on `api_request_failed` is missing (D10). M5 confirmed it: the event is sent after the request ends, so no trace is active. The request's own span (`faro.tracing.xml-http-request`) has the `trace` field, with the same URL and almost the same time. Accepted.
- Free text inside app-written error messages is not cleaned (D9). Accepted; documented.

## Database

No database object is created or changed.

## Not included

- Turning Faro on in prod: JBH-84 (`environment.prod.ts` `enabled: true`, Grafana Cloud CORS check, alerts).
- Source maps upload for readable stack traces in Grafana.
- Unit tests (ticket plan decision; the repo rule bans them here).
- A staging collector and a real staging environment.
- Changes in `jbh-deploy` (Alloy config is merged; there is no CSP). The system map in `../jbh-deploy/README.md` may need a row for browser -> collector: the leader decides (separate commit in that repo).
- A user id in Faro, console capture, custom trace propagation to other hosts.
- Dashboards and alerts on Faro data (section 8 of the ticket plan).

## Open Questions

- `../jbh-deploy/README.md` system map: the browser now talks to a new target (the collector). Under the "System map sync" rule of `CLAUDE.md` the leader should decide if a row is added there, in a separate `jbh-deploy` commit.
