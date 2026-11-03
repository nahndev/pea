import { MetricType, Severity } from '@tomato/constants';
import { CACHE_HIT_RATIO_SQL } from '../database-connections/postgres-stats';

export const MAX_METRIC_SUBJECT_FILTERS = 200;
/** Query subjects measured per analysis, by total execution time */
export const MAX_QUERY_SUBJECTS = 50;

export const PERCENTILE_BY_METRIC_TYPE: ReadonlyMap<string, number> = new Map([
  [MetricType.P50, 0.5],
  [MetricType.P90, 0.9],
  [MetricType.P95, 0.95],
  [MetricType.ENDPOINT_P95, 0.95],
]);

export const SEVERITY_BY_METRIC_TYPE: ReadonlyMap<string, Severity> = new Map([
  [MetricType.BLOCKER_ISSUE_COUNT, Severity.BLOCKER],
  [MetricType.HIGH_ISSUE_COUNT, Severity.HIGH],
  [MetricType.MEDIUM_ISSUE_COUNT, Severity.MEDIUM],
  [MetricType.LOW_ISSUE_COUNT, Severity.LOW],
  [MetricType.INFO_ISSUE_COUNT, Severity.INFO],
]);

const currentDatabaseStat = (column: string) =>
  `SELECT ${column}::float8 AS value FROM pg_stat_database WHERE datname = current_database()`;

/** One `value` row for the analysed database; a null value is not measured. Counters are cumulative since statistics reset. */
export const DATABASE_STAT_SQL_BY_METRIC_TYPE: ReadonlyMap<string, string> = new Map([
  [MetricType.CACHE_HIT_RATIO, CACHE_HIT_RATIO_SQL],
  [MetricType.CONNECTIONS, currentDatabaseStat('numbackends')],
  [MetricType.DEADLOCKS, currentDatabaseStat('deadlocks')],
  [MetricType.TEMP_FILES, currentDatabaseStat('temp_files')],
  [
    MetricType.WAITING_LOCKS,
    'SELECT count(*)::float8 AS value FROM pg_locks l JOIN pg_stat_activity a ON a.pid = l.pid WHERE NOT l.granted AND a.datname = current_database()',
  ],
  [MetricType.REPLICATION_LAG, 'SELECT (extract(epoch FROM max(replay_lag)) * 1000)::float8 AS value FROM pg_stat_replication'],
]);
