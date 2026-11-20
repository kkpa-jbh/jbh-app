## ADDED Requirements

### Requirement: Observability configuration and switch
Each environment file (`environment.ts`, `environment.prod.ts`, `environment.stg.ts`) SHALL have an `observability` block with `enabled`, `collectorUrl`, `appName` and `environment`. `appName` SHALL be `jbh-web`. `environment` SHALL be `local` for `environment.ts` and `prod` for `environment.prod.ts`. `environment.prod.ts` and `environment.stg.ts` SHALL have `enabled: false`. When `enabled` is `false`, the app SHALL NOT call `initializeFaro`, SHALL NOT send any network request to a collector, and SHALL NOT patch `fetch` or `XMLHttpRequest`.

#### Scenario: Prod build with Faro off
- **WHEN** the app is built with `--configuration production` and started in a browser
- **THEN** `window.faro` is undefined, `XMLHttpRequest.prototype.open` and `fetch` are the native functions, and no request goes to a `/collect` URL

#### Scenario: Local build with Faro on
- **WHEN** the app runs with `ionic serve` and `environment.observability.enabled` is `true`
- **THEN** Faro starts and sends batches to `http://localhost:12347/collect`

### Requirement: Faro starts before the first HTTP call
The app SHALL call the Faro init in `src/main.ts` before `bootstrapApplication`, in the same synchronous run. The init SHALL use `getWebInstrumentations` with `captureConsole: false` and `TracingInstrumentation`. It SHALL set the Faro app fields `name` to `observability.appName`, `namespace` to `jbh`, `environment` to `observability.environment` and `version` to the app version.

#### Scenario: Init order
- **WHEN** the app starts with Faro on
- **THEN** `initializeFaro` has returned before the first Angular `HttpClient` request is sent, so that request has a `traceparent` header

#### Scenario: Console capture off
- **WHEN** app code calls `console.log` or `console.error` with Faro on
- **THEN** Faro sends no log event for that call

### Requirement: Trace header only to the same origin
`TracingInstrumentation` SHALL be configured with `propagateTraceHeaderCorsUrls: []`. The app SHALL NOT add custom trace propagation code. A `traceparent` header SHALL be sent only on requests to the app's own origin. Faro's own requests to the collector SHALL NOT be traced.

#### Scenario: API call
- **WHEN** the app calls `/jbh-api/products`
- **THEN** the request has a `traceparent` header

#### Scenario: Other host
- **WHEN** the browser sends a request to Google or any other origin that is not the app's origin
- **THEN** that request has no `traceparent` header

#### Scenario: Collector request
- **WHEN** Faro sends a batch to the collector URL
- **THEN** that request has no `traceparent` header, and no span is created for it

### Requirement: No query string, fragment or user data in Faro events
A `beforeSend` hook SHALL clean every Faro event of every type (trace, exception, event, measurement, log), including its `meta`. It SHALL remove the query string and the fragment from every absolute URL found in any string value, and from the values of the keys `url`, `url.full`, `http.url`, `http.target` and `name`. It SHALL drop the values of the keys `url.query` and `http.query`. If the hook fails, it SHALL drop the event. The app SHALL NOT call `setUser`, and SHALL NOT put an email, a name, a user id, a token or an `Authorization` value in any Faro event.

#### Scenario: Page URL with a query
- **WHEN** the browser is on `/auth/reset?token=abc#top` and Faro sends an event
- **THEN** `meta.page.url` in the event is the page URL without `?token=abc` and without `#top`

#### Scenario: Span attributes
- **WHEN** the app calls `/jbh-api/products?name=secret` and Faro sends the span of that call
- **THEN** the span attributes `http.url` and `url.full` have no `?name=secret`, and no attribute value contains `secret`

#### Scenario: Error message with a URL
- **WHEN** an exception has the message `Http failure response for http://host/jbh-api/x?y=secret: 500`
- **THEN** the sent exception message is `Http failure response for http://host/jbh-api/x: 500`

#### Scenario: Hook failure
- **WHEN** the cleaning code throws for an event
- **THEN** the event is not sent

