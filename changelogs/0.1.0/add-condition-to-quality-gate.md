# Add condition to quality gate

## Currently

- A quality gate ([schema.prisma](../../apps/api/prisma/schema.prisma) `QualityGate`) holds conditions (`MetricCondition`: `metric`, `operator`, `threshold`, `isActive`); a result fails the gate when a condition matches (see [quality-gates.service.ts](../../apps/api/src/modules/quality-gates/quality-gates.service.ts)).
- Conditions can only be listed and edited (`/conditions`, `GET`/`PATCH /conditions`, see [metric-conditions.controller.ts](../../apps/api/src/modules/quality-gates/metric-conditions.controller.ts)); a new condition can only be added by editing [seed.ts](../../apps/api/prisma/seed.ts) and re-running it.
- Quality gates themselves are also only created by the seed (the `Default` gate), and there is no endpoint or page for them.
- Users cannot add a condition for another metric (e.g. `MEDIUM_ISSUE_COUNT` or `ENDPOINT_P95`) to a gate, or add a second condition on the same metric with a different limit.
- A metric has a `unit` (`MILLISECOND` or `COUNT`), so the threshold of a new condition has to be entered in the unit of its metric.

## Acceptance Criteria

- [x] Add button `create` allow add new condition
- [x] Allow select `metric` and set `condition`, without duplicate `metric`
- [x] Default is active

## Solutions

- [x] Add unique of `qualityGateId` + `metricId`
- [x] Add UI
- [x] Add endpoints
