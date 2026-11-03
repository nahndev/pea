# Improve metrics list and issues list UI with 20 items per page

## Currently

- [metric-list-view.tsx](../../apps/web/src/modules/metrics/components/metric-list-view.tsx) renders every metric of the selected schema in one table, with no pagination. `metricsService.list(schema)` calls `GET /metrics?schema=` and gets back a plain `MetricView[]`.
- The API `GET /metrics` ([metrics.controller.ts](../../apps/api/src/modules/metrics/metrics.controller.ts)) only takes `ListMetricsQueryDto` (`isActive`, `schema`). `MetricsRepository.findAll` runs `findMany` ordered by `id` with no `limit`/`offset` and no total count.
- [metrics/page.tsx](../../apps/web/src/app/metrics/page.tsx) only parses `schema` from `searchParams` (`schemaParamsSchema`). It does not read a `page` param.
- [issue-list-view.tsx](../../apps/web/src/modules/issues/components/issue-list-view.tsx) (`/analyses/:id/issues`) is already paginated: `PaginationBar`, `page` in `issueListParamsSchema`, and `limit: PAGE_SIZE, offset: toOffset(page)` sent to `GET /analyses/:analysisId/issues`. Its table has no `table-fixed` and its column widths are loose (`max-w-56` and `max-w-96` on Subject and Details), so long subjects and details make the layout shift.
- Shared pagination pieces already exist: `PAGE_SIZE = 20` ([pagination.constants.ts](../../apps/web/src/shared/lib/pagination.constants.ts)), `toOffset`, `buildHref`, `toPageCount` ([pagination.ts](../../apps/web/src/shared/lib/pagination.ts)), [pagination-bar.tsx](../../apps/web/src/shared/components/pagination-bar.tsx), the API `PaginationQueryDto` (default `limit` 20, max 100) and the `Paginated<T>` type.
- The metric detail history (`GET /metrics/:id/results`, `MetricHistoryTable`) already uses this pattern, so the list pages can follow it.

## Acceptance Criteria

- [x] Page /analyses/id/metrics and /analyses/id/issues update UI support paging
- [x] Support api with paging
- [x] Every page is 20 items

## Solutions

- [x] API `GET /analyses/:id/metrics?limit&offset` → `Paginated<MetricResultView>` (stable order: type, subject, id)
- [x] API `GET /analyses/:id/metrics/summaries` → `MetricSummaryView[]`; summary cards stay over all results, `summarizeMetrics` moved from web to API
- [x] Web `/analyses/:id/metrics?page=`: `PaginationBar` with `PAGE_SIZE` (20); picked trend series keep their unit and limit across pages
- [x] Web issues table: `table-fixed` with fixed column widths, rule/subject/details truncated with a `title` tooltip
