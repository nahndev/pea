import { DatabaseCheckStatus, DatabaseCheckType } from '@tomato/constants';
import type { DatabaseCheck } from '@tomato/types';
import type { Client } from 'pg';
import { MIN_SERVER_VERSION_NUM } from './database-connections.constants';
import { readPgStatStatementsState } from './postgres-stats';

interface ServerRow {
  version: string;
  versionNum: number;
  canReadAllStats: boolean;
  isTrackIoTiming: boolean;
}

const SERVER_SQL = `
SELECT current_setting('server_version') AS "version",
  current_setting('server_version_num')::int AS "versionNum",
  pg_has_role('pg_read_all_stats', 'USAGE') AS "canReadAllStats",
  current_setting('track_io_timing')::bool AS "isTrackIoTiming"
`;

const TRACK_PLANNING_SQL = `SELECT coalesce(current_setting('pg_stat_statements.track_planning', true)::bool, false) AS "isTrackPlanning"`;

const check = (type: DatabaseCheckType, isPassed: boolean, value?: string): DatabaseCheck => ({
  type,
  status: isPassed ? DatabaseCheckStatus.PASSED : DatabaseCheckStatus.WARNING,
  ...(value !== undefined && { value }),
});

export const skippedCheck = (type: DatabaseCheckType): DatabaseCheck => ({ type, status: DatabaseCheckStatus.SKIPPED });

/** What limits the analysis of a connected database; never fails. */
export async function inspectServer(client: Client): Promise<DatabaseCheck[]> {
  const {
    rows: [server],
  } = await client.query<ServerRow>(SERVER_SQL);
  const { isInstalled, isPreloaded } = await readPgStatStatementsState(client);
  const isTrackPlanning = isPreloaded && (await client.query<{ isTrackPlanning: boolean }>(TRACK_PLANNING_SQL)).rows[0].isTrackPlanning;
  return [
    check(DatabaseCheckType.SERVER_VERSION, server.versionNum >= MIN_SERVER_VERSION_NUM, server.version),
    check(DatabaseCheckType.PG_STAT_STATEMENTS_INSTALLED, isInstalled),
    isInstalled ? check(DatabaseCheckType.PG_STAT_STATEMENTS_PRELOADED, isPreloaded) : skippedCheck(DatabaseCheckType.PG_STAT_STATEMENTS_PRELOADED),
    check(DatabaseCheckType.READ_ALL_STATS, server.canReadAllStats),
    check(DatabaseCheckType.TRACK_IO_TIMING, server.isTrackIoTiming),
    isPreloaded ? check(DatabaseCheckType.TRACK_PLANNING, isTrackPlanning) : skippedCheck(DatabaseCheckType.TRACK_PLANNING),
  ];
}
