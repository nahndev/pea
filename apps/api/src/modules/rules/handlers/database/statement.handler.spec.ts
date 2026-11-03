import { RuleType } from '@tomato/constants';
import type { Rule } from '../../../../generated/client';
import { API_CONTEXT, DATABASE_CONTEXT, mockDatabaseConnections } from '../../../database-connections/database-connections.fixtures';
import { createQuerySubject } from '../../../database-connections/postgres-stats';
import { StatementHandler } from './statement.handler';
import { STATEMENT_RULE_BY_RULE_TYPE } from './statement-rules.constants';

describe('StatementHandler', () => {
  const rule = (type: string = RuleType.MAX_TIME_SPIKE_QUERY, config: object = { thresholdMs: 1000, maxRatio: 10, minCalls: 5 }) =>
    ({ id: 'r-1', type, config }) as Rule;
  let query: jest.Mock;
  let statementHandler: StatementHandler;

  beforeEach(() => {
    query = jest.fn().mockResolvedValue({ rows: [{ query: 'SELECT * FROM orders WHERE id = $1', calls: 40, value: 4000, detail: 200 }] });
    statementHandler = new StatementHandler(mockDatabaseConnections(query));
  });

  it('binds the config fields of the rule in order, then the issue limit', async () => {
    await expect(statementHandler.handle(rule(), DATABASE_CONTEXT)).resolves.toEqual([
      {
        ruleId: 'r-1',
        description: 'Max 4000.0ms is 20.0× the mean 200.0ms',
        subject: createQuerySubject('SELECT * FROM orders WHERE id = $1'),
      },
    ]);
    const [sql, values] = query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('FROM queries CROSS JOIN totals');
    expect(sql).toContain('max_ms > $1 AND max_ms > mean_ms * $2 AND calls >= $3');
    expect(sql).toContain('LIMIT $4');
    expect(values).toEqual([1000, 10, 5, 100]);
  });

  it('defines a statement rule only with config fields it can bind', () => {
    for (const [type, { params, condition }] of STATEMENT_RULE_BY_RULE_TYPE) {
      for (const [index] of params.entries()) expect([type, condition.includes(`$${index + 1}`)]).toEqual([type, true]);
      expect([type, condition.includes(`$${params.length + 1}`)]).toEqual([type, false]);
    }
  });

  it.each([
    [rule(), { ...DATABASE_CONTEXT, isPgStatStatements: false }],
    [rule(RuleType.MAX_TIME_SPIKE_QUERY, { thresholdMs: 1000 }), DATABASE_CONTEXT],
    [rule(RuleType.SLOW_QUERY), DATABASE_CONTEXT],
    [rule(), API_CONTEXT],
  ])('does not connect without pg_stat_statements, its config, a statement rule or a database', async (invalidRule, context) => {
    await expect(statementHandler.handle(invalidRule, context)).resolves.toEqual([]);
    expect(query).not.toHaveBeenCalled();
  });
});