#### Scenario: No user
- **WHEN** Faro sends any event
- **THEN** `meta.user` has no `id`, `email`, `username` or `fullName`

### Requirement: Angular errors reach Faro and the console
The app SHALL provide an Angular `ErrorHandler` that reports the error to Faro with `pushError` and then calls Angular's default `ErrorHandler`, so the error still shows in the browser console as before. A value that is not an `Error` SHALL be reported as a new `Error` with a fixed message and no copy of the value. A `JBHError` SHALL NOT be reported by this handler. The handler SHALL NOT throw.

#### Scenario: Unhandled error
- **WHEN** code inside the Angular zone throws `new Error('boom')` and nobody catches it
- **THEN** Faro gets one exception with the message `boom`, and the browser console shows the same error line as before this change

#### Scenario: Faro off
- **WHEN** `observability.enabled` is `false` and an error is unhandled
- **THEN** the console shows the error as before and no Faro call is made

#### Scenario: HTTP error that reached the handler
- **WHEN** an unhandled `JBHError` reaches the handler
- **THEN** it goes to Angular's default handler only

### Requirement: Failed API calls are reported without sensitive data
`ErrorInterceptor` SHALL report a failed API call to Faro as the event `api_request_failed` with the attributes `status`, `method` and `path_template`. It SHALL report a call when the status is `0` or at least `400`, except `401` and `422`. `path_template` SHALL be the request path without query string and fragment, with each numeric segment and each UUID segment replaced by `{id}`. The event SHALL NOT contain the response body, the request body, a header, a token or the query string. The Faro report SHALL NOT change the error that the interceptor returns to the caller.

#### Scenario: Server error
- **WHEN** `GET /jbh-api/products/123e4567-e89b-12d3-a456-426614174000?x=1` answers `500`
- **THEN** Faro gets `api_request_failed` with `status=500`, `method=GET`, `path_template=/jbh-api/products/{id}`

#### Scenario: Network failure
- **WHEN** `POST /jbh-api/movements/42` fails with status `0`
- **THEN** Faro gets `api_request_failed` with `status=0`, `method=POST`, `path_template=/jbh-api/movements/{id}`

#### Scenario: Expected statuses
- **WHEN** a call answers `401` or `422`
- **THEN** no `api_request_failed` event is created

#### Scenario: Caller result
- **WHEN** a call answers `500` and the report runs
- **THEN** the caller still gets a `JBHError` with status `500`, the same as before this change

### Requirement: Faro fails safe
A down, slow or unreachable collector SHALL NOT break the app. Faro's internal logger SHALL be off (`InternalLoggerLevel.OFF`). The app code that calls Faro SHALL catch every error and SHALL NOT throw. If the Faro init throws, the app SHALL continue to start.

#### Scenario: Collector down
- **WHEN** Faro is on and the collector does not answer
- **THEN** the app works as usual and Faro writes no line to the console

#### Scenario: Init failure
- **WHEN** `initializeFaro` throws
- **THEN** `bootstrapApplication` still runs and the app starts

### Requirement: App version from the git SHA
The Faro `app.version` SHALL be the value of the build constant `JBH_GIT_SHA`, or `dev` when the constant is not defined. The `Build app` step of `.github/workflows/image.yml` SHALL pass `GITHUB_SHA` with `--define`, and SHALL have a comment that says what the step does and why.

#### Scenario: CI build
- **WHEN** the workflow builds on commit `abc123`
- **THEN** the built bundle has the version `abc123` and Faro sends `app.version=abc123`

#### Scenario: Local build
- **WHEN** the app runs with `ionic serve`
- **THEN** Faro sends `app.version=dev`

### Requirement: Observability documentation
`.claude/CLAUDE.md` SHALL have an "Observability" section with the signals Faro sends, the `observability` config values per environment, the privacy rules, and the steps to check Faro locally.

#### Scenario: Developer reads the docs
- **WHEN** a developer opens `.claude/CLAUDE.md`
- **THEN** the "Observability" section lists signals, config values and local check steps
