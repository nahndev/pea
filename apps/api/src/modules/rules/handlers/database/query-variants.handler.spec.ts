import { RuleType } from '@tomato/constants';
import type { Rule } from '../../../../generated/client';
import { API_CONTEXT, DATABASE_CONTEXT, mockDatabaseConnections } from '../../../database-connections/database-connections.fixtures';
import { createQuerySubject } from '../../../database-connections/postgres-stats';
import { QueryVariantsHandler } from './query-variants.handler';

describe('QueryVariantsHandler', () => {
  const rule = (config: object = { maxItems: 20 }) => ({ id: 'r-1', type: RuleType.QUERY_VARIANTS, config }) as Rule;
  let query: jest.Mock;
  let queryVariantsHandler: QueryVariantsHandler;

  beforeEach(() => {
    query = jest.fn().mockResolvedValue({ rows: [{ shape: 'select * from orders where id in ($)', variants: 48, calls: 900 }] });
    queryVariantsHandler = new QueryVariantsHandler(mockDatabaseConnections(query));
  });

  it('reports each query shape with more query ids than the maximum', async () => {
    await expect(queryVariantsHandler.handle(rule(), DATABASE_CONTEXT)).resolves.toEqual([
      {
        ruleId: 'r-1',
        description: '48 query ids (900 calls) share this shape, above 20; use = ANY($1) or stable identifiers',
        subject: createQuerySubject('select * from orders where id in ($)'),
      },
    ]);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('count(DISTINCT queryid)'), [20, 100]);
  });

  it.each([
    [rule(), { ...DATABASE_CONTEXT, isPgStatStatements: false }],
    [rule({}), DATABASE_CONTEXT],
    [rule(), API_CONTEXT],
  ])('does not connect without pg_stat_statements, its config or a database', async (invalidRule, context) => {
    await expect(queryVariantsHandler.handle(invalidRule, context)).resolves.toEqual([]);
    expect(query).not.toHaveBeenCalled();
  });
});
