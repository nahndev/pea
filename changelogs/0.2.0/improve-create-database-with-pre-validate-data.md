# Improve create database with pre-validate data

## Currently

- `POST /databases` ([databases.service.ts](../../apps/api/src/modules/databases/databases.service.ts)) only checks the DTO shape ([create-database.dto.ts](../../apps/api/src/modules/databases/dto/create-database.dto.ts)), then `verify()` runs `SELECT 1` ([database-connections.service.ts](../../apps/api/src/modules/database-connections/database-connections.service.ts)). Any connect failure becomes one generic `DATABASE_CONNECTION_FAILED`, whether the cause is a wrong host, a timeout, bad credentials, a missing database or SSL.
- Nothing checks whether the database can actually be analyzed:
  - `pg_stat_statements` is checked only at analysis time (`hasPgStatStatements` in [analysis-context.factory.ts](../../apps/api/src/modules/analyses/analysis-context.factory.ts)). If it is missing or not preloaded, every query rule/metric is silently skipped (`!context.isPgStatStatements`), so an analysis looks clean.
  - The user's privileges (e.g. `pg_read_all_stats`, needed to see other users' query texts) and the server version are never checked.
- The web form ([database-form.tsx](../../apps/web/src/modules/databases/components/database-form.tsx)) has no "Test connection" step. You only find out when you save, and the only feedback is one error state (`Unable to save database`).
- Duplicates (`DATABASE_ALREADY_EXISTS`) are caught only after the connection is verified, from a Prisma unique violation.
- Update (`PATCH /databases/:id`) has the same flow and the same gaps.

## Acceptance Criteria

- [x] Change `Create database` button into button `Inspect database`
- [x] When click button, show `InspectDatabaseDialog` will call api with information include connect status, extension pg_stat_statements, ...
- [x] `InspectDatabaseDialog` include `Create database` button, when click then run api `Create database`

## Solutions

- [x] `POST /databases/inspections` (`InspectDatabaseDto` = `CreateDatabaseDto`) returns `DatabaseInspection` ([database.types.ts](../../packages/types/src/database.types.ts)): one `DatabaseCheck` (`type`, `status`, optional `value` / `code`) per `DatabaseCheckType`. `FAILED` blocks the creation, `WARNING` limits the analysis, checks after a failed connection are `SKIPPED`:

  | Check | Not passed when | Status |
  | --- | --- | --- |
  | `NAME` | name taken | `FAILED`, `DATABASE_ALREADY_EXISTS` |
  | `CONNECTION` | connect fails | `FAILED`, with its cause |
  | `SERVER_VERSION` | below PostgreSQL 13 (`MIN_SERVER_VERSION_NUM`), `value` = version | `WARNING` |
  | `PG_STAT_STATEMENTS_INSTALLED` | extension missing | `WARNING` |
  | `PG_STAT_STATEMENTS_PRELOADED` | not in `shared_preload_libraries` (`55000`) | `WARNING` |
  | `READ_ALL_STATS` | user lacks `pg_read_all_stats` | `WARNING` |
  | `TRACK_IO_TIMING` | `track_io_timing` off | `WARNING` |
  | `TRACK_PLANNING` | `pg_stat_statements.track_planning` off | `WARNING` |

- [x] Server checks in [postgres-inspection.ts](../../apps/api/src/modules/database-connections/postgres-inspection.ts); `readPgStatStatementsState` ([postgres-stats.ts](../../apps/api/src/modules/database-connections/postgres-stats.ts)) also backs `hasPgStatStatements`
- [x] Connect failures map to `DATABASE_HOST_UNREACHABLE`, `DATABASE_CONNECTION_TIMEOUT`, `DATABASE_AUTHENTICATION_FAILED`, `DATABASE_NAME_NOT_FOUND`, `DATABASE_SSL_FAILED`, else `DATABASE_CONNECTION_FAILED` ([postgres-errors.ts](../../apps/api/src/modules/database-connections/postgres-errors.ts)), for every connection (create, update, analysis)
- [x] Create and update check the name before connecting; the Prisma unique violation still covers races
- [x] Web: shadcn `dialog` in `@tomato/ui`. The create form's button is `Inspect database` and opens `InspectDatabaseDialog` ([inspect-database-dialog.tsx](../../apps/web/src/modules/databases/components/inspect-database-dialog.tsx)): checks with status badge and hint (`DATABASE_CHECK_*` in [databases.constants.ts](../../apps/web/src/modules/databases/databases.constants.ts)), `Inspect again`, and `Create database` (disabled on a `FAILED` check). The inspection query is never cached since its input holds the password
- [x] Limits: update (`PATCH /databases/:id`) is not inspected yet, it only gets the detailed error codes and the early name check
