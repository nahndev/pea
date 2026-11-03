import { MetricType } from '@tomato/constants';
import type { Metric } from '../../../../generated/client';
import { DATABASE_CONTEXT, mockDatabaseConnections } from '../../../database-connections/database-connections.fixtures';
import { createQuerySubject } from '../../../database-connections/postgres-stats';
import { QueryMeanDurationHandler } from './query-mean-duration.handler';

describe('QueryMeanDurationHandler', () => {
  const metric = { id: 'm-1', type: MetricType.QUERY_MEAN_DURATION } as Metric;

  it('measures the busiest queries once per subject', async () => {
    const query = jest.fn().mockResolvedValue({
      rows: [
        { query: 'SELECT * FROM orders', value: 820 },
        { query: 'SELECT *\n  FROM orders', value: 10 },
        { query: 'SELECT 1', value: 0.1 },
      ],
    });

    await expect(new QueryMeanDurationHandler(mockDatabaseConnections(query)).handle(metric, DATABASE_CONTEXT)).resolves.toEqual([
      { subject: createQuerySubject('SELECT * FROM orders'), value: 820 },
      { subject: createQuerySubject('SELECT 1'), value: 0.1 },
    ]);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('pg_stat_statements'), [50]);
  });

  it('does not connect without pg_stat_statements', async () => {
    const query = jest.fn();

    await expect(
      new QueryMeanDurationHandler(mockDatabaseConnections(query)).handle(metric, { ...DATABASE_CONTEXT, isPgStatStatements: false }),
    ).resolves.toEqual([]);
    expect(query).not.toHaveBeenCalled();
  });
});
