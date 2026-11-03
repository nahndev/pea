# Add count of issues with the same issue subject

## Currently

- `IssueSubject` in [schema.prisma](../../apps/api/prisma/schema.prisma) is one row per `(ruleId, subjectUuid)` with a `status`; it outlives analyses. Issues without a specific subject use the `DEFAULT` subject, so every issue has one.
- Each analysis run creates new `Issue` rows ([issues.service.ts](../../apps/api/src/modules/issues/issues.service.ts) `createMany`), so the same rule failing for the same subject in several analyses gives several issues sharing one `IssueSubject`. There is no FK from `Issue` to `IssueSubject`: they are matched by `(ruleId, subjectUuid)` (`toKey` / `IssueSubjectsRepository.findByKeys`).
- `IssueView.issueSubject` ([issue.types.ts](../../packages/types/src/issue.types.ts)) only has `id` and `status`; nothing tells how many issues (i.e. how many times / analyses) that rule failed for that subject.
- The issues list ([issue-list-view.tsx](../../apps/web/src/modules/issues/components/issue-list-view.tsx)) and the detail page ([issue-detail-view.tsx](../../apps/web/src/modules/issues/components/issue-detail-view.tsx)) show the subject status but no count, so a recurring issue looks the same as a new one.
- Open points: count across all analyses or only the analyses of the same branch / schema; count every issue or only those of completed analysis results; `Issue.analysisResultId` is nullable.

## Acceptance Criteria

- [x] In /issues/{id} page, add row "Count"
- [x] Base on `IssueSubject`, count all `Issues` same `IssueSubject`

## Solutions

- [x] `IssueView.issueCount`: number of issues with the same `ruleId` and `subjectUuid`, across all analyses (current issue included). `IssuesRepository.countByKeys` counts a whole page in one `groupBy`, loaded in parallel with the `IssueSubject`s; used by both `GET /analyses/:id/issues` and `GET /issues/:id`.
- [x] Shown as a "Count" column on the issues list and a "Count" row on the detail page.
