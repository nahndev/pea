# Support more rules based on pg_stat_statements

## Currently

- `pg_stat_statements` backs only one rule, `SLOW_QUERY` ([slow-query.handler.ts](../../apps/api/src/modules/rules/handlers/database/slow-query.handler.ts)): mean `total_exec_time / calls` above `thresholdMs` for queries with at least `minCalls`, subject `QUERY`, at most `MAX_DATABASE_ISSUES`.
- The only other consumer is the `QUERY_MEAN_DURATION` metric ([query-mean-duration.handler.ts](../../apps/api/src/modules/metrics/handlers/database/query-mean-duration.handler.ts)) for the busiest queries; both group by `query` and filter by `dbid = CURRENT_DATABASE_ID_SQL` ([postgres-stats.ts](../../apps/api/src/modules/database-connections/postgres-stats.ts)).
- Most columns of the view are unused, so these problems are not reported:
  - Total time hogs: a fast query called very often (`total_exec_time` share of the database) is never flagged, since `SLOW_QUERY` only looks at the mean.
  - Unstable queries: high `stddev_exec_time` / `max_exec_time` vs mean.
  - Poor cache usage per query: `shared_blks_read` vs `shared_blks_hit`.
  - Disk spills: `temp_blks_written` (sorts/hashes exceeding `work_mem`).
  - Large result sets: `rows / calls`.
  - Planning overhead: `total_plan_time` (only when `pg_stat_statements.track_planning` is on).
- Rules are skipped when `isPgStatStatements` is false ([analysis-context.factory.ts](../../apps/api/src/modules/analyses/analysis-context.factory.ts)). Counters are cumulative since the last `pg_stat_statements_reset()` / server restart, not per analysis run.
- Adding a rule requires a new `RuleType` ([rule-type.constants.ts](../../packages/constants/src/rule-type.constants.ts)), a handler in the factory, config fields in `CONFIG_FIELDS_BY_RULE_TYPE` ([rules.constants.ts](../../apps/api/src/modules/rules/rules.constants.ts)) and DTO, a seed in [seed.ts](../../apps/api/prisma/seed.ts), and on the web a `RULE_TYPE_LABEL` ([issues.constants.ts](../../apps/web/src/modules/issues/issues.constants.ts)) plus a config component ([rule-config.factory.tsx](../../apps/web/src/modules/rules/components/rule-config/rule-config.factory.tsx)).

## Acceptance Criteria

- [x] Add new rules base on:

1. Queries with the highest total execution time
2. Queries with high mean execution time
3. Queries with spiking max execution time
4. Queries with unstable execution time (high stddev)
5. Queries with excessive call frequency
6. Suspected N+1 queries (many calls, few rows each)
7. Queries returning a large number of rows
8. SELECT queries without LIMIT
9. Queries using SELECT \*
10. Queries suspected of missing indexes (many blocks read per row)
11. Queries with heavy disk reads (high shared_blks_read)
12. Queries with low cache hit ratio
13. Queries dirtying many buffers (high shared_blks_dirtied)
14. Queries writing buffers directly (high shared_blks_written)
15. Queries using temp files (high temp_blks, exceeding work_mem)
16. Queries with heavy local buffer / temp table usage
17. Queries generating large WAL volume
18. Queries with high I/O time (blk_read_time / blk_write_time)
19. Queries with high planning time
20. Queries where plan time exceeds execution time
21. Queries with high JIT overhead
22. Queries paginating with OFFSET
23. Queries using LIKE / ILIKE
24. Queries wrapping columns in functions in WHERE
25. Queries using ORDER BY random()
26. Queries with very long IN lists
27. Frequently executed COUNT(\*) queries
28. UPDATE / DELETE without WHERE
29. UPDATE / DELETE affecting many rows per call
30. Row-by-row INSERTs instead of batching
31. Most CPU-intensive queries (high exec time, low I/O)
32. Most I/O-intensive queries
33. Query workload distribution by database
34. Query workload distribution by user / role
35. New queries or sudden changes between snapshots
36. Queries slower than baseline (performance regression)
37. Expensive utility commands (VACUUM, ANALYZE, CREATE INDEX, COPY...)
38. Queries executed inside functions / procedures (track = all)
39. Distinct query count exceeding pg_stat_statements.max (evictions, lost stats)
40. Non-parameterized queries creating too many queryids
41. Percentage of total system time per query
42. Read/write ratio of the system (SELECT vs DML)

