# Apply subject for issue

## Currently

- `MetricResult` already references a `Subject` entity (`type`, uuid-v5 `uuid`, `description`) in [schema.prisma](../../apps/api/prisma/schema.prisma), created via [metric-subject.ts](../../apps/api/src/modules/metrics/metric-subject.ts).
- `Issue` has no subject: only `ruleId`, `analysisResultId`, a free-form `description`, `status`, `severity`.
- A rule handler ([rule-handler.types.ts](../../apps/api/src/modules/rules/handlers/rule-handler.types.ts)) returns `RuleIssue { ruleId, description }`.
- Per-endpoint handlers embed the endpoint only inside the description string:
  - [slow-route.handler.ts](../../apps/api/src/modules/rules/handlers/slow-route.handler.ts): `"GET /api/cart P95 812.3ms exceeds threshold 500ms"`
  - [route-error-rate.handler.ts](../../apps/api/src/modules/rules/handlers/route-error-rate.handler.ts): `"GET /api/cart 5xx error rate 12.0% exceeds threshold 5%"`
  - [slow-api.handler.ts](../../apps/api/src/modules/rules/handlers/slow-api.handler.ts): `"GET /api/cart expected less than 500ms, current max is 812.3ms"`
- Whole-analysis handlers ([latency.handler.ts](../../apps/api/src/modules/rules/handlers/latency.handler.ts), [rate.handler.ts](../../apps/api/src/modules/rules/handlers/rate.handler.ts)) have no subject at all.
- Result: issues of the same endpoint cannot be grouped, filtered or tracked across analyses, and cannot be linked to the metric results of that endpoint; the web issues page ([issues/page.tsx](../../apps/web/src/app/analyses/[id]/issues/page.tsx)) can only show the raw description.

## Acceptance Criteria

- [x] Apply subject for issue
- [x] Per-endpoint rules (`SLOW_ROUTE`, `ROUTE_ERROR_RATE`, `SLOW_API`) link each issue to its `API` subject; whole-analysis rules (latency, rate) have none
- [x] `IssueView` exposes `subject`; the issues page shows a Subject column (`All requests` when empty)

## Solutions

- [x] `Subject` moved from `metrics` into its own `subjects` NestJS module (`createSubject`, `SubjectsService`, `SubjectsRepository`), imported by `metrics` and `issues` (avoids a `metrics` ↔ `issues` cycle).
- [x] `Issue.subjectUuid` (nullable FK to `subjects`, `Restrict`, indexed); migration `add_issue_subject`, no backfill.
- [x] `RuleIssue` gets `subject?`; `IssuesService.createMany` saves the subjects (deduped by uuid) before the issues, same as metric results.
- [x] The endpoint is dropped from the description of per-endpoint issues since it is now the subject. Old issues keep their description and have no subject.
