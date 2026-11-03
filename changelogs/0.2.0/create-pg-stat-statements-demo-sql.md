# Create demo SQL for pg_stat_statements

## Currently

- There is no demo database for testing the `pg_stat_statements` rules/metrics. To see issues, you have to point a connection at a real database and generate load by hand.
- The only seed data is for API metrics ([seed/](../../seed/)); there is nothing for the database schema.
- [docker-compose.yml](../../docker-compose.yml) mounts `./docker/postgres/init.sql`, but that file does not exist. Postgres also starts without `shared_preload_libraries=pg_stat_statements`, so `isPgStatStatements` ([postgres-stats.ts](../../apps/api/src/modules/database-connections/postgres-stats.ts)) is false and the rules are skipped.
- Existing consumers that the demo has to trigger:
  - `SLOW_QUERY` rule ([slow-query.handler.ts](../../apps/api/src/modules/rules/handlers/database/slow-query.handler.ts)): mean time above `thresholdMs` with at least `minCalls`.
  - `QUERY_MEAN_DURATION` metric ([query-mean-duration.handler.ts](../../apps/api/src/modules/metrics/handlers/database/query-mean-duration.handler.ts)).
- The upcoming rules in [support-more-pg-stat-statements-rules.md](./support-more-pg-stat-statements-rules.md) (total time hogs, unstable queries, N+1, SELECT \*, missing indexes, temp spills, OFFSET pagination, UPDATE/DELETE without WHERE, ...) need workloads that set off each one, plus healthy queries that should not be flagged.
- Counters only add up since the last `pg_stat_statements_reset()` or server restart, so the demo needs to be repeatable from a clean state.

## Acceptance Criteria

- [x] Create in `/seed` a sql files
- [x] Active pg_stat_statements_reset
- [x] Create some tables
- [x] Create some queries, with some problems
- [x] What: I will demo issues and metrics on this database

## Solutions

- [x] [pg-stat-statements.demo.sql](../../seed/pg-stat-statements.demo.sql): drops/creates `pea_demo`, loads shop tables (1M `orders`, larger than the default `shared_buffers`), calls `pg_stat_statements_reset()`, then runs one workload per rule via `\gexec` (constants normalize to the same `queryid`).
- [x] [docker-compose.yml](../../docker-compose.yml): preload `pg_stat_statements` with `track=all`, `track_planning=on`, `track_io_timing=on` (needed by nested, planning and I/O time rules).
- [x] Run: `docker compose exec -T postgres psql -U tomato -d pea -v ON_ERROR_STOP=1 -f - < seed/pg-stat-statements.demo.sql` (~30s), then add a connection to `pea_demo` and analyze.
