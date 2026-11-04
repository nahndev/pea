# Implement the BUG schema

## Currently

- `BUG` is declared in `AnalysisSchema` ([analysis-schema.constants.ts](../../packages/constants/src/analysis-schema.constants.ts)) but nothing analyses it:
  - No `RuleType`, `MetricType` or `SubjectType` belongs to it, and the seed creates no `BUG` rule or metric ([seed.ts](../../apps/api/prisma/seed.ts)), so `listBySchema(BUG)` and the active metrics of a `BUG` analysis are empty: the result has no issue and no metric.
  - Rule and metric handlers exist only for `api/` and `database/` ([rules/handlers](../../apps/api/src/modules/rules/handlers), [metrics/handlers](../../apps/api/src/modules/metrics/handlers)).
- Creating a `BUG` analysis takes the same path as `API`/`QUERY` ([analyses.service.ts](../../apps/api/src/modules/analyses/analyses.service.ts)):
  - the upload field is `api_metric` ("API metric log", hint `{"method","route","status","ms"}`, [analyses.constants.ts](../../apps/web/src/modules/analyses/analyses.constants.ts));
  - the file is stored in `ApiAnalysisData` ([schema.prisma](../../apps/api/prisma/schema.prisma));
  - the context is `ApiAnalysisContext` with a `logPath` ([analysis-context.factory.ts](../../apps/api/src/modules/analyses/analysis-context.factory.ts), [analyses.types.ts](../../apps/api/src/modules/analyses/analyses.types.ts)).
  - `apiMetricRequests` ([api-metric-requests.ts](../../apps/api/src/modules/files/api-metric-requests.ts)) is the only log reader and it expects `api_metric` lines (`ms` required). No format is defined for a bug/error log; [docs](../../docs) only has `api_metric.md`.
- Web already has the `BUG` pieces, but they show placeholders:
  - a "Bug" tab and [bug-schema-page.tsx](../../apps/web/src/modules/branches/components/schema-pages/bug-schema-page.tsx) with the analysis list;
  - [bug-trend-chart.tsx](../../apps/web/src/modules/metrics/components/bug-trend-chart.tsx) with the placeholder `defaultMetrics="The default metrics"`;
  - "Bug" in the schema select of the new analysis form.
- Source data: the Leaneo `exceptions.log` (Monolog NDJSON, 4719 lines over 2026-11-02 → 03, `ERROR` 2069 / `CRITICAL` 2650). Each line has `message`, `context`, `level`, `level_name`, `channel` (`app`, `request`, `mobile_diagnostic`, `sms`, `console`), `datetime` and `extra`.
  - `API exception` (2120): `context.api` (path), `platform`, `IP`. Mostly bots probing `/.env*`, `/favicon.ico` and `/contact-email-sent`.
  - `Uncaught PHP Exception …` (about 1900): `context.exception` has `class`, `message`, `code` and `file:line`, plus a `trace`.
    - `NotFoundHttpException` (1581, only 25 of them name the URL in "No route found for …")
    - captcha `Exception` (290)
    - `TooManyRequestsHttpException` (25)
    - `AccessDeniedHttpException`, `ValidationException`, `ClientException` 403, `DeadlockException` and others
  - `PDF Generate Api Convert` / `PDF Api Convert Duration` (117 each): timeout calling `localhost:8091/convert` and the duration in seconds.
  - Mobile diagnostics (`forced_logout_4`, `main:uncaught`…): `context.event` and `batch`; the user id and email are in `message`.
  - `Captcha debug`, `Invalid SMS request`: form data only.
- The file is full of personal data that must not be stored (email, phone, IP, user, form content), and messages embed ids and emails, so the same error appears with different texts.
- It cannot enrich `api_metric`:
  - it has no duration;
  - most lines have no method or route;
  - only 9 of the 2120 `API exception` lines match a `slow_api.log` line by URL and time.
- The conversion pattern already exists: the `LeaneoSlowApiConvert` add-on ([leaneo-slow-api-convert](../../apps/api/src/modules/add-ons/leaneo-slow-api-convert), [add-ons.md](../../docs/add-ons.md)) turns a raw Leaneo log into an uploadable NDJSON file.

## Acceptance Criteria

- [x] Implement CreationBugAnalysisDialog
- [x] Implement rules
- [x] Implement metrics

## Solutions

- [x] New `bug_log` NDJSON format ([bug_log.md](../../docs/bug_log.md)): `type` (required), `level`, `message`, `location`, `method`, `route`, `status`, `channel`, `ts`; read by `bugLogEvents` through DuckDB. An error (subject `ERROR`, new) is `<type> at <location>`
- [x] Creation: the new analysis form shows a **Bug log** file input (`bug_log`) for `BUG` (`LogFileInput`, also used for the API metric log); `POST /analyses` takes `api_metric` or `bug_log` by schema (`LOG_FILE_FIELD_BY_SCHEMA`), still stored in `ApiAnalysisData`, so no migration
- [x] `LeaneoExceptionsConvert` add-on (`/add-ons/leaneo-exceptions-convert`) converts a Monolog `exceptions.log` to `bug_log.log` and drops personal data: only the exception class, normalised message, first `src/` frame, route and status are kept ([add-ons.md](../../docs/add-ons.md))
- [x] Rules ([rules/handlers/bug/](../../apps/api/src/modules/rules/handlers/bug/)), new config field `minCount`, at most 100 issues each (`MAX_BUG_ISSUES`):

  | Rule | Violation when | Subject | Seed |
  | --- | --- | --- | --- |
  | `CRITICAL_ERROR` | ≥ `minCount` events at `CRITICAL` / `ALERT` / `EMERGENCY` | `ERROR` | high, `1` |
  | `FREQUENT_ERROR` | ≥ `minCount` events, any level | `ERROR` | medium, `100` |
  | `ERROR_ENDPOINT` | ≥ `minCount` events on one endpoint | `API` | low, `20` |

- [x] Metrics ([metrics/handlers/bug/](../../apps/api/src/modules/metrics/handlers/bug/)): `ERROR_COUNT`, `CRITICAL_ERROR_COUNT`, `ERROR_GROUP_COUNT` and `ERROR_OCCURRENCES` (50 most frequent errors), plus the issue counts; bug trend defaults to errors, critical errors and distinct errors
- [x] Seeded conditions for `BUG`: critical errors > 0, blocker issues > 0
- [x] Web: rule labels and config forms, metric labels
- [x] Checked on the 2026-11-02 `exceptions.log`: 4719 lines converted, 0 skipped, no email or IP left; the analysis finds 26 distinct errors, 2650 critical events and 20 issues
