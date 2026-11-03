# Implement database schema analysis

## Currently

- The previous ticket ([support-database-schema.md](support-database-schema.md)) added `AnalysisSchema.DATABASE` with its label, trend chart and branch tab, but an analysis with this schema does nothing: no rule, metric or condition has `schema = DATABASE`.
- Running an analysis ([analysis-result.service.ts](../../apps/api/src/modules/analysis-result/analysis-result.service.ts)) runs the rules of its schema through [rule-handler.factory.ts](../../apps/api/src/modules/rules/handlers/rule-handler.factory.ts), measures metrics through [metric-handler.factory.ts](../../apps/api/src/modules/metrics/handlers/metric-handler.factory.ts), then evaluates conditions. Every rule handler (latency, rate, slow route/API, route error rate) and metric handler (percentile, endpoint percentile) is built for HTTP requests.
- The only log reader is `apiMetricRequests` ([api-metric-requests.ts](../../apps/api/src/modules/files/api-metric-requests.ts)), exposing `duration_ms`, `endpoint`, `status_code` to DuckDB for the NDJSON format in [api_metric.md](../../docs/api_metric.md). There is no defined format or reader for a database log.
- The upload field is fixed to `api_metric` (`LOG_FILE_FIELD` in [analyses.constants.ts](../../apps/api/src/modules/analyses/analyses.constants.ts)) for every schema, in the API and in the web form ([new-analysis-form.tsx](../../apps/web/src/modules/analyses/components/new-analysis-form.tsx)).
- `SubjectType` ([subject-type.constants.ts](../../packages/constants/src/subject-type.constants.ts)) has `DEFAULT`, `API`, `QUERY`; no subject type for database objects (query, table, ...).
- [seed.ts](../../apps/api/prisma/seed.ts) only seeds rules, metrics and conditions for `AnalysisSchema.API`; only the `*_ISSUE_COUNT` metrics are not tied to the API log and could be reused.

## Acceptance Criteria

- [x] Analysis add `title` record
- [x] Remove MergeRequest table (`merge_request_iid` column replaced by `title`)
- [x] Update creation dialog
  - [x] Database connection (username, password, host, port, ...) or (connect-str)
- [x] Issues: empty for now
- [x] Metric: Rows of table (table is subject)

## Solutions

- [x] Create dialog `DatabaseAnalysisCreation`: PostgreSQL only, tabs "Fields" / "Connection string"
- [x] Create new issues: none, no `DATABASE` rule
- [x] Create new metrics: `TABLE_ROWS` (exact `count(*)`, subject `TABLE` = `schema.table`, partitions counted in their parent)
- [x] `Analysis`: required `title`, nullable `file`/`path`, `connection` encrypted with AES-256-GCM (`DATABASE_CONNECTION_KEY`); the API never returns the password
- [x] Connection is verified on creation (`DATABASE_CONNECTION_FAILED`), opened read-only with connect/statement timeouts
- [ ] Migration: `pnpm migrate --create-only --name replace_merge_request_iid_with_title`, then backfill `title` before `SET NOT NULL`:

  ```sql
  ALTER TABLE "analyses" ADD COLUMN "title" VARCHAR(255),
  ADD COLUMN "connection" TEXT,
  ALTER COLUMN "file" DROP NOT NULL,
  ALTER COLUMN "path" DROP NOT NULL;

  UPDATE "analyses" SET "title" = COALESCE('!' || "merge_request_iid", "file");

  ALTER TABLE "analyses" ALTER COLUMN "title" SET NOT NULL,
  DROP COLUMN "merge_request_iid";
  ```
