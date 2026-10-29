# Add Conditions menu to set conditions

## Currently

- The app header ([app-header.tsx](../../apps/web/src/shared/components/app-header.tsx)) only has the `Branches`, `Add-ons` and `Rules` links; there is no entry point for quality gate conditions.
- A condition (`MetricCondition` in [schema.prisma](../../apps/api/prisma/schema.prisma)) links a quality gate to a metric with an `operator` (`GT`, `GTE`, `LT`, `LTE`) and a `threshold`, and is evaluated against every result of that metric (see [quality-gates.service.ts](../../apps/api/src/modules/quality-gates/quality-gates.service.ts)).
- Conditions are only created and changed by [seed.ts](../../apps/api/prisma/seed.ts) (the `Default` gate); the quality gates module has no controller, so the API cannot list or update them.
- A metric has a `unit` (`MILLISECOND` or `COUNT`), so a threshold only makes sense together with the unit of its metric.

## Acceptance Criteria

- [x] Add menu condition
- [x] Condition page show list conditions
- [x] Conditions allow edit same `rules`

## Solutions

- [x] Add endpoint
- [x] Add UI
- [x] Implement behaviors
