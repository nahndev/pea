import { DatabaseCheckStatus, DatabaseCheckType } from '@tomato/constants';
import type { Client } from 'pg';
import { inspectServer } from './postgres-inspection';

describe('inspectServer', () => {
  const server = { version: '17.2', versionNum: 170002, canReadAllStats: true, isTrackIoTiming: true };
  const statusByType = async (query: jest.Mock) =>
    Object.fromEntries((await inspectServer({ query } as unknown as Client)).map(({ type, status }) => [type, status]));

  it('passes a server ready for every rule', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({ rows: [server] })
      .mockResolvedValueOnce({ rows: [{ isInstalled: true }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ isTrackPlanning: true }] });

    const checks = await inspectServer({ query } as unknown as Client);

    expect(checks).toContainEqual({ type: DatabaseCheckType.SERVER_VERSION, status: DatabaseCheckStatus.PASSED, value: '17.2' });
    expect(checks.every(({ status }) => status === DatabaseCheckStatus.PASSED)).toBe(true);
  });

  it('warns about an old server without pg_stat_statements and skips what depends on it', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({ rows: [{ ...server, version: '12.1', versionNum: 120001, canReadAllStats: false, isTrackIoTiming: false }] })
      .mockResolvedValueOnce({ rows: [{ isInstalled: false }] });

    await expect(statusByType(query)).resolves.toEqual({
      [DatabaseCheckType.SERVER_VERSION]: DatabaseCheckStatus.WARNING,
      [DatabaseCheckType.PG_STAT_STATEMENTS_INSTALLED]: DatabaseCheckStatus.WARNING,
      [DatabaseCheckType.PG_STAT_STATEMENTS_PRELOADED]: DatabaseCheckStatus.SKIPPED,
      [DatabaseCheckType.READ_ALL_STATS]: DatabaseCheckStatus.WARNING,
      [DatabaseCheckType.TRACK_IO_TIMING]: DatabaseCheckStatus.WARNING,
      [DatabaseCheckType.TRACK_PLANNING]: DatabaseCheckStatus.SKIPPED,
    });
  });

  it('warns when pg_stat_statements is installed but not preloaded', async () => {
    const notPreloaded = Object.assign(new Error('must be loaded via shared_preload_libraries'), { code: '55000' });
    const query = jest
      .fn()
      .mockResolvedValueOnce({ rows: [server] })
      .mockResolvedValueOnce({ rows: [{ isInstalled: true }] })
      .mockRejectedValueOnce(notPreloaded);

    const statuses = await statusByType(query);

    expect(statuses[DatabaseCheckType.PG_STAT_STATEMENTS_INSTALLED]).toBe(DatabaseCheckStatus.PASSED);
    expect(statuses[DatabaseCheckType.PG_STAT_STATEMENTS_PRELOADED]).toBe(DatabaseCheckStatus.WARNING);
    expect(statuses[DatabaseCheckType.TRACK_PLANNING]).toBe(DatabaseCheckStatus.SKIPPED);
  });
});
