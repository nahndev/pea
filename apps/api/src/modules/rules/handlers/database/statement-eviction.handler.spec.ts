import { RuleType } from '@tomato/constants';
import type { Rule } from '../../../../generated/client';
import { API_CONTEXT, DATABASE_CONTEXT, mockDatabaseConnections } from '../../../database-connections/database-connections.fixtures';
import { StatementEvictionHandler } from './statement-eviction.handler';

describe('StatementEvictionHandler', () => {
  const rule = (config: object = { maxPercent: 90 }) => ({ id: 'r-1', type: RuleType.STATEMENT_EVICTION, config }) as Rule;
  const handle = (query: jest.Mock, context = DATABASE_CONTEXT) =>
    new StatementEvictionHandler(mockDatabaseConnections(query)).handle(rule(), context);
  const counts = (count: number, isInfo = true) => ({ rows: [{ count, max: 5000, isInfo }] });

  it('reports evictions since the last reset', async () => {
    const query = jest.fn().mockResolvedValueOnce(counts(1000)).mockResolvedValueOnce({ rows: [{ dealloc: 12 }] });

    await expect(handle(query)).resolves.toEqual([
      { ruleId: 'r-1', description: '1000 of 5000 statements tracked (20.0%), 12 evictions since reset; raise pg_stat_statements.max' },
    ]);
  });

  it('reports a nearly full statement table without pg_stat_statements_info', async () => {
    const query = jest.fn().mockResolvedValueOnce(counts(4800, false));

    await expect(handle(query)).resolves.toHaveLength(1);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('reports nothing below the share without evictions', async () => {
    await expect(handle(jest.fn().mockResolvedValueOnce(counts(1000)).mockResolvedValueOnce({ rows: [{ dealloc: 0 }] }))).resolves.toEqual([]);
  });

  it.each([
    [rule(), { ...DATABASE_CONTEXT, isPgStatStatements: false }],
    [rule({}), DATABASE_CONTEXT],
    [rule(), API_CONTEXT],
  ])('does not connect without pg_stat_statements, its config or a database', async (invalidRule, context) => {
    const query = jest.fn();
    await expect(new StatementEvictionHandler(mockDatabaseConnections(query)).handle(invalidRule, context)).resolves.toEqual([]);
    expect(query).not.toHaveBeenCalled();
  });
});
