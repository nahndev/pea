# TrendChart support pick metric

## Currently

- The trend chart ([metric-trend-chart.tsx](../../apps/web/src/modules/metrics/components/metric-trend-chart.tsx)) always draws the same three lines, P50, P90 and P95, taken from `METRIC_TYPES` in [metrics.constants.ts](../../apps/web/src/modules/metrics/metrics.constants.ts); users cannot choose which metric to plot.
- `GET /branches/:branchId/metrics/trend` ([analyses.service.ts](../../apps/api/src/modules/analyses/analyses.service.ts) `getMetricTrend`) already returns every metric type per analysis (including the issue count metrics by severity), but only the durations are drawn.
- Values are averaged over the files of an analysis and per-endpoint results (`subject`) are left out, so `ENDPOINT_P95` and the issue counts cannot be seen over time.
- The chart is duration-only: the Y axis, tooltip and title ("Duration trend") use `formatDuration`, and the quality gate limits are drawn as dashed lines.
- Goal: let users pick which metric(s) the trend chart shows.

## Acceptance Criteria

- [x] TrendChart support pick MetricResults
- [x] TrendChart show flow picked items
- [x] Without a pick the chart keeps showing P50, P90 and P95

## Solutions

- [x] `pick=<metricId>:<subject>` query on `GET /branches/:branchId/metrics/trend`, response `{ series, points }`
- [x] Checkbox per row in the metrics results table, picks kept in `MetricsView`
- [x] Chart draws one line per picked series; durations and counts are not mixed
