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

- [ ] Add new rules base on:

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

- [ ]
- [ ]
- [ ]
