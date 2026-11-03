# Support condition based on max, min, average

## Currently

- `MetricCondition` in [schema.prisma](../../apps/api/prisma/schema.prisma) holds only `operator` (`GT`, `GTE`, `LT`, `LTE`) and `threshold`, one condition per metric (`@@unique([metricId])`).
- [MetricConditionsService.evaluate](../../apps/api/src/modules/conditions/metric-conditions.service.ts) compares the threshold against every `MetricResult` of the metric on its own: one `MetricEvaluation` (`PASSED` / `FAILED`) per result, i.e. per subject (endpoint).
- A condition cannot express a rule over the whole set of results, e.g. "the highest P95 across all endpoints must stay under 500ms", "the lowest ... must be above X" or "the average ... must stay under Y"; today any single endpoint over the threshold fails.
- The evaluation then rolls up into `gateStatus` of the analysis result ([analysis-result.service.ts](../../apps/api/src/modules/analysis-result/analysis-result.service.ts)), where one failed evaluation fails the gate.
- Goal: let a condition choose how the results of a metric are aggregated (`max`, `min`, `average`) before the operator and threshold are applied, alongside the current per-result check. "All other pass metric" is unclear: it may mean the gate passes only when every other condition also passes, or the aggregate is computed over the passing results only — to be confirmed.

## Acceptance Criteria

- [x] MetricCondition add support value base on result of other MetricCondition (pass only)
- [x] New condition base on min, max, average, median, ...
- [x] Ex: MetricCondition of api /api/users must
  - less than 1000ms
  - less than 100ms so voi lan `min` cua tat ca lan do /api/users pass
  - less than 50ms so voi lan `max` cua tat ca lan do /api/users pass
  - less than 50ms so voi `median` cua tat ca lan do /api/users pass

## Solutions

- [x] One `MetricCondition` per metric (unchanged) now holds the plain per-result limit (`operator` + `threshold`) plus `aggregates`, a JSONB list of `{ aggregate, operator, threshold }` with `aggregate` in `MIN`, `MAX`, `AVERAGE`, `MEDIAN` (`AGGREGATE_LIMIT_TYPES` in `@tomato/constants`), at most one per aggregate. Migration `add_condition_aggregate`; `POST` / `PATCH /conditions` accept `aggregates` (PATCH replaces the whole list).
- [x] An aggregate limit checks `value - baseline` against its operator and threshold (e.g. `GT 100` on `MIN` fails when the value is more than 100ms above the historical min). The baseline is computed per subject over the earlier completed results of the same analysis whose evaluations from *other* conditions all passed; the history is loaded once per condition.
- [x] A result with no passed history gets no evaluation for the aggregate limits (the plain limit is still evaluated).
- [x] `MetricEvaluation` snapshots `aggregate` (`NONE` for the plain limit) and `baseline`, unique on `(result, condition, aggregate)`; the results table shows the baseline, and the condition create / edit / list pages show and edit the aggregate limits.
- Median of an even-sized history is the mean of the two middle values.
