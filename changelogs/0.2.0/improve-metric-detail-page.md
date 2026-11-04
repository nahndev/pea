# Improve metric detail page

## Currently

- [metrics/[id]/page.tsx](../../apps/web/src/app/metrics/[id]/page.tsx) renders [metric-detail-view.tsx](../../apps/web/src/modules/metrics/components/metric-detail-view.tsx) as one long column: `PageHeader` (schema · type · unit) → description → [metric-overview.tsx](../../apps/web/src/modules/metrics/components/metric-overview.tsx) → `Results` → `Settings`. The only query param is `page`.
- `MetricOverview` shows 4 cards (status, unit, scope, result count). Status, unit and scope repeat what the header and the settings form already show; there is no latest value, min/max/avg or change vs. previous result.
- [metric-history-table.tsx](../../apps/web/src/modules/metrics/components/metric-history-table.tsx) lists every result flat (analysis, branch, subject, value, conditions, measured), newest first. It can't be filtered by branch or subject, so a metric measured on many subjects (e.g. queries) mixes them on every page.
- Conditions are shown only as `GateStatusBadge`s; operator/threshold live in the `title` tooltip. The linked `Condition` (unique per `metric_id`) is not shown or linked to the conditions page.
- There is no chart. `MetricTrendChart` / `useMetricTrend` exist but work per branch + schema (`GET /branches/:id/metrics/trend`), not for a single metric.
- [metric-form.tsx](../../apps/web/src/modules/metrics/components/metric-form.tsx) sits at the bottom, below the paginated results, so editing settings needs scrolling past the history.
- API ([metrics.controller.ts](../../apps/api/src/modules/metrics/metrics.controller.ts)): `GET /metrics/:id/results?limit&offset` (`findHistory` in [metrics.service.ts](../../apps/api/src/modules/metrics/metrics.service.ts)) only paginates; no `branchId` / `subjectId` filter and no aggregate stats. `GET /metrics/:id/subjects` exists and can feed a subject filter.

## Acceptance Criteria

- [x] Remove mean duration per query
- [x] Move `Results` to bottom
- [x] Move `Settings` to top

## Solutions

- [x] Drop the `description` paragraph under `PageHeader`: it repeats the title (e.g. `Mean duration per query`) and is still editable in `Settings`
- [x] Reorder `MetricDetailView`: header → `Settings` → `MetricOverview` → `Results` (table + pagination)
