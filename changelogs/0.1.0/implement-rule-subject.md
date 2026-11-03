# Implement IssueSubject (issueId, subjectId, status)

## Currently

- Since [apply-subject-for-issue](./apply-subject-for-issue.md), `Issue` in [schema.prisma](../../apps/api/prisma/schema.prisma) points to at most one `Subject` through a nullable `subjectUuid` FK (`onDelete: Restrict`).
- `status` (`OPEN`, `RESOLVED`, `DISMISSED` in [issue-status.constants.ts](../../packages/constants/src/issue-status.constants.ts)) lives on `Issue` itself, defaults to `OPEN`, and is never changed: there is no endpoint to update it, only the `status` filter of `GET /analyses/:id/issues` ([analysis-result.controller.ts](../../apps/api/src/modules/analysis-result/analysis-result.controller.ts)).
- Each analysis run creates new `Issue` rows, one per (rule, endpoint) for per-endpoint rules ([slow-route.handler.ts](../../apps/api/src/modules/rules/handlers/slow-route.handler.ts), [route-error-rate.handler.ts](../../apps/api/src/modules/rules/handlers/route-error-rate.handler.ts), [slow-api.handler.ts](../../apps/api/src/modules/rules/handlers/slow-api.handler.ts)), saved by [issues.service.ts](../../apps/api/src/modules/issues/issues.service.ts). Whole-analysis rules (latency, rate) have no subject.
- So an issue cannot cover several subjects, and a status cannot be tracked per subject (e.g. one endpoint resolved or dismissed while another is still open).
- Goal: add an `IssueSubject` join entity `(issueId, subjectId, status)` that links an issue to its subjects, each link carrying its own status.
- `Subject` is keyed by `uuid` (uuid-v5 of `type:description`), not `id`, so `subjectId` maps to `Subject.uuid`.

## Acceptance Criteria

- [x] Add IssueSubject
- [x] Every IssueSubject link to rule + subject
- [x] Every IssueSubject include `status` (TO REVIEW, PLANNING, IN PROCESS, FIXED)
- [x] In UI of Issue, show status of StatusSuject
- Why: By multiple analysis, we have multiple issue, but some issue is planning. User must known it

## Solutions

- [x] `IssueSubject` (`issue_subjects`): `ruleId` + `subjectUuid` (unique pair), `status` (`IssueSubjectStatus`: `TO_REVIEW`, `PLANNING`, `IN_PROGRESS`, `FIXED`, default `TO_REVIEW`). It outlives analyses: every issue of the same rule and subject, in any analysis, shares the same row and status. Migration `add_issue_subjects` backfills one `TO_REVIEW` row per existing (rule, subject) pair.
- [x] `IssuesService.createMany` creates the missing pairs (`skipDuplicates`), so an existing status is kept on re-analysis.
- [x] Issues without a specific subject (latency, rate rules) get `DEFAULT_SUBJECT` (`SubjectType.DEFAULT`, "All requests") instead of `null`, so they have an `IssueSubject` too and `Issue.subjectUuid` is now required. Migration `add_default_subject` creates it and moves existing issues onto it; the seed upserts it.
- [x] Only one `DEFAULT` subject can exist: partial unique index `subjects_default_type_key` (`WHERE type = 'DEFAULT'`, Prisma preview `partialIndexes`).
- [x] `IssueView.issueSubject` (`{ id, status }` or `null`), looked up by (rule, subject) for the page of issues; `PATCH /issue-subjects/:id` (`{ status }`) changes the status, `ISSUE_SUBJECT_NOT_FOUND` when unknown.
- [x] The issues page has a "Subject status" column with a select to change it.
