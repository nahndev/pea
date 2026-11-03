import { RuleType, SubjectType } from '@tomato/constants';
import type { Rule } from '../../../../generated/client';
import { DATABASE_CONTEXT, mockDatabaseConnections } from '../../../database-connections/database-connections.fixtures';
import { createSubject } from '../../../subjects/subject';
import { UnusedIndexHandler } from './unused-index.handler';

describe('UnusedIndexHandler', () => {
  const rule = { id: 'r-1', type: RuleType.UNUSED_INDEX, config: { minRows: 1000 } as object } as Rule;

  it('reports each index never scanned, one subject per index', async () => {
    const query = jest.fn().mockResolvedValue({ rows: [{ schema: 'public', name: 'orders_note_idx', table: 'orders', size: '12 MB' }] });

    await expect(new UnusedIndexHandler(mockDatabaseConnections(query)).handle(rule, DATABASE_CONTEXT)).resolves.toEqual([
      {
        ruleId: 'r-1',
        description: 'Never scanned since statistics reset (12 MB on public.orders)',
        subject: createSubject(SubjectType.INDEX, 'public.orders_note_idx'),
      },
    ]);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('pg_stat_user_indexes'), [1000, 100]);
  });
});
