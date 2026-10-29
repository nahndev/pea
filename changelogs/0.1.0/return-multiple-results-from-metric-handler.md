# Return multiple results from metric handler

## Currently

- A metric handler ([metric-handler.types.ts](../../apps/api/src/modules/metrics/handlers/metric-handler.types.ts)) has `handle(metric, context, analysisResultId): Promise<number | null>`, so it returns at most one value per metric and file.
- [metrics.service.ts](../../apps/api/src/modules/metrics/metrics.service.ts) stores that value as a single `MetricResult`, and `MetricResult` is unique per `(analysisResultId, analysisContextId, metricId)` in [schema.prisma](../../apps/api/prisma/schema.prisma).
- Both handlers ([percentile.handler.ts](../../apps/api/src/modules/metrics/handlers/percentile.handler.ts), [issue-count.handler.ts](../../apps/api/src/modules/metrics/handlers/issue-count.handler.ts)) therefore reduce a whole file to one number; a metric cannot be measured per endpoint, per route or per other dimension.
- Quality gate conditions are evaluated against each `MetricResult`, so they can only check that one value.
- Goal: let a metric handler return multiple results for one metric and file (e.g. one per endpoint), each stored and evaluated against the metric conditions.

## Acceptance Criteria

- [x] Handle of MetricCondition should return multiple results
- [x] Each result is stored separately and evaluated against the quality gate conditions
- [x] Existing metrics keep returning exactly one result

## Solutions

- [x] Update all handlers
- [x] Update behaviors
- [x] Add `subject` to `MetricResult` (migration `20261029010000_add_metric_result_subject`)
- [x] Add `ENDPOINT_P95`, a metric that returns one result per endpoint
