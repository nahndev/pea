# Improve analyses detail metric page

## Currently

- [analyses/[id]/metrics/page.tsx](../../apps/web/src/app/analyses/[id]/metrics/page.tsx) renders `AnalysisHeader` (from the layout) + [metrics-view.tsx](../../apps/web/src/modules/metrics/components/metrics-view.tsx): `MetricSummaryCards` → `TrendChartBySchema` → `Results` (`MetricResultsTable` + `PaginationBar`). The only query param is `page`.
- [metric-summary-cards.tsx](../../apps/web/src/modules/metrics/components/metric-summary-cards.tsx) only exists for API analyses: the API summarizes `SUMMARY_METRIC_TYPES` (`P50`, `P90`, `P95`) in [summarize-metrics.ts](../../apps/api/src/modules/metrics/summarize-metrics.ts), so a database analysis gets no cards. Values and thresholds use `formatDuration`, and `MetricSummaryView` has no `unit`.
- [metric-results-table.tsx](../../apps/web/src/modules/metrics/components/metric-results-table.tsx) is API-specific: the subject column is labelled `Endpoint` and an empty subject shows `All requests`, even for database analyses (tables, queries). `Unit` is a separate column next to `Value`, which `formatMetricValue` already formats.
- Results list every metric × subject flat, ordered by the API, with no filter by metric / condition status and no sorting by value. Failed results aren't surfaced first, and a metric measured on many subjects (e.g. queries) spreads over many pages.
- Rows are clickable (`router.push('/metrics/:id')`) and also hold a checkbox that toggles the series in the trend chart; picks are local state (`useState`), lost on reload or page change, and the chart sits above the table, so the effect of a pick happens off screen.
- Each condition renders a badge plus a truncated phrase (`Fails above … over … of passed runs (…)`), so the `Conditions` column is the widest one and mostly cut off.
- Empty state is `No metrics yet` while the analysis is running; `useMetricResults` / `useMetricSummaries` refetch through `useAnalysisProgress` `version`.

## Acceptance Criteria

- [x] Results add filter by `Metric` type
- [x] Results add filter by `Endpoint`
- [x] Results add hash `#` in `href` and paging with `hash`

## Solutions

- [x] API `GET /analyses/:analysisId/metrics?metricType&subjectUuid&limit&offset` (`ListMetricResultsQueryDto`) filters the latest result's metric results
- [x] API `GET /analyses/:analysisId/metrics/filters` → `MetricResultFilterOptions` (`metricTypes`, `subjects` measured in the latest result); empty while the analysis has no result
- [x] Web `MetricResultFilters` (metric + endpoint `Select`) under the `Results` heading, synced to `?metricType&subjectUuid` via `metricResultListParamsSchema`; `No result matches these filters` empty state
- [x] Pagination and filter links end with `#metric-results-heading` (`METRIC_RESULTS_ANCHOR`), so paging scrolls to `Results` instead of the page top; filters push with `scroll: false`
