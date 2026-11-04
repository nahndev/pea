# Support order for all tables in the system

## Currently

- No table in the web app can be sorted. Headers are plain `TableHead` text, with no sort control and no `sort`/`order` search param.
- Every list API returns a fixed order hard-coded in its repository, and no query DTO accepts a sort field or direction:
  - Branches ([branch-list-view.tsx](../../apps/web/src/modules/branches/components/branch-list-view.tsx), paginated): Branch, Analyses, Last analysis
  - Analyses ([analysis-list-view.tsx](../../apps/web/src/modules/analyses/components/analysis-list-view.tsx), paginated): Title, Date, Schema, Result, Issues, Conditions. Ordered by `createdAt desc, id desc` ([analyses.repository.ts](../../apps/api/src/modules/analyses/analyses.repository.ts))
  - Issues ([issue-list-view.tsx](../../apps/web/src/modules/issues/components/issue-list-view.tsx), paginated): Severity, Rule, Details, Status, Count, Raised. Ordered by `id desc` ([issues.repository.ts](../../apps/api/src/modules/issues/issues.repository.ts))
  - Analysis metric results ([metric-results-table.tsx](../../apps/web/src/modules/metrics/components/metric-results-table.tsx), paginated): Metric, Endpoint, Value, Unit, Conditions. Ordered by `metric.type, subject.description, id` ([metric-results.repository.ts](../../apps/api/src/modules/metrics/metric-results.repository.ts))
  - Metric history ([metric-history-table.tsx](../../apps/web/src/modules/metrics/components/metric-history-table.tsx), paginated): Analysis, Branch, Subject, Value, Conditions, Measured. Ordered by `createdAt desc, id desc`
  - Metrics ([metric-list-view.tsx](../../apps/web/src/modules/metrics/components/metric-list-view.tsx)): Metric, Description, Unit, Status. Ordered by `id asc` ([metrics.repository.ts](../../apps/api/src/modules/metrics/metrics.repository.ts))
  - Rules ([rule-list-view.tsx](../../apps/web/src/modules/rules/components/rule-list-view.tsx), not paginated): Rule, Severity, Type. Ordered by `id asc` ([rules.repository.ts](../../apps/api/src/modules/rules/rules.repository.ts))
  - Conditions ([condition-list-view.tsx](../../apps/web/src/modules/conditions/components/condition-list-view.tsx), not paginated): Metric, Fails when, Status. Ordered by `metric.schema, metric.type, id` ([metric-conditions.repository.ts](../../apps/api/src/modules/conditions/metric-conditions.repository.ts))
  - Databases ([database-list-view.tsx](../../apps/web/src/modules/databases/components/database-list-view.tsx), not paginated): Name, Address, Analyses, Updated. Ordered by `name, id` ([databases.repository.ts](../../apps/api/src/modules/databases/databases.repository.ts))
- On paginated tables, sorting in the browser would only reorder the current 20 rows, so the order has to be applied by the API before `limit`/`offset`.
- Shared list pieces already exist and can carry sort state the same way they carry `page`: `PaginationQueryDto` ([pagination-query.dto.ts](../../apps/api/src/common/dto/pagination-query.dto.ts)), `Paginated<T>` ([pagination.types.ts](../../packages/types/src/pagination.types.ts)), and `buildHref`/`toOffset` ([pagination.ts](../../apps/web/src/shared/lib/pagination.ts)).
- Some columns are computed or come from relations (Analyses count, Last analysis, Issues/Conditions counts, Value, Fails when), so they may not map to a plain Prisma `orderBy`.

## Acceptance Criteria

- [x] All table add order by columns
- [x] All table update endpoints support order
- [x] Using JSON:API, ex: ?ordering=-created,name

## Solutions

- [x] `?ordering=-createdAt,name` on every list endpoint: comma-separated terms, `-` for descending, fields named after the response attributes. `@IsOrdering(<Table>SortField)` parses it and rejects unknown or repeated fields (`BAD_REQUEST`); per-table fields live in `@tomato/constants` (`sort-field.constants.ts`)
- [x] Paginated lists order in the database before `LIMIT`/`OFFSET`, then fall back to their old default order: raw SQL for branches, analyses (latest result via `LATERAL`) and issues (severity/status by declaration order, count by subquery); Prisma `orderBy` for metric results and history
- [x] Full lists (metrics, rules, conditions, databases) are sorted in the service with `sortItems`, so severity rank and the decrypted database address can be sorted too
- [x] Web: `SortableTableHead` links cycle a column ascending → descending → default, keeping filters and resetting the page; `ordering` lives in the URL like `page`
- [x] Not sortable: analyses Schema (one per tab), Conditions/gate columns and Details links