## Solutions

- [x] `StatementHandler` ([statement.handler.ts](../../apps/api/src/modules/rules/handlers/database/statement.handler.ts)) runs one SQL per rule over `QUERY_STATEMENTS_SQL` ([postgres-stats.ts](../../apps/api/src/modules/database-connections/postgres-stats.ts)): one row per query text of the current database (`queries`) plus database totals (`totals`). Each rule in `STATEMENT_RULE_BY_RULE_TYPE` ([statement-rules.constants.ts](../../apps/api/src/modules/rules/handlers/database/statement-rules.constants.ts)) is a value, condition and order; its config fields are bound to `$1`, `$2`…, worst first, at most `MAX_DATABASE_ISSUES`, subject `QUERY`:

  | # | Rule | Config | Condition |
  | --- | --- | --- | --- |
  | 1 | `HIGH_TOTAL_TIME_QUERY` | `thresholdMs` | total exec time |
  | 2 | `SLOW_QUERY` (existing) | `thresholdMs`, `minCalls` | mean exec time |
  | 3 | `MAX_TIME_SPIKE_QUERY` | `thresholdMs`, `maxRatio`, `minCalls` | max above threshold and `maxRatio` × mean |
  | 4 | `UNSTABLE_QUERY` | `maxRatio`, `minCalls` | stddev / mean |
  | 5 | `FREQUENT_QUERY` | `minCalls` | calls |
  | 6 | `N_PLUS_ONE_QUERY` | `minCalls`, `maxRows` | SELECT with `= $n`, many calls, few rows per call |
  | 7 | `LARGE_RESULT_QUERY` | `maxRows`, `minCalls` | SELECT rows per call |
  | 8 | `UNLIMITED_SELECT_QUERY` | `maxRows`, `minCalls` | SELECT without LIMIT / FETCH and rows per call |
  | 9 | `SELECT_STAR_QUERY` | `minCalls` | `SELECT *` / `SELECT t.*` |
  | 10 | `MISSING_INDEX_QUERY` | `maxRatio`, `minCalls` | blocks read per row |
  | 11 | `DISK_READ_QUERY` | `maxBlocks`, `minCalls` | `shared_blks_read` per call |
  | 12 | `LOW_CACHE_HIT_QUERY` | `minPercent`, `minCalls` | per-query hit ratio |
  | 13 | `DIRTIED_BUFFERS_QUERY` | `maxBlocks`, `minCalls` | `shared_blks_dirtied` per call |
  | 14 | `WRITTEN_BUFFERS_QUERY` | `maxBlocks`, `minCalls` | `shared_blks_written` per call |
  | 15 | `TEMP_FILE_QUERY` | `maxBlocks`, `minCalls` | `temp_blks_written` per call |
  | 16 | `LOCAL_BUFFER_QUERY` | `maxBlocks`, `minCalls` | `local_blks_*` per call |
  | 17 | `HIGH_WAL_QUERY` | `maxBytes`, `minCalls` | `wal_bytes` per call |
  | 18 | `HIGH_IO_TIME_QUERY` | `thresholdMs`, `minCalls` | shared/local/temp read + write time per call |
  | 19 | `SLOW_PLANNING_QUERY` | `thresholdMs`, `minCalls` | mean plan time |
  | 20 | `PLAN_OVER_EXEC_QUERY` | `minCalls` | plan time > exec time |
  | 21 | `HIGH_JIT_QUERY` | `maxPercent`, `minCalls` | JIT share of exec time |
  | 22 | `OFFSET_PAGINATION_QUERY` | `minCalls` | `OFFSET` |
  | 23 | `LIKE_QUERY` | `minCalls` | `LIKE` / `ILIKE` / `~~` |
  | 24 | `FUNCTION_IN_WHERE_QUERY` | `minCalls` | `lower(col)`, `date_trunc(…, col)`… after WHERE |
  | 25 | `ORDER_BY_RANDOM_QUERY` | `minCalls` | `ORDER BY random()` |
  | 26 | `LONG_IN_LIST_QUERY` | `maxItems`, `minCalls` | longest `IN ($1, …)` |
  | 27 | `FREQUENT_COUNT_QUERY` | `minCalls` | `count(*)` / `count(1)` |
  | 28 | `UNFILTERED_WRITE_QUERY` | `minCalls` | UPDATE / DELETE without WHERE |
  | 29 | `MASS_WRITE_QUERY` | `maxRows`, `minCalls` | UPDATE / DELETE rows per call |
  | 30 | `ROW_BY_ROW_INSERT_QUERY` | `minCalls` | single-row `INSERT … VALUES` |
  | 31 | `CPU_INTENSIVE_QUERY` | `thresholdMs`, `maxPercent`, `minCalls` | exec minus I/O time per call, I/O share at most `maxPercent` |
  | 32 | `IO_INTENSIVE_QUERY` | `maxPercent` | share of database read/written blocks |
  | 37 | `EXPENSIVE_UTILITY_COMMAND` | `thresholdMs` | mean of VACUUM, ANALYZE, CLUSTER, REINDEX, COPY, TRUNCATE, REFRESH, ALTER TABLE, CREATE INDEX |
  | 38 | `NESTED_QUERY` | `thresholdMs`, `minCalls` | mean of `toplevel = false` entries |
  | 41 | `TIME_SHARE_QUERY` | `maxPercent` | share of database exec time |

