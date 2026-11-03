comm# Remove issue status, use the status of `IssueSubject`

## Currently

- Two statuses live side by side:
  - `Issue.status` in [schema.prisma](../../apps/api/prisma/schema.prisma) (`VarChar(20)`, default `OPEN`, indexed) with `IssueStatus` (`OPEN`, `RESOLVED`, `DISMISSED`) in [issue-status.constants.ts](../../packages/constants/src/issue-status.constants.ts). It is never changed: every issue stays `OPEN`, there is no endpoint to update it.
  - `IssueSubject.status` (`IssueSubjectStatus`: `TO_REVIEW`, `PLANNING`, `IN_PROGRESS`, `FIXED`), one per `(rule, subject)`, editable via `PATCH /issue-subjects/:id` on the detail page.
- `Issue.status` is still used by:
  - API: `IssueView.status` ([issue.types.ts](../../packages/types/src/issue.types.ts)), mapped in [issues.service.ts](../../apps/api/src/modules/issues/issues.service.ts); the `status` filter of `GET /analyses/:id/issues` ([list-issues-query.dto.ts](../../apps/api/src/modules/issues/dto/list-issues-query.dto.ts) → [issues.repository.ts](../../apps/api/src/modules/issues/issues.repository.ts) `findPage`).
  - Web: the status filter ([issue-filters.tsx](../../apps/web/src/modules/issues/components/issue-filters.tsx), [issues.schemas.ts](../../apps/web/src/modules/issues/issues.schemas.ts)), the "Status" column of [issue-list-view.tsx](../../apps/web/src/modules/issues/components/issue-list-view.tsx) and the "Status" row of [issue-detail-view.tsx](../../apps/web/src/modules/issues/components/issue-detail-view.tsx), both via `ISSUE_STATUS_STYLE` ([issues.constants.ts](../../apps/web/src/modules/issues/issues.constants.ts)).
- So the UI shows a "Status" that is always "Open" next to a "Subject status" that the user actually manages, which is confusing.
- `IssueSubject` is not linked to `Issue` by FK; it is matched by `(ruleId, subjectUuid)`, so filtering issues by `IssueSubject.status` cannot use a Prisma relation filter as is.

## Acceptance Criteria

- [x] Using `status` of `IssueSubject` instead of `status`
- [x] Remove record `status` in table
- [x] Update all UI

## Solutions

- [x] `Issue` now references its `IssueSubject` by FK on `(ruleId, subjectUuid)` (possible since `subjectUuid` is required), `onDelete: Cascade`. Migration `remove_issue_status` drops `issues.status` and its index, creates any missing `IssueSubject` row, then adds the FK.
- [x] `IssueStatus` removed from `@tomato/constants`; `IssueView.status` removed and `issueSubject` is always set (loaded via `include`, no more `findByKeys` lookup). The `status` filter of `GET /analyses/:id/issues` takes an `IssueSubjectStatus` and filters on `issueSubject.status`.
- [x] Web: the list "Status" column and the detail "Status" row show the `IssueSubject` status (badge on the list, select on the detail page); the status filter lists `IssueSubjectStatus` values.
