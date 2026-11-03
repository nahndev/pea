# Support rules and metrics for database schema

## Currently

- A `DATABASE` analysis connects read-only to a saved database ([databases.service.ts](../../apps/api/src/modules/databases/databases.service.ts)) and only measures `TABLE_ROWS` ([table-rows.handler.ts](../../apps/api/src/modules/metrics/handlers/database/table-rows.handler.ts)): exact `count(*)` per readable table, subject `TABLE` = `schema.table`.
- Rules: every `RuleType` ([rule-type.constants.ts](../../packages/constants/src/rule-type.constants.ts)) reads the API metric log (`apiData.path`) through DuckDB; all handlers live in [rules/handlers/api/](../../apps/api/src/modules/rules/handlers/api/) and there is no `rules/handlers/database/`. [seed.ts](../../apps/api/prisma/seed.ts) seeds no `DATABASE` rule, so a database analysis always has 0 issues.
- Rule creation in the web clones a base rule of the same schema ([rule-base-step.tsx](../../apps/web/src/modules/rules/components/rule-base-step.tsx)), so no `DATABASE` rule can be created from the UI. Rule config fields (`thresholdMs`, `maxPercent`, `minRequests` in `CONFIG_FIELDS_BY_RULE_TYPE`, [rules.constants.ts](../../apps/api/src/modules/rules/rules.constants.ts)) are all API-oriented.
- Metrics: the seed only adds `TABLE_ROWS` for `DATABASE`; the `*_ISSUE_COUNT` metrics ([common/issue-count.handler.ts](../../apps/api/src/modules/metrics/handlers/common/issue-count.handler.ts)) are schema-agnostic but seeded for `API` only. Conditions can therefore only target `TABLE_ROWS` for database analyses.
- `TABLE_ROWS` runs one `count(*)` per table inside the 5-minute statement timeout (`STATEMENT_TIMEOUT_MS`); large databases make it slow, and every other database metric would add more queries on the same connection (`withClient`).
- Web: [database-trend-chart.tsx](../../apps/web/src/modules/metrics/components/database-trend-chart.tsx) has no default metrics (`defaultMetrics="The default metrics"` placeholder), and labels/units for new types must be added in [metrics.constants.ts](../../apps/web/src/modules/metrics/metrics.constants.ts) and `RULE_TYPE_LABEL` ([issues.constants.ts](../../apps/web/src/modules/issues/issues.constants.ts)), plus a config component in [rule-config.factory.tsx](../../apps/web/src/modules/rules/components/rule-config/rule-config.factory.tsx).

## Acceptance Criteria

- [x] Support rules and metrics for `DATABASE` analyses
- [x] Based on the main PostgreSQL statistics views:
  - [x] `pg_stat_activity`: current connections and running queries, their state, duration and what they are waiting on
  - [x] `pg_stat_statements`: statistics per query pattern (calls, total/mean time); requires the extension, but is the most valuable source
  - [x] `pg_stat_user_tables`: sequential and index scans, inserted/updated/deleted rows, dead tuples, last vacuum
  - [x] `pg_stat_user_indexes`: usage of each index
  - [x] `pg_locks`: locks held and awaited
  - [x] `pg_stat_database`: cache hits, deadlocks and temp files per database
  - [x] `pg_stat_replication`: replica state and lag

## Solutions

- [x] Rules ([rules/handlers/database/](../../apps/api/src/modules/rules/handlers/database/)), seeded for `DATABASE`, at most 100 issues each (`MAX_DATABASE_ISSUES`):

  | Rule | View | Config | Subject |
  | --- | --- | --- | --- |
  | `SLOW_QUERY` | `pg_stat_statements` | `thresholdMs`, `minCalls` | `QUERY` |
  | `LONG_RUNNING_QUERY` (incl. idle in transaction) | `pg_stat_activity` | `thresholdMs` | `QUERY` |
  | `LOCK_WAIT` (with blocking pids) | `pg_locks` | `thresholdMs` | `QUERY` |
  | `DEAD_TUPLE_RATE` | `pg_stat_user_tables` | `maxPercent`, `minRows` | `TABLE` |
  | `SEQ_SCAN_RATE` (missing index hint) | `pg_stat_user_tables` | `maxPercent`, `minRows` | `TABLE` |
  | `UNUSED_INDEX` (unique/primary excluded) | `pg_stat_user_indexes` | `minRows` | `INDEX` (new) |
  | `LOW_CACHE_HIT_RATIO` | `pg_stat_database` | `minPercent` | default |

- [x] Metrics ([metrics/handlers/database/](../../apps/api/src/modules/metrics/handlers/database/)): `CACHE_HIT_RATIO` (new unit `PERCENT`), `CONNECTIONS`, `WAITING_LOCKS` (`pg_locks`), `DEADLOCKS`, `TEMP_FILES`, `REPLICATION_LAG` (`pg_stat_replication`, not measured without replicas) through one `DatabaseStatHandler`; `TABLE_DEAD_TUPLES` per table; `QUERY_MEAN_DURATION` for the 50 busiest queries; issue counts now seeded for `DATABASE` too
- [x] `RuleHandler` / `MetricHandler` receive an `AnalysisContext` (`ApiAnalysisContext { logPath }` | `DatabaseAnalysisContext { connection, isPgStatStatements }`) built once per run by `AnalysisContextFactory`, instead of the analysis
- [x] `pg_stat_statements` is optional: `isPgStatStatements` is false when it is not installed or not preloaded (`55000`), and its rule/metric report nothing; query subjects collapse whitespace and keep 1000 characters
- [x] New rule config fields `minCalls`, `minRows`, `minPercent` (API DTO + web form); web labels, `%` formatting, a config form per rule; database trend defaults to connections, waiting locks and deadlocks
- [x] Seeded conditions: blocker/high issue counts > 0 for `DATABASE`
- [x] Limits: `pg_stat_*` counters are cumulative since the last statistics reset; other users' query text needs `pg_read_all_stats`; written for PostgreSQL 13+ (`total_exec_time`)
