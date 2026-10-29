# Support analysis schema in the schema

## Currently

- The previous ticket ([simplify-analysis.md](simplify-analysis.md)) dropped `AnalysisContext`: an `Analysis` in [schema.prisma](../../apps/api/prisma/schema.prisma) now has a single `file`/`path` and has no notion of what kind of log it is.
- `AnalysisContextType` (`API_METRIC`, `QUERY`) was removed, so nothing records the type; every rule and metric handler assumes the file is an API metric log (see [api_metric.md](../../docs/api_metric.md)).
- `POST /analyses` ([analyses.controller.ts](../../apps/api/src/modules/analyses/analyses.controller.ts)) only accepts the `api_metric` field, and the web form ([new-analysis-form.tsx](../../apps/web/src/modules/analyses/components/new-analysis-form.tsx)) offers a single "API metric log" upload.
- Other kinds of analysis are expected (for example `API`, `QUERY`, `BUG`), each with its own log format, rules and metrics, but the schema cannot tell them apart or route an analysis to the handlers that support it.

## Acceptance Criteria

- [x] Every analysis add `schema` record (as same `type` of analysis)
- [x] Add `schema` to other entities as `analysis`, `rule`, `condition`, `metric`
- [x] Analysis with `schema` A only run rules, condition, metric with `schema` A
- [x] Remove `quality-gate`, now `analysis` apply all `condition` base on `schema`.
- [x] Every `branch` include multiple `analysis`
- [x] Adjust `TrendChart` base on `schema` -> every `schema` create a `TrendChart` as `ApiTrendChart`, `QueryTrendChart`, ...
- [x] Update all endpoints
- [x] Branch details page (/branches/:id) -> Change into tabs with `schema`
