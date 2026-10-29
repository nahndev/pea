# Change MetricResult subject into an entity with an identity

## Currently

- `MetricResult.subject` in [schema.prisma](../../apps/api/prisma/schema.prisma) is a free-form `VarChar(255)` string, `""` by default, and is part of the unique key `(analysisResultId, metricId, subject)`.
- A handler ([metric-handler.types.ts](../../apps/api/src/modules/metrics/handlers/metric-handler.types.ts)) returns `subject?: string`; e.g. [endpoint-percentile.handler.ts](../../apps/api/src/modules/metrics/handlers/endpoint-percentile.handler.ts) returns `"GET /api/cart"` as the subject.
- The subject has no identity of its own: the same endpoint is only matched across analyses by comparing strings, and nothing else (id, type, metadata) can be attached to it.
- The web uses the string directly: [metric-series.ts](../../apps/web/src/modules/metrics/metric-series.ts) builds the series key and label from `metricId:subject`, and [metric-results-table.tsx](../../apps/web/src/modules/metrics/components/metric-results-table.tsx) renders it (empty means "All requests").
- Goal: replace the `subject` string with a real entity that has its own identity (id), referenced by `MetricResult`, so results of the same subject can be grouped and tracked reliably.

## Acceptance Criteria

- [x] Add `Subject` into new `table` with:
- [x] `type` as `API`, `QUERY`, ...
- [x] `uuid`: string is identify (using uuid-v5, create from current subject)
- [x] `description`: description

Example: current subject is `GET /api/cart` convert into row in table:

```ts
{
  type: `API`,
  uuid: `....`,
  description: `GET /api/cart`
}
```

- [x] Refactor `MetricHandler` with `EndpointPercentileHandler` will return subject is dto -> createMany filter by uuid of `subject`
