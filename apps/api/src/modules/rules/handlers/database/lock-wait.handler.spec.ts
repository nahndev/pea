import { RuleType } from '@tomato/constants';
import type { Rule } from '../../../../generated/client';
import { DATABASE_CONTEXT, mockDatabaseConnections } from '../../../database-connections/database-connections.fixtures';
import { createQuerySubject } from '../../../database-connections/postgres-stats';
import { LockWaitHandler } from './lock-wait.handler';

describe('LockWaitHandler', () => {
  const rule = { id: 'r-1', type: RuleType.LOCK_WAIT, config: { thresholdMs: 5000 } as object } as Rule;

  it('reports each query waiting for a lock longer than the threshold, with its blockers', async () => {
    const query = jest.fn().mockResolvedValue({
      rows: [
        { pid: 7, query: 'DELETE FROM orders', mode: 'RowExclusiveLock', target: 'public.orders', durationMs: 6200, blockedBy: [3, 4] },
        { pid: 8, query: 'SELECT 1', mode: 'ShareLock', target: 'transactionid', durationMs: 5100, blockedBy: [] },
      ],
    });

    const issues = await new LockWaitHandler(mockDatabaseConnections(query)).handle(rule, DATABASE_CONTEXT);

    expect(query).toHaveBeenCalledWith(expect.stringContaining('pg_locks'), [5000, 100]);
    expect(issues.map(({ description }) => description)).toEqual([
      'Waiting for RowExclusiveLock on public.orders for 6200ms (pid 7, blocked by 3, 4)',
      'Waiting for ShareLock on transactionid for 5100ms (pid 8)',
    ]);
    expect(issues[0].subject).toEqual(createQuerySubject('DELETE FROM orders'));
  });
});
