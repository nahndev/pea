# Add new schema: `Frontend performance`

## Currently

- `AnalysisSchema` in [analysis-schema.constants.ts](../../packages/constants/src/analysis-schema.constants.ts) has `API`, `QUERY`, `BUG` and `DATABASE`; there is no schema for frontend performance (page load, Web Vitals, ...).
- `Analysis`, `Rule`, `Metric` and `MetricCondition` in [schema.prisma](../../apps/api/prisma/schema.prisma) store `schema` as a `VarChar(20)`, so a new value needs no column change. [create-analysis.dto.ts](../../apps/api/src/modules/analyses/dto/create-analysis.dto.ts) validates with `Object.values(AnalysisSchema)`.
- Log-based schemas upload a file: API maps each schema to a field in `LOG_FILE_FIELD_BY_SCHEMA` ([analyses.constants.ts](../../apps/api/src/modules/analyses/analyses.constants.ts)), web to `API_METRIC_FILE_FIELD` / `BUG_LOG_FILE_FIELD` ([analyses.constants.ts](../../apps/web/src/modules/analyses/analyses.constants.ts)). No frontend log format is defined yet (existing formats: [api_metric.md](../../docs/api_metric.md), [bug_log.md](../../docs/bug_log.md)).
- Rule handlers ([rules/handlers/](../../apps/api/src/modules/rules/handlers/)) and metric handlers ([metrics/handlers/](../../apps/api/src/modules/metrics/handlers/)) are grouped per schema (`api`, `bug`, `database`); [seed.ts](../../apps/api/prisma/seed.ts) seeds rules/metrics/conditions per schema. Nothing exists for frontend.
- Add-ons ([add-ons.types.ts](../../apps/api/src/modules/add-ons/add-ons.types.ts)) declare `LogAnalysisSchema` (every schema except `DATABASE`), so a new log schema becomes a valid add-on target automatically.
- Web maps every schema to a label ([analysis-schema.constants.ts](../../apps/web/src/shared/lib/analysis-schema.constants.ts)), a trend chart ([trend-chart.factory.tsx](../../apps/web/src/modules/metrics/components/trend-chart.factory.tsx)) and a branch schema page ([branch-schema-page.factory.tsx](../../apps/web/src/modules/branches/components/schema-pages/branch-schema-page.factory.tsx)). These are `Record<AnalysisSchema, …>`, so the build fails until the new schema is added there.

## Acceptance Criteria

- [x] Add new type `frontend performance` for project (like API, QUERY, BUG, DATABASE)
- [x] Analysis base on:

```json
{"message":"page-load","context":{"metric":{"name":"page-load","source":"route","route":"/synthese/:id?","previousRoute":null,"status":"settled","detail":{"addedNodes":1825,"longFrameCount":9,"longFrameDuration":3554,"requestCount":58,"requestDuration":29880,"slowRequests":[]},"startTime":0,"visibleDuration":3729,"duration":12183},"batch":{"sessionId":"01a1e254-a8e3-77bd-91c8-47259497b94a","sentAt":"2026-11-16T10:09:36Z","tid":"33c1bde5-2fab-4c17-9689-8556bf4058e7","aid":"de6aa4a3-2abc-427d-a560-5202b1ca79d7"}},"level":200,"level_name":"INFO","channel":"frontend_performance","datetime":"2026-11-16T03:09:36.343397+00:00","extra":{}}
{"message":"page-load","context":{"metric":{"name":"page-load","source":"route","route":"/synthese/:id?","previousRoute":null,"status":"settled","detail":{"addedNodes":1067,"longFrameCount":8,"longFrameDuration":3104,"requestCount":53,"requestDuration":31326,"slowRequests":[]},"startTime":0,"visibleDuration":2301,"duration":9996},"batch":{"sessionId":"01a1e255-7978-7596-a970-72e26f13951d","sentAt":"2026-11-16T10:10:28Z","tid":"33c1bde5-2fab-4c17-9689-8556bf4058e7","aid":"de6aa4a3-2abc-427d-a560-5202b1ca79d7"}},"level":200,"level_name":"INFO","channel":"frontend_performance","datetime":"2026-11-16T03:10:28.924714+00:00","extra":{}}
{"message":"page-load","context":{"metric":{"name":"page-load","source":"route","route":"/tableau/:id","previousRoute":"/synthese/:id?","status":"aborted","detail":{"addedNodes":1687,"longFrameCount":2,"longFrameDuration":448,"requestCount":9,"requestDuration":5358,"slowRequests":[]},"startTime":24458,"visibleDuration":273,"duration":2129},"batch":{"sessionId":"01a1e255-7978-7596-a970-72e26f13951d","sentAt":"2026-11-16T10:10:46Z","tid":"33c1bde5-2fab-4c17-9689-8556bf4058e7","aid":"de6aa4a3-2abc-427d-a560-5202b1ca79d7"}},"level":200,"level_name":"INFO","channel":"frontend_performance","datetime":"2026-11-16T03:10:46.564728+00:00","extra":{}}
{"message":"page-load","context":{"metric":{"name":"page-load","source":"route","route":"/groupe","previousRoute":"/tableau/:id","status":"settled","detail":{"addedNodes":616,"longFrameCount":2,"longFrameDuration":116,"requestCount":2,"requestDuration":600,"slowRequests":[]},"startTime":26588,"visibleDuration":66,"duration":1012},"batch":{"sessionId":"01a1e255-7978-7596-a970-72e26f13951d","sentAt":"2026-11-16T10:10:46Z","tid":"33c1bde5-2fab-4c17-9689-8556bf4058e7","aid":"de6aa4a3-2abc-427d-a560-5202b1ca79d7"}},"level":200,"level_name":"INFO","channel":"frontend_performance","datetime":"2026-11-16T03:10:46.564901+00:00","extra":{}}

```

