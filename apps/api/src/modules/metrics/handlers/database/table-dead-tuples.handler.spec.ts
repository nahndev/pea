import { MetricType, SubjectType } from '@tomato/constants';
import type { Metric } from '../../../../generated/client';
import { DATABASE_CONTEXT, mockDatabaseConnections } from '../../../database-connections/database-connections.fixtures';
import { createSubject } from '../../../subjects/subject';
import { TableDeadTuplesHandler } from './table-dead-tuples.handler';

describe('TableDeadTuplesHandler', () => {
  it('measures the dead tuples of every table, one subject per table', async () => {
    const query = jest.fn().mockResolvedValue({ rows: [{ schema: 'public', name: 'orders', value: 30 }] });
    const metric = { id: 'm-1', type: MetricType.TABLE_DEAD_TUPLES } as Metric;

    await expect(new TableDeadTuplesHandler(mockDatabaseConnections(query)).handle(metric, DATABASE_CONTEXT)).resolves.toEqual([
      { subject: createSubject(SubjectType.TABLE, 'public.orders'), value: 30 },
    ]);
  });
});
