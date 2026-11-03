import { SubjectType } from '@tomato/constants';
import type { Client } from 'pg';
import { createSubject, type SubjectSource } from '../subjects/subject';
import { MAX_QUERY_SUBJECT_LENGTH, OBJECT_NOT_IN_PREREQUISITE_STATE } from './database-connections.constants';

export const CURRENT_DATABASE_ID_SQL = '(SELECT oid FROM pg_database WHERE datname = current_database())';

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
