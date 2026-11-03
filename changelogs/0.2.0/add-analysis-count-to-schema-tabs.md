# Add analysis count to SchemaTabs

## Currently

- [schema-tabs.tsx](../../apps/web/src/shared/components/schema-tabs.tsx) renders one `TabsTrigger` per `analysisSchemaValues`, each showing only `ANALYSIS_SCHEMA_LABEL[value]`. It takes just `schema` and `href`, with no count or badge.
- It is used on the branch page ([branch-schema-layout.tsx](../../apps/web/src/modules/branches/components/branch-schema-layout.tsx)) and on [metrics](../../apps/web/src/app/metrics/page.tsx), [rules](../../apps/web/src/app/rules/page.tsx) and [conditions](../../apps/web/src/app/conditions/page.tsx). Only the branch page lists analyses, so the analysis count only makes sense there.
- `GET /branches/:branchId/analyses?schema&limit&offset` ([branch-analyses.controller.ts](../../apps/api/src/modules/analyses/branch-analyses.controller.ts), `ListBranchAnalysesQueryDto`) returns a page for one schema at a time. No endpoint returns the count per schema of a branch.
- `BranchSummary.analysisCount` ([branch.types.ts](../../packages/types/src/branch.types.ts)) is a single total across all schemas. There is no per-schema breakdown.

## Acceptance Criteria

- [x] The UI add count after label of SchemaTabs
- [x] Add api get count of `analysis` by schema

## Solutions

- [x] API `GET /branches/:branchId/analysis-counts` → `AnalysisCountBySchema` (`Record<AnalysisSchema, number>`, missing schemas filled with `0`); `BRANCH_NOT_FOUND` for an unknown branch
- [x] `SchemaTabs` takes an optional `counts` and renders a `Badge` after each label when the count is > 0; metrics/rules/conditions pages pass none
- [x] Branch page loads counts via `useBranchAnalysisCounts` (key under `['branches', id]`, so creating an analysis refreshes it)
