# Metric support include and exclude subject

## Currently

- A metric measures every subject its handler returns: [EndpointPercentileHandler](../../apps/api/src/modules/metrics/handlers/endpoint-percentile.handler.ts) returns one measurement per endpoint (`GET /api/cart`, `POST /api/checkout`, ...) with no way to narrow it down.
- `Metric` in [schema.prisma](../../apps/api/prisma/schema.prisma) has a `config` JSONB column (default `{}`), but no metric handler reads it yet, and [UpdateMetricDto](../../apps/api/src/modules/metrics/dto/update-metric.dto.ts) only accepts `description` and `isActive`.
- Noisy endpoints (health checks, static assets, admin routes) end up in the metric results, the trend chart and the conditions, and a metric cannot be limited to the endpoints that matter.
- Goal: let a metric define which subjects it includes and which it excludes, so the handler only measures the wanted ones.
- Subjects are identified by `uuid` (see [change-metric-result-subject-to-entity.md](change-metric-result-subject-to-entity.md)), while the include/exclude rule is more natural to express on the subject description (e.g. `GET /api/health`).

## Acceptance Criteria

- [x] Metric config -> support `include` and `exclude`
- [x] The `include` and `exclude` shown list of `subjects` (which exist in system) filter by `metricId`
- [x] When handler
  - If include is empty -> apply for all subjects
  - If include is exist -> only apply for include subjects
  - If exclude is exist -> exclude that subjects
  - If exclude is empty -> don't exclude any

## Solutions

- [x] `include` / `exclude` are lists of subject uuids stored in `Metric.config` (JSONB); no migration. `MetricView` exposes them, `PATCH /metrics/:id` accepts them (uuid arrays, unique, max 200).
- [x] `GET /metrics/:id/subjects` lists the subjects that already have results for the metric; the metric form shows them as Include / Exclude checkbox lists.
- [x] The filter runs once in `MetricsService.measure`, after the handler, so it covers every handler: include (if not empty) first, then exclude. Measurements without a subject (P50, issue counts) are never filtered.
- Excluded subjects stop getting new results, but their old results (and their entry in the list) stay.
