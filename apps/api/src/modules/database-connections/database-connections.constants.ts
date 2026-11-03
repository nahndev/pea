export const DEFAULT_DATABASE_PORT = 5432;

export const CONNECTION_CIPHER = 'aes-256-gcm';
export const CONNECTION_IV_LENGTH = 12;

export const CONNECTION_TIMEOUT_MS = 10_000;
export const STATEMENT_TIMEOUT_MS = 5 * 60 * 1000;

/** Postgres error code, e.g. `pg_stat_statements` installed but not preloaded */
export const OBJECT_NOT_IN_PREREQUISITE_STATE = '55000';
export const MAX_QUERY_SUBJECT_LENGTH = 1000;
