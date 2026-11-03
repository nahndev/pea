# Add issue detail page

## Currently

- Issues are only shown as rows of a table on `/analyses/:id/issues` ([issues/page.tsx](../../apps/web/src/app/analyses/[id]/issues/page.tsx) → [issue-list-view.tsx](../../apps/web/src/modules/issues/components/issue-list-view.tsx)): severity, rule, subject, details (description), status, subject status select, raised date. A row has no link and there is no `/issues/:id` page.
- The API has no endpoint for a single issue: only `GET /analyses/:analysisId/issues` (paginated, latest analysis result only) in [analysis-result.controller.ts](../../apps/api/src/modules/analysis-result/analysis-result.controller.ts) and `PATCH /issue-subjects/:id` in [issue-subjects.controller.ts](../../apps/api/src/modules/issues/issue-subjects.controller.ts).
- `IssueView` ([issue.types.ts](../../packages/types/src/issue.types.ts)) has `id`, `status`, `severity`, `description`, `subject`, `issueSubject` (`id`, `status`), `createdAt` and `rule` (`type`, `description` only, no rule id or config/threshold).
- An issue belongs to an analysis result and a `(rule, subject)` pair (`IssueSubject`) that outlives analyses, but nothing shows the history of that pair: the earlier analyses where the same rule failed for the same subject, or the related metric results of that subject (`MetricResult.subjectUuid`).
- Other entities already follow the list → detail pattern, e.g. [rules/[id]/page.tsx](../../apps/web/src/app/rules/[id]/page.tsx) → `RuleDetailView`, `metrics/[id]`, `conditions/[id]`.

## Acceptance Criteria

- [x] On /issues page, when click on issue, redirect to details page
- [x] Details page allow edit status
- [x] /issues page only show status

## Solutions

- [x] API: `GET /issues/:id` (`IssuesController`) returns the `IssueView` with its `issueSubject`; `ISSUE_NOT_FOUND` when unknown. `IssueView.rule` now also has `id`.
- [x] Web: `/analyses/:id/issues/:issueId` (`IssueDetailView`, under the analysis header, Issues tab stays active) shows description, rule (links to `/rules/:id`), subject, severity, status, raised date and the subject status select.
- [x] `/analyses/:id/issues`: clicking a row opens the detail page (the details cell stays a link for keyboard and new-tab use); subject status is a read-only badge (`ISSUE_SUBJECT_STATUS_STYLE`).
