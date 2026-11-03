# Improve metrics page UI and add metric detail page

## Currently

- [metrics/page.tsx](../../apps/web/src/app/metrics/page.tsx) renders `PageHeader` + `SchemaTabs` + [metric-list-view.tsx](../../apps/web/src/modules/metrics/components/metric-list-view.tsx): a plain table with `Metric` (link), `Description`, `Unit`, `Status`. It has no search/filter (by status, unit), no count, and doesn't show conditions, subject scope (`include` / `exclude`) or the latest measured value.
- [metrics/[id]/page.tsx](../../apps/web/src/app/metrics/[id]/page.tsx) renders [metric-detail-view.tsx](../../apps/web/src/modules/metrics/components/metric-detail-view.tsx), which is only an edit page: header (schema · type · unit) + [metric-form.tsx](../../apps/web/src/modules/metrics/components/metric-form.tsx) (active checkbox, description, include/exclude subjects).
- The detail page shows nothing about the metric itself: no recent results, no trend over analyses, no linked condition (`Condition` is unique per `metric_id`), no subjects it was measured on.
- The API `metrics` module ([metrics.controller.ts](../../apps/api/src/modules/metrics/metrics.controller.ts)) only has `GET /metrics`, `GET /metrics/:id`, `GET /metrics/:id/subjects`, `PATCH /metrics/:id`. Results can be read per analysis (`GET /analyses/:id/metrics`) or as a branch trend (`GET /branches/:id/metrics/trend`), never per metric, even though `metric_results` is indexed by `(metric_id, created_at DESC)`.
- Reusable pieces exist in the module: `MetricSummaryCards`, `MetricResultsTable`, `TrendChartBySchema` / per-schema trend charts, `formatMetricValue`, `metricSeriesKey`.
- The rules module already has a list → detail flow ([rule-detail-view.tsx](../../apps/web/src/modules/rules/components/rule-detail-view.tsx)) that the metrics pages could follow for consistency.

## Acceptance Criteria

- [x] metrics list page add overflow for text
- [x] Add metric detail page

## Solutions

- [x] API `GET /metrics/:id/results?limit&offset` → `Paginated<MetricHistoryItemView>` (value, subject, analysis + branch, evaluations), newest first; `METRIC_NOT_FOUND` for an unknown metric
- [x] Web list: `table-fixed`, metric name and description truncated with a `title` tooltip
- [x] Web detail `/metrics/:id?page=`: overview cards (status, unit, scope, result count), paginated results table linking to the analysis and branch, settings form below
