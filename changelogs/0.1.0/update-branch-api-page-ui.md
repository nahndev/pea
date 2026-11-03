# Update UI of the branch API page

## Currently

- `/branches/:id/api` renders [ApiSchemaPage](../../apps/web/src/modules/branches/components/schema-pages/api-schema-page.tsx) inside [BranchSchemaLayout](../../apps/web/src/modules/branches/components/branch-schema-layout.tsx), stacking in order:
  - [BranchHeader](../../apps/web/src/modules/branches/components/branch-header.tsx): breadcrumbs, branch name, static description ("Analysis results for this branch, newest first.") and a "New analysis" button.
  - [SchemaTabs](../../apps/web/src/shared/components/schema-tabs.tsx) to switch between `api`, `query`, `bug`.
  - [ApiTrendChart](../../apps/web/src/modules/metrics/components/api-trend-chart.tsx): line chart of P50, P90 and P95 averaged per analysis over the last `TREND_LIMIT` analyses; no metric picking or condition limits on this page.
  - [AnalysisListView](../../apps/web/src/modules/analyses/components/analysis-list-view.tsx): "Analyses" table (Date, Merge request, Result, Issues, Conditions, Details → Issues / Metrics links) with pagination, no filter or sorting.
- There is no summary of the latest analysis (e.g. latest result, gate status, key API metrics) at the top of the page; the user has to read the chart and table to know the branch's current state.
- Sections have no consistent spacing/layout wrapper; the layout is a plain fragment.

## Acceptance Criteria

- [x] List of analysis add `schema` column
- [x] `schema` show as badge

## Solutions

- [x] Update UI
