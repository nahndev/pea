# Adjust detail page of branch

## Currently

- The branch detail page ([page.tsx](../../apps/web/src/app/branches/[id]/page.tsx), `/branches/:id`) shows [BranchHeader](../../apps/web/src/modules/branches/components/branch-header.tsx), [BranchSchemaTabs](../../apps/web/src/modules/branches/components/branch-schema-tabs.tsx), the trend chart of the selected `schema` and [AnalysisListView](../../apps/web/src/modules/analyses/components/analysis-list-view.tsx), in that order.
- The header only has a "New analysis" button and a static description ("Analysis results for this branch, newest first.").
- The analyses table lists Date, Merge request, Result, Issues, Conditions and Details (links to issues and metrics), with no filter or sorting.
- The tabs component duplicates the shared [SchemaTabs](../../apps/web/src/shared/components/schema-tabs.tsx) added by [group-pages-by-schema.md](group-pages-by-schema.md).

## Acceptance Criteria

- [x] Route /branches, every branch include `sub-menu` with schema
- [x] Details page /branches/{id}?schema=.... -> change into `/branches/{id}/schemas/{type}
- [x] Add page for `ApiSchemaPage`, `QuerySchemaPage`, `BugSchemaPage`, ...

## Solutions

- [x] `/branches/:id` redirects to `/branches/:id/schemas/api`; `[type]` is a lowercase slug, an unknown one is a 404
- [x] `BranchSchemaPageBySchema` picks `ApiSchemaPage` / `QuerySchemaPage` / `BugSchemaPage`, each with its own trend chart
- [x] `BranchSchemaTabs` removed in favour of the shared `SchemaTabs` (takes an `href` builder)