- [x] Other rules, own handlers:

  | # | Rule | Handler | Config | Subject |
  | --- | --- | --- | --- | --- |
  | 33 | `DATABASE_WORKLOAD` | `WorkloadHandler` | `maxPercent` | `DATABASE` (new), only with ≥ 2 databases |
  | 34 | `ROLE_WORKLOAD` | `WorkloadHandler` | `maxPercent` | `ROLE` (new), only with ≥ 2 roles |
  | 35 | `CHANGED_QUERY` (new query, or share of exec time grew `maxRatio` ×) | `QuerySnapshotHandler` | `minCalls`, `maxRatio` | `QUERY` |
  | 36 | `REGRESSED_QUERY` (mean since previous run > `maxRatio` × previous mean) | `QuerySnapshotHandler` | `maxRatio`, `minCalls` | `QUERY` |
  | 39 | `STATEMENT_EVICTION` (`pg_stat_statements_info.dealloc` > 0, or entries > `maxPercent` of `pg_stat_statements.max`) | `StatementEvictionHandler` | `maxPercent` | default |
  | 40 | `QUERY_VARIANTS` (query ids per shape, `$n` lists and digits collapsed) | `QueryVariantsHandler` | `maxItems` | `QUERY` (shape) |
  | 42 | `READ_WRITE_RATIO` (write share of calls) | `ReadWriteRatioHandler` | `maxPercent` | default |

- [x] Snapshots: new table `database_query_stats` (one row per database: calls and exec time per query subject). `AnalysisContextFactory` reads the counters, swaps them with the saved ones (`DatabasesService.swapQueryStats`) and passes both in `DatabaseAnalysisContext.queryStats`; counters lower than the saved ones count as a statistics reset. No snapshot rule reports on the first run of a database
- [x] Versions: columns renamed or added after PostgreSQL 13 (`blk_*_time` → `shared_blk_*_time` in 17, `jit_*` and `temp_blk_*_time` in 15, `local_blk_*_time` and `jit_deform_time` in 17, `toplevel` in 14) are read through `to_jsonb(row)` and count as 0 when missing. Checked on PostgreSQL 15 and 17
- [x] Noise: query patterns only match statements starting with SELECT / WITH / INSERT / UPDATE / DELETE / MERGE / TABLE / VALUES (not DO blocks or function bodies), and queries over `pg_stat_statements` (monitoring, including this analysis) are excluded from `queries`
- [x] New rule config fields `maxRatio`, `maxRows`, `maxBlocks`, `maxBytes`, `maxItems` (DTO, `CONFIG_FIELDS_BY_RULE_TYPE`, web zod schemas and inputs); all rules seeded for `DATABASE`; web labels and one shared config form (`PgStatStatementsRuleConfig` with a hint per type from `PG_STAT_STATEMENTS_RULE_CONFIG`)
- [x] Limits: text rules are heuristics on normalized query text (an `OFFSET $1` or `LIKE $1` value is unknown; PostgreSQL 18 squashes IN lists, so `LONG_IN_LIST_QUERY` sees one item). `HIGH_IO_TIME_QUERY` / `CPU_INTENSIVE_QUERY` need `track_io_timing`, planning rules need `pg_stat_statements.track_planning`, `NESTED_QUERY` needs `pg_stat_statements.track = all`. The max and stddev of a query text split over several roles are the largest of its entries
