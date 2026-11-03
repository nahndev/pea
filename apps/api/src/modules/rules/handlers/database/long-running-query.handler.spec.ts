import { RuleType } from '@tomato/constants';
import type { Rule } from '../../../../generated/client';
import { DATABASE_CONTEXT, mockDatabaseConnections } from '../../../database-connections/database-connections.fixtures';
import { createQuerySubject } from '../../../database-connections/postgres-stats';
import { LongRunningQueryHandler } from './long-running-query.handler';

describe('LongRunningQueryHandler', () => {
  const rule = (config: object = { thresholdMs: 60000 }) => ({ id: 'r-1', type: RuleType.LONG_RUNNING_QUERY, config }) as Rule;

  it('reports each session running longer than the threshold', async () => {
    const query = jest.fn().mockResolvedValue({
      rows: [{ pid: 42, state: 'idle in transaction', query: 'UPDATE orders SET paid = true', durationMs: 75210.4 }],
    });

    await expect(new LongRunningQueryHandler(mockDatabaseConnections(query)).handle(rule(), DATABASE_CONTEXT)).resolves.toEqual([
      {
        ruleId: 'r-1',
        description: 'Running for 75210ms (idle in transaction, pid 42) exceeds threshold 60000ms',
        subject: createQuerySubject('UPDATE orders SET paid = true'),
      },
    ]);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('pg_stat_activity'), [60000, 100]);
  });

  it('does not connect without a threshold', async () => {
    const query = jest.fn();

    await expect(new LongRunningQueryHandler(mockDatabaseConnections(query)).handle(rule({}), DATABASE_CONTEXT)).resolves.toEqual([]);
    expect(query).not.toHaveBeenCalled();
  });
});
