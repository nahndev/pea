import { DatabaseCheckStatus, DatabaseCheckType } from '@tomato/constants';
import type { StatusStyle } from '@/shared/components/status-badge';

export const DEFAULT_DATABASE_PORT = 5432;
export const POSTGRES_URL_PATTERN = /^postgres(ql)?:\/\//;

export const DATABASE_FIELD_ERRORS: Record<string, string> = {
  required: 'This field is required.',
  too_long: 'Must be at most 255 characters.',
  invalid: 'This value is not valid.',
  invalid_port: 'Enter a port between 1 and 65535.',
  invalid_connection_string: 'Enter a postgres:// or postgresql:// connection string.',
};

export const DATABASE_CHECK_LABEL: Record<DatabaseCheckType, string> = {
  [DatabaseCheckType.NAME]: 'Name',
  [DatabaseCheckType.CONNECTION]: 'Connection',
  [DatabaseCheckType.SERVER_VERSION]: 'PostgreSQL version',
  [DatabaseCheckType.PG_STAT_STATEMENTS_INSTALLED]: 'pg_stat_statements installed',
  [DatabaseCheckType.PG_STAT_STATEMENTS_PRELOADED]: 'pg_stat_statements preloaded',
  [DatabaseCheckType.READ_ALL_STATS]: 'pg_read_all_stats role',
  [DatabaseCheckType.TRACK_IO_TIMING]: 'track_io_timing',
  [DatabaseCheckType.TRACK_PLANNING]: 'pg_stat_statements.track_planning',
};

/** Shown on `WARNING` */
export const DATABASE_CHECK_HINT: Partial<Record<DatabaseCheckType, string>> = {
  [DatabaseCheckType.SERVER_VERSION]: 'PostgreSQL 13 or later is supported. Some rules may fail on older servers.',
  [DatabaseCheckType.PG_STAT_STATEMENTS_INSTALLED]: 'Run CREATE EXTENSION pg_stat_statements. Query rules and metrics are skipped without it.',
  [DatabaseCheckType.PG_STAT_STATEMENTS_PRELOADED]:
    'Add pg_stat_statements to shared_preload_libraries and restart the server. Query rules and metrics are skipped until then.',
  [DatabaseCheckType.READ_ALL_STATS]: 'Grant pg_read_all_stats to this user to analyze the queries of other users.',
  [DatabaseCheckType.TRACK_IO_TIMING]: 'Turn on track_io_timing for the I/O time and CPU-intensive query rules.',
  [DatabaseCheckType.TRACK_PLANNING]: 'Turn on pg_stat_statements.track_planning for the planning time rules.',
};

export const DATABASE_CHECK_STATUS_STYLE: Record<DatabaseCheckStatus, StatusStyle> = {
  [DatabaseCheckStatus.PASSED]: { label: 'Passed', intent: 'success' },
  [DatabaseCheckStatus.WARNING]: { label: 'Warning', intent: 'warning' },
  [DatabaseCheckStatus.FAILED]: { label: 'Failed', intent: 'danger' },
  [DatabaseCheckStatus.SKIPPED]: { label: 'Skipped', intent: 'neutral' },
};
