import { RuleType } from '@tomato/constants';
import type { Rule } from '../../../../generated/client';
import type { DatabaseAnalysisContext } from '../../../analyses/analyses.types';
import { API_CONTEXT, DATABASE_CONTEXT } from '../../../database-connections/database-connections.fixtures';
import { createQuerySubject } from '../../../database-connections/postgres-stats';
import { QuerySnapshotHandler } from './query-snapshot.handler';

describe('QuerySnapshotHandler', () => {
  const rule = (type: string, config: object = { minCalls: 10, maxRatio: 2 }) => ({ id: 'r-1', type, config }) as Rule;
  const stable = createQuerySubject('SELECT * FROM orders WHERE id = $1');
  const slower = createQuerySubject('SELECT * FROM users WHERE id = $1');
  const fresh = createQuerySubject('SELECT * FROM carts WHERE id = $1');
  const context: DatabaseAnalysisContext = {
    ...DATABASE_CONTEXT,
    queryStats: {
      current: [
        { subject: stable, calls: 200, execMs: 2000 },
        { subject: slower, calls: 120, execMs: 2200 },
        { subject: fresh, calls: 50, execMs: 500 },
      ],
      previous: {
        takenAt: new Date('2026-11-01T00:00:00Z'),
        queries: { [stable.uuid]: { calls: 100, execMs: 1000 }, [slower.uuid]: { calls: 100, execMs: 200 } },
      },
    },
  };
  const querySnapshotHandler = new QuerySnapshotHandler();

  it('reports new queries and queries whose share of execution time grew', async () => {
    await expect(querySnapshotHandler.handle(rule(RuleType.CHANGED_QUERY), context)).resolves.toEqual([
      { ruleId: 'r-1', description: 'Share of execution time rose from 16.67% to 57.1% since the previous snapshot', subject: slower },
      { ruleId: 'r-1', description: 'New since the previous snapshot: 50 calls, 500ms', subject: fresh },
    ]);
  });

  it('reports queries slower than their previous mean over the calls since the snapshot', async () => {
    await expect(querySnapshotHandler.handle(rule(RuleType.REGRESSED_QUERY), context)).resolves.toEqual([
      { ruleId: 'r-1', description: 'Mean 100.0ms over the last 20 calls is 50.0× the baseline 2.00ms', subject: slower },
    ]);
  });

  it('compares all counters after a statistics reset', async () => {
    const reset: DatabaseAnalysisContext = {
      ...context,
      queryStats: { ...context.queryStats, current: [{ subject: stable, calls: 30, execMs: 900 }] },
    };

    await expect(querySnapshotHandler.handle(rule(RuleType.REGRESSED_QUERY), reset)).resolves.toEqual([
      { ruleId: 'r-1', description: 'Mean 30.0ms over the last 30 calls is 3.0× the baseline 10.00ms', subject: stable },
    ]);
  });

  it.each([
    [rule(RuleType.CHANGED_QUERY), { ...context, queryStats: { ...context.queryStats, previous: null } }],
    [rule(RuleType.CHANGED_QUERY, { minCalls: 10 }), context],
    [rule(RuleType.CHANGED_QUERY), API_CONTEXT],
  ])('reports nothing without a previous snapshot, its config or a database', async (invalidRule, invalidContext) => {
    await expect(querySnapshotHandler.handle(invalidRule, invalidContext)).resolves.toEqual([]);
  });
});
