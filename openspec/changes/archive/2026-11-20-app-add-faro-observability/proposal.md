## Why

The JBH backend will send traces, metrics and logs to Grafana (ticket plan JBH-55). The browser is the missing part. Today nobody sees JavaScript errors, slow page loads or failed API calls from real users. A request that starts in the browser cannot be followed into the gateway and the services, because no `traceparent` header leaves the browser.

This change adds Grafana Faro to `jbh-app` (sub-issue JBH-83). Faro sends browser traces, errors and web vitals to the collector. Prod stays off until JBH-84 turns it on.

## What Changes

- Add the packages `@grafana/faro-web-sdk` and `@grafana/faro-web-tracing`, pinned to exact version `2.14.0`.
- Add an `observability` block to `src/environments/environment.ts`, `environment.prod.ts` and `environment.stg.ts`. Local is on. Prod and staging are `enabled: false`.
- Add the Faro init in `src/app/core/infrastructure/observability/`. `src/main.ts` calls it before `bootstrapApplication`. When `enabled` is `false`, Faro is not started at all.
- Send `traceparent` to the same origin only (`/jbh-api` and same-origin files). No other host gets it.
- Add an Angular `ErrorHandler` that reports to Faro and then does what Angular does today (console log).
- Make `ErrorInterceptor` report failed API calls: status, method and a path template. Never the body, the token or the query string.
- Remove query strings and fragments from every URL in every Faro event. Turn off Faro console capture. Set no user.
- Pass the git SHA as the app version with `ng build --define` in `.github/workflows/image.yml`. Fall back to `dev`.
- Add an "Observability" section to `.claude/CLAUDE.md`.

## Capabilities

### New Capabilities

- `frontend-observability`: browser traces, errors, API failure events and web vitals with Grafana Faro. It covers the on/off switch, trace header scope, privacy rules, error reporting and the app version.

### Modified Capabilities

None.

## Impact

- Code: `src/app/core/infrastructure/observability/` (new), `src/app/core/infrastructure/interceptors/error.interceptor.ts`, `src/main.ts`, `src/environments/*.ts`.
- Build: `package.json`, `package-lock.json`, `.github/workflows/image.yml`.
- Docs: `.claude/CLAUDE.md`.
- No database, no API change, no change in `jbh-deploy` (Alloy `faro.receiver` is already merged there; there is no CSP to change).
- The bundle grows by the Faro and OpenTelemetry code, also when Faro is off.
