# Support feature config menu

## Currently

- The header ([app-header.tsx](../../apps/web/src/shared/components/app-header.tsx)) links `Branches`, `Rules`, `Conditions`, `Metrics`, `Databases`; there is no config/settings menu nor page in [app/](../../apps/web/src/app/).
- Nothing stores app settings: [schema.prisma](../../apps/api/prisma/schema.prisma) has no settings/feature table. The only runtime config is the API env, validated at startup by [env.schema.ts](../../packages/config/src/env.schema.ts) (`PORT`, `DATABASE_URL`, `UPLOAD_DIR`, `DATABASE_CONNECTION_KEY`); changing it needs a restart.
- Features can't be turned on/off:
  - Every `AnalysisSchema` (`API`, `QUERY`, `BUG`, `DATABASE`, `FRONTEND`) always has its branch tab and new analysis option ([analysis-schema.constants.ts](../../apps/web/src/shared/lib/analysis-schema.constants.ts), `Record<AnalysisSchema, …>` factories).
  - Add-ons ([add-on.registry.ts](../../apps/api/src/modules/add-ons/add-on.registry.ts)) are all loaded from `plugins/*` at startup and offered in the new analysis form.
  - Only single rows can be disabled: `Rule.isActive`, `Metric.isActive`, `MetricCondition.isActive`.
- Limits are code constants, e.g. `MAX_LOG_FILE_SIZE` (50 MB, duplicated in [api](../../apps/api/src/modules/analyses/analyses.constants.ts) and [web](../../apps/web/src/shared/lib/log-file.constants.ts)), `MAX_BULK_ANALYSES` (20), `MAX_FRONTEND_ISSUES` / `MAX_BUG_ISSUES` / `MAX_DATABASE_ISSUES` (100, [rules.constants.ts](../../apps/api/src/modules/rules/rules.constants.ts)), `DEFAULT_TREND_METRIC_TYPES`, `PAGE_SIZE` (20).

## Acceptance Criteria

- [x] Add new menu `Chart`
- [x] Allow setup which `metric`s need show as `Card` in chart
- [x] Allow setup which `metric`s are the default lines of the trend chart

## Solutions

- [x] `Metric.isCard` / `Metric.isTrend` (nullable until the seed applies the defaults: cards `P50`/`P90`/`P95`, trend lines the former `DEFAULT_TREND_METRIC_TYPES`; a re-seed never overrides a saved choice)
- [x] `PATCH /metrics/:id` takes `isCard`, `isTrend`; a trend line on a metric measured per subject (`SUBJECT_METRIC_TYPES`) is rejected with `METRIC_TREND_UNSUPPORTED`
- [x] Summary cards read the `isCard` metrics in metric order, formatted by unit; the trend chart defaults to the overall values of the `isTrend` metrics. `SUMMARY_METRIC_TYPES` and `DEFAULT_TREND_METRIC_TYPES` are removed
- [x] Web: `Chart` menu (`/charts`), one tab per schema, a `Card` and a `Trend` switch per metric (`Trend` disabled for per-subject metrics)
