# Add Metrics menu

## Currently

- The app header ([app-header.tsx](../../apps/web/src/shared/components/app-header.tsx)) has the `Branches`, `Add-ons`, `Rules` and `Conditions` links; there is no entry point for metrics.
- Metrics are rows of the `metrics` table (`type`, `unit`, `description`, `config`) and are only created by [seed.ts](../../apps/api/prisma/seed.ts): `P50`, `P90`, `P95`, `ENDPOINT_P95` and the issue counts by severity.
- The API only has `GET /metrics` ([metrics.controller.ts](../../apps/api/src/modules/metrics/metrics.controller.ts)), which returns `id`, `type`, `unit` and `description` for the condition form; there is no endpoint for one metric and no page for metrics.
- Users can see metric values only inside an analysis (Metrics tab), and cannot see which metrics exist, their unit, or which quality gate conditions use them (those are listed under `Conditions`).

## Acceptance Criteria

- [x] Add menu Metrics
- [x] Metric allow active/disabled
- [ ]

## Solutions

- [x] Add record `isActive` to `Metric`
- [x] Update all functions, only read by `isActive`
- [x] Add UI update metrics