- [x] Add some metric
- [x] Add P90, P50, P95, ...

## Solutions

- [x] New schema `FRONTEND` (label "Frontend performance", branch tab `/branches/:id/frontend`) and subject `PAGE` (a route); `schema` stays a `VarChar(20)`, so no migration
- [x] New `frontend_metric` NDJSON format ([frontend_metric.md](../../docs/frontend_metric.md)): one page load per line with the flat keys of `context.metric` (`route`, `status`, `duration`, `visibleDuration`, `requestCount`, `longFrameDuration`…); read by `frontendPageLoads` through DuckDB. Aborted loads count as loads but their durations are ignored, so they don't lower percentiles
- [x] Upload: `POST /analyses` takes `frontend_metric` for `FRONTEND` (`LOG_FILE_FIELD_BY_SCHEMA`), stored in `ApiAnalysisData`; web form shows a **Frontend metric log** input
- [x] Leaneo add-on converter `frontend-performance` turns the Monolog `frontend_performance.log` above into `frontend_metric`, dropping `context.batch` ids and `slowRequests` urls ([add-ons.md](../../docs/add-ons.md))
- [x] Metrics: `P50`, `P90`, `P95` page load duration (`PercentileHandler` now reads the page loads for `FRONTEND` via `logDurations`), `PAGE_P95` per page, `VISIBLE_P95`, `LONG_FRAME_P95`, `REQUEST_COUNT_P95`, `PAGE_LOAD_COUNT`, `ABORTED_PAGE_LOAD_RATE`, plus the issue counts; trend defaults to P50 / P90 / P95
- [x] Rules: `P50_FAILURE` (3000 ms) and `P95_FAILURE` (10000 ms) reuse `LatencyHandler`; per-page rules in `PageRuleHandler`, new config fields `minLoads`, `maxRequests` ([rules.md](../../docs/rules.md)):

  | Rule | Violation when | Seed |
  | --- | --- | --- |
  | `SLOW_PAGE` | page P95 load > `thresholdMs` | medium, 5000 ms, 5 loads |
  | `SLOW_VISIBLE_PAGE` | page P95 time to visible > `thresholdMs` | medium, 2500 ms, 5 loads |
  | `LONG_FRAME_PAGE` | page P95 long frame time > `thresholdMs` | low, 1000 ms, 5 loads |
  | `CHATTY_PAGE` | page P95 requests per load > `maxRequests` | low, 50, 5 loads |
  | `ABORTED_PAGE` | aborted share > `maxPercent` | low, 30 %, 5 loads |

- [x] Seeded conditions for `FRONTEND`: P95 > 10000 ms, blocker issues > 0, high issues > 0
- [x] Checked on the 4 sample lines: 4 converted, 0 skipped; P50 9996 ms, P95 11964 ms, 25 % aborted
