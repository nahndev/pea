import { MetricType, Severity } from '@tomato/constants';
import { CACHE_HIT_RATIO_SQL } from '../database-connections/postgres-stats';
import { BUG_LOG_GROUP_COLUMN, BUG_LOG_IS_CRITICAL_COLUMN } from '../files/bug-log-events';
import {
  FRONTEND_DURATION_COLUMN,
  FRONTEND_IS_ABORTED_COLUMN,
  FRONTEND_IS_FROM_ROUTE_COLUMN,
  FRONTEND_LONG_FRAME_COLUMN,
  FRONTEND_REQUEST_COUNT_COLUMN,
  FRONTEND_VISIBLE_COLUMN,
} from '../files/frontend-page-loads';

/** Metric types shown as summary cards on an analysis */
export const SUMMARY_METRIC_TYPES = [MetricType.P50, MetricType.P90, MetricType.P95] as const;

export const MAX_METRIC_SUBJECT_FILTERS = 200;
/** Query subjects measured per analysis, by total execution time */
export const MAX_QUERY_SUBJECTS = 50;
/** Error groups measured per analysis, most frequent first */
export const MAX_ERROR_SUBJECTS = 50;

export const PERCENTILE_BY_METRIC_TYPE: ReadonlyMap<string, number> = new Map([
  [MetricType.P50, 0.5],
  [MetricType.P90, 0.9],
  [MetricType.P95, 0.95],
  [MetricType.ENDPOINT_P95, 0.95],
  [MetricType.PAGE_P95, 0.95],
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

/** Aggregate over the bug_log events of an analysis */
export const BUG_LOG_AGGREGATE_BY_METRIC_TYPE: ReadonlyMap<string, string> = new Map([
  [MetricType.ERROR_COUNT, 'count(*)'],
  [MetricType.CRITICAL_ERROR_COUNT, `count(*) FILTER (WHERE ${BUG_LOG_IS_CRITICAL_COLUMN})`],
  [MetricType.ERROR_GROUP_COUNT, `count(DISTINCT ${BUG_LOG_GROUP_COLUMN})`],
]);

/** Aggregate over the frontend_metric page loads of an analysis; a null value is not measured */
/** Load duration percentile of navigations from another route */
const fromRoutePercentile = (percentile: number) =>
  `quantile_cont(${FRONTEND_DURATION_COLUMN}, ${percentile}) FILTER (WHERE ${FRONTEND_IS_FROM_ROUTE_COLUMN})`;

export const FRONTEND_AGGREGATE_BY_METRIC_TYPE: ReadonlyMap<string, string> = new Map([
  [MetricType.VISIBLE_P95, `quantile_cont(${FRONTEND_VISIBLE_COLUMN}, 0.95)`],
  [MetricType.LONG_FRAME_P95, `quantile_cont(${FRONTEND_LONG_FRAME_COLUMN}, 0.95)`],
  [MetricType.REQUEST_COUNT_P95, `quantile_cont(${FRONTEND_REQUEST_COUNT_COLUMN}, 0.95)`],
  [MetricType.PAGE_LOAD_COUNT, 'count(*)'],
  [MetricType.ABORTED_PAGE_LOAD_RATE, `100 * avg(${FRONTEND_IS_ABORTED_COLUMN}::int)`],
  [MetricType.FROM_ROUTE_P50, fromRoutePercentile(0.5)],
  [MetricType.FROM_ROUTE_P90, fromRoutePercentile(0.9)],
  [MetricType.FROM_ROUTE_P95, fromRoutePercentile(0.95)],
]);
