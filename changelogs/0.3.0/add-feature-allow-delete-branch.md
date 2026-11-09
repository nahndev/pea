# Add feature allow delete branch

## Currently

- A branch can be created, listed and viewed, but never deleted. [branches.controller.ts](../../apps/api/src/modules/branches/branches.controller.ts) only has `GET /branches`, `POST /branches` and `GET /branches/:id`, and [branches.service.ts](../../apps/api/src/modules/branches/branches.service.ts) / [branches.repository.ts](../../apps/api/src/modules/branches/branches.repository.ts) have no delete method. Test or mistyped branches stay in the list forever.
- `Branch.name` is `@unique` ([schema.prisma](../../apps/api/prisma/schema.prisma)), so the name of an unwanted branch can't be reused.
- DB relations already cascade: `Branch` → `Analysis` → `AnalysisResult` → `Issue` / `MetricResult` → `MetricEvaluation` (all `onDelete: Cascade`). These rows don't cascade:
  - `Subject` (`onDelete: Restrict`): stays even if no other branch uses it.
  - `IssueSubject` (per `ruleId` + `subjectUuid`, not per branch): keeps its review `status` after its issues are gone.
  - `Database` (`DatabaseAnalysisData` uses `Restrict`): is shared and must not be deleted with the branch.
- API analyses keep their uploaded log on disk (`ApiAnalysisData.file` / `path`, saved by `StorageService` in [analyses.service.ts](../../apps/api/src/modules/analyses/analyses.service.ts)). A DB cascade would not remove these files, so they would be left behind.
- Metric condition baselines use the passed history ([metric-conditions.service.ts](../../apps/api/src/modules/conditions/metric-conditions.service.ts)). Deleting a branch removes its results from the history used by later evaluations.
- Web: [branches/components/](../../apps/web/src/modules/branches/components/) (`branch-list-view.tsx`, `branch-header.tsx`) has no delete action. A pattern to reuse exists in databases ([database-delete-section.tsx](../../apps/web/src/modules/databases/components/database-delete-section.tsx), `@Delete(':id')` in [databases.controller.ts](../../apps/api/src/modules/databases/databases.controller.ts)).

## Acceptance Criteria

- [x] After button `New analysis`, add button `Delete branch`
- [x] When click on ticket, show confirm dialog
- [x] Remove Analysis all all related table

## Solutions

- [x] API `DELETE /branches/:id` (204, `BRANCH_NOT_FOUND`): one transaction collects the stored log paths and deletes the branch; DB cascade removes analyses, results, issues, metric results and evaluations; log files are removed afterwards (cleanup failure ignored)
- [x] Kept: `Subject`, `IssueSubject` (review status reused if the subject reappears) and `Database` (shared)
- [x] Web: `DeleteBranchDialog` next to `New analysis` in the branch header; confirms, then redirects to `/branches`
