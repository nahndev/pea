import { RuleType } from '@tomato/constants';
import type { Rule } from '../../../../generated/client';
import { API_CONTEXT, DATABASE_CONTEXT, mockDatabaseConnections } from '../../../database-connections/database-connections.fixtures';
import { ReadWriteRatioHandler } from './read-write-ratio.handler';

describe('ReadWriteRatioHandler', () => {
  const rule = (config: object = { maxPercent: 50 }) => ({ id: 'r-1', type: RuleType.READ_WRITE_RATIO, config }) as Rule;
  let query: jest.Mock;
  let readWriteRatioHandler: ReadWriteRatioHandler;

  beforeEach(() => {
    query = jest.fn().mockResolvedValue({ rows: [{ reads: 300, writes: 700 }] });
    readWriteRatioHandler = new ReadWriteRatioHandler(mockDatabaseConnections(query));
  });

  it('reports a write share above the maximum', async () => {
    await expect(readWriteRatioHandler.handle(rule(), DATABASE_CONTEXT)).resolves.toEqual([
      { ruleId: 'r-1', description: 'Writes are 70.0% of 1000 calls (300 reads, 700 writes), above 50%' },
    ]);
  });

  it.each([
    [{ reads: 900, writes: 100 }],
    [{ reads: 0, writes: 0 }],
  ])('reports nothing for a read-heavy or idle database', async (calls) => {
    query.mockResolvedValue({ rows: [calls] });
    await expect(readWriteRatioHandler.handle(rule(), DATABASE_CONTEXT)).resolves.toEqual([]);
  });

  it.each([
    [rule(), { ...DATABASE_CONTEXT, isPgStatStatements: false }],
    [rule({}), DATABASE_CONTEXT],
    [rule(), API_CONTEXT],
  ])('does not connect without pg_stat_statements, its config or a database', async (invalidRule, context) => {
    await expect(readWriteRatioHandler.handle(invalidRule, context)).resolves.toEqual([]);
    expect(query).not.toHaveBeenCalled();
  });
});
