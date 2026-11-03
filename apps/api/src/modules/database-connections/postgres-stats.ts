import { SubjectType } from '@tomato/constants';
import type { Client } from 'pg';
import { createSubject, type SubjectSource } from '../subjects/subject';
import { MAX_QUERY_SUBJECT_LENGTH, OBJECT_NOT_IN_PREREQUISITE_STATE } from './database-connections.constants';
import type { QueryStat, SubjectQueryStat } from './database-connections.types';

export const CURRENT_DATABASE_ID_SQL = '(SELECT oid FROM pg_database WHERE datname = current_database())';

/** Columns renamed or added after PostgreSQL 13 are read from the row as JSON, 0 when missing. */
const optionalColumn = (...names: string[]) => `coalesce(${names.map((name) => `(j ->> '${name}')::float8`).join(', ')}, 0)`;

const IO_TIME_SQL = [
  optionalColumn('blk_read_time', 'shared_blk_read_time'),
  optionalColumn('blk_write_time', 'shared_blk_write_time'),
  optionalColumn('local_blk_read_time'),
  optionalColumn('local_blk_write_time'),
  optionalColumn('temp_blk_read_time'),
  optionalColumn('temp_blk_write_time'),
].join(' + ');

const JIT_TIME_SQL = ['jit_generation_time', 'jit_inlining_time', 'jit_optimization_time', 'jit_emission_time', 'jit_deform_time']
  .map((name) => optionalColumn(name))
  .join(' + ');

const IO_BLOCKS_SQL = 'shared_blks_read + shared_blks_written + local_blks_read + local_blks_written + temp_blks_read + temp_blks_written';

/** `queries`: one row per readable query text of the current database, monitoring queries excluded; `totals`: database-wide sums. */
export const QUERY_STATEMENTS_SQL = `
  WITH statements AS (
    SELECT s.*, to_jsonb(s) AS j FROM pg_stat_statements s WHERE s.dbid = ${CURRENT_DATABASE_ID_SQL}
  ),
  totals AS (
    SELECT sum(total_exec_time)::float8 AS total_exec_ms, sum(${IO_BLOCKS_SQL})::float8 AS total_io_blocks FROM statements
  ),
  queries AS (
    SELECT
      query,
      sum(calls)::float8 AS calls,
      sum(total_exec_time)::float8 AS exec_ms,
      (sum(total_exec_time) / sum(calls))::float8 AS mean_ms,
      max(max_exec_time)::float8 AS max_ms,
      max(stddev_exec_time)::float8 AS stddev_ms,
      sum(rows)::float8 AS rows,
      sum(plans)::float8 AS plans,
      sum(total_plan_time)::float8 AS plan_ms,
      sum(shared_blks_hit)::float8 AS shared_hit,
      sum(shared_blks_read)::float8 AS shared_read,
      sum(shared_blks_dirtied)::float8 AS shared_dirtied,
      sum(shared_blks_written)::float8 AS shared_written,
      sum(local_blks_hit + local_blks_read + local_blks_written)::float8 AS local_blocks,
      sum(temp_blks_written)::float8 AS temp_written,
      sum(${IO_BLOCKS_SQL})::float8 AS io_blocks,
      sum(wal_bytes)::float8 AS wal_bytes,
      sum(${IO_TIME_SQL})::float8 AS io_ms,
      sum(${JIT_TIME_SQL})::float8 AS jit_ms,
      coalesce(sum(calls) FILTER (WHERE (j ->> 'toplevel')::boolean IS FALSE), 0)::float8 AS nested_calls,
      coalesce(sum(total_exec_time) FILTER (WHERE (j ->> 'toplevel')::boolean IS FALSE), 0)::float8 AS nested_exec_ms
    FROM statements
    WHERE query <> '<insufficient privilege>' AND query NOT ILIKE '%pg_stat_statements%'
    GROUP BY query
    HAVING sum(calls) > 0
  )
`;

const QUERY_STATS_SQL = `
  SELECT query, sum(calls)::float8 AS calls, sum(total_exec_time)::float8 AS "execMs"
  FROM pg_stat_statements
  WHERE dbid = ${CURRENT_DATABASE_ID_SQL} AND query <> '<insufficient privilege>'
  GROUP BY query
`;

export const CACHE_HIT_RATIO_SQL = `
  SELECT (blks_hit * 100.0 / NULLIF(blks_hit + blks_read, 0))::float8 AS value
  FROM pg_stat_database
  WHERE datname = current_database()
`;

/** Whether `pg_stat_statements` is installed and preloaded, i.e. readable. */
export async function hasPgStatStatements(client: Client): Promise<boolean> {
  const { rows } = await client.query<{ isInstalled: boolean }>(`SELECT to_regclass('pg_stat_statements') IS NOT NULL AS "isInstalled"`);
  if (!rows[0]?.isInstalled) return false;
  try {
    await client.query('SELECT 1 FROM pg_stat_statements LIMIT 1');
    return true;
  } catch (error) {
    if ((error as { code?: string }).code === OBJECT_NOT_IN_PREREQUISITE_STATE) return false;
    throw error;
  }
}

export const createQuerySubject = (query: string): SubjectSource =>
  createSubject(SubjectType.QUERY, query.replace(/\s+/g, ' ').trim().slice(0, MAX_QUERY_SUBJECT_LENGTH));

/** Calls and execution time per query subject, summed when query texts collapse into the same subject. */
export async function readQueryStats(client: Client): Promise<SubjectQueryStat[]> {
  const { rows } = await client.query<{ query: string } & QueryStat>(QUERY_STATS_SQL);
  const stats = new Map<string, SubjectQueryStat>();
  for (const { query, calls, execMs } of rows) {
    const subject = createQuerySubject(query);
    const stat = stats.get(subject.uuid);
    if (stat) Object.assign(stat, { calls: stat.calls + calls, execMs: stat.execMs + execMs });
    else stats.set(subject.uuid, { subject, calls, execMs });
  }
  return [...stats.values()];
}
