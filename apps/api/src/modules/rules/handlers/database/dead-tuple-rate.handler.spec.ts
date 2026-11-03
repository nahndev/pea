import { RuleType, SubjectType } from '@tomato/constants';
import type { Rule } from '../../../../generated/client';
import { DATABASE_CONTEXT, mockDatabaseConnections } from '../../../database-connections/database-connections.fixtures';
import { createSubject } from '../../../subjects/subject';
import { DeadTupleRateHandler } from './dead-tuple-rate.handler';

describe('DeadTupleRateHandler', () => {
  const rule = (config: object = { maxPercent: 20, minRows: 1000 }) => ({ id: 'r-1', type: RuleType.DEAD_TUPLE_RATE, config }) as Rule;

  it('reports each table with too many dead tuples', async () => {
    const query = jest.fn().mockResolvedValue({ rows: [{ schema: 'public', name: 'orders', dead: 12000, total: 36900, percent: 32.52 }] });

    await expect(new DeadTupleRateHandler(mockDatabaseConnections(query)).handle(rule(), DATABASE_CONTEXT)).resolves.toEqual([
      { ruleId: 'r-1', description: 'Dead tuples 32.5% (12000 of 36900 rows) exceeds 20%', subject: createSubject(SubjectType.TABLE, 'public.orders') },
    ]);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('pg_stat_user_tables'), [20, 1000, 100]);
  });

  it('does not connect without a minimum of rows', async () => {
    const query = jest.fn();

    await expect(new DeadTupleRateHandler(mockDatabaseConnections(query)).handle(rule({ maxPercent: 20 }), DATABASE_CONTEXT)).resolves.toEqual([]);
    expect(query).not.toHaveBeenCalled();
  });
});
