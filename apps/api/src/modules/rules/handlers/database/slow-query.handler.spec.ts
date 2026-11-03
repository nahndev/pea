import { RuleType } from '@tomato/constants';
import type { Rule } from '../../../../generated/client';
import { API_CONTEXT, DATABASE_CONTEXT, mockDatabaseConnections } from '../../../database-connections/database-connections.fixtures';
import { createQuerySubject } from '../../../database-connections/postgres-stats';
import { SlowQueryHandler } from './slow-query.handler';

describe('SlowQueryHandler', () => {
  const rule = (config: object = { thresholdMs: 500, minCalls: 10 }) => ({ id: 'r-1', type: RuleType.SLOW_QUERY, config }) as Rule;
  let query: jest.Mock;
  let slowQueryHandler: SlowQueryHandler;

  beforeEach(() => {
    query = jest.fn().mockResolvedValue({ rows: [{ query: 'SELECT * FROM orders WHERE id = $1', calls: 25, meanMs: 820 }] });
    slowQueryHandler = new SlowQueryHandler(mockDatabaseConnections(query));
  });

  it('reports each query slower than the threshold on average', async () => {
    await expect(slowQueryHandler.handle(rule(), DATABASE_CONTEXT)).resolves.toEqual([
      {
        ruleId: 'r-1',
        description: 'Mean 820.0ms over 25 calls exceeds threshold 500ms',
        subject: createQuerySubject('SELECT * FROM orders WHERE id = $1'),
      },
    ]);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('pg_stat_statements'), [500, 10, 100]);
  });

  it.each([
    [rule(), { ...DATABASE_CONTEXT, isPgStatStatements: false }],
    [rule({ thresholdMs: 500 }), DATABASE_CONTEXT],
    [rule(), API_CONTEXT],
  ])('does not connect without pg_stat_statements, its config or a database', async (invalidRule, context) => {
    await expect(slowQueryHandler.handle(invalidRule, context)).resolves.toEqual([]);
    expect(query).not.toHaveBeenCalled();
  });
});
