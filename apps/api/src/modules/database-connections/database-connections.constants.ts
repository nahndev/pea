import { DatabaseCheckType, ErrorCode } from '@tomato/constants';

export const DEFAULT_DATABASE_PORT = 5432;

export const CONNECTION_CIPHER = 'aes-256-gcm';
export const CONNECTION_IV_LENGTH = 12;

export const CONNECTION_TIMEOUT_MS = 10_000;
export const STATEMENT_TIMEOUT_MS = 5 * 60 * 1000;

/** Postgres error code, e.g. `pg_stat_statements` installed but not preloaded */
export const OBJECT_NOT_IN_PREREQUISITE_STATE = '55000';
export const MAX_QUERY_SUBJECT_LENGTH = 1000;

export const MIN_SERVER_VERSION_NUM = 130000;

/** Checks run once connected, skipped when the connection fails */
export const SERVER_CHECK_TYPES = [
  DatabaseCheckType.SERVER_VERSION,
  DatabaseCheckType.PG_STAT_STATEMENTS_INSTALLED,
  DatabaseCheckType.PG_STAT_STATEMENTS_PRELOADED,
  DatabaseCheckType.READ_ALL_STATS,
  DatabaseCheckType.TRACK_IO_TIMING,
  DatabaseCheckType.TRACK_PLANNING,
] as const;

/** By Postgres SQLSTATE or Node.js system error code */
export const CONNECTION_ERROR_CODE_BY_CAUSE: Readonly<Record<string, ErrorCode>> = {
  '28000': ErrorCode.DATABASE_AUTHENTICATION_FAILED,
  '28P01': ErrorCode.DATABASE_AUTHENTICATION_FAILED,
  '3D000': ErrorCode.DATABASE_NAME_NOT_FOUND,
  ENOTFOUND: ErrorCode.DATABASE_HOST_UNREACHABLE,
  EAI_AGAIN: ErrorCode.DATABASE_HOST_UNREACHABLE,
  ECONNREFUSED: ErrorCode.DATABASE_HOST_UNREACHABLE,
  EHOSTUNREACH: ErrorCode.DATABASE_HOST_UNREACHABLE,
  ENETUNREACH: ErrorCode.DATABASE_HOST_UNREACHABLE,
  ETIMEDOUT: ErrorCode.DATABASE_CONNECTION_TIMEOUT,
};
