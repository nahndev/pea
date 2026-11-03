# Support new schema: `database`

## Currently

- `AnalysisSchema` in [analysis-schema.constants.ts](../../packages/constants/src/analysis-schema.constants.ts) only has `API`, `QUERY` and `BUG`; there is no `DATABASE` schema.
- `Analysis`, `Rule`, `Metric` and `MetricCondition` in [schema.prisma](../../apps/api/prisma/schema.prisma) store `schema` as a `VarChar(20)`, so a new value needs no column change but must be accepted by DTO validation and endpoints.
- Rule handlers ([rule-handler.factory.ts](../../apps/api/src/modules/rules/handlers/rule-handler.factory.ts)) and metric handlers ([metric-handler.factory.ts](../../apps/api/src/modules/metrics/handlers/metric-handler.factory.ts)) only implement API metric logs (see [api_metric.md](../../docs/api_metric.md)); nothing parses a database log.
- [seed.ts](../../apps/api/prisma/seed.ts) only seeds rules, metrics and conditions for `AnalysisSchema.API`.
- Web maps every schema to a label ([analysis-schema.constants.ts](../../apps/web/src/shared/lib/analysis-schema.constants.ts)) and a trend chart ([trend-chart.factory.tsx](../../apps/web/src/modules/metrics/components/trend-chart.factory.tsx)): `ApiTrendChart`, `QueryTrendChart`, `BugTrendChart`. Schema tabs and grouped pages (`rules`, `metrics`, `conditions`, branch details) are driven by these records, so `DATABASE` will not appear until it is added there.

## Acceptance Criteria

- [x] Add new schema `Database`

## Solutions

- [x] Add `DATABASE` to `AnalysisSchema`; API DTOs validate with `Object.values(AnalysisSchema)`, so endpoints accept it without changes
- [x] Web: add `Database` label, `DatabaseTrendChart` and `DatabaseSchemaPage` (branch tab `/branches/:id/database`)
- [ ] Database rule/metric handlers and seed data (follow-up, once the database log format is defined)
