import { RuleType } from '@tomato/constants';
import type { Rule } from '../../../../generated/client';
import { DATABASE_CONTEXT, mockDatabaseConnections } from '../../../database-connections/database-connections.fixtures';
import { LowCacheHitRatioHandler } from './low-cache-hit-ratio.handler';

describe('LowCacheHitRatioHandler', () => {
  const rule = { id: 'r-1', type: RuleType.LOW_CACHE_HIT_RATIO, config: { minPercent: 99 } as object } as Rule;
  const handle = (value: number | null) =>
    new LowCacheHitRatioHandler(mockDatabaseConnections(jest.fn().mockResolvedValue({ rows: [{ value }] }))).handle(rule, DATABASE_CONTEXT);

  it('reports a database-wide issue below the minimum', async () => {
    await expect(handle(93.456)).resolves.toEqual([{ ruleId: 'r-1', description: 'Cache hit ratio 93.46% is below 99%' }]);
  });

  it.each([99, 99.9, null])('reports nothing for a ratio of %s', async (value) => {
    await expect(handle(value)).resolves.toEqual([]);
  });
});
