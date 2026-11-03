import { MetricType } from '@tomato/constants';
import type { Metric } from '../../../../generated/client';
import { DATABASE_CONTEXT, mockDatabaseConnections } from '../../../database-connections/database-connections.fixtures';
import { DATABASE_STAT_SQL_BY_METRIC_TYPE } from '../../metrics.constants';
import { DatabaseStatHandler } from './database-stat.handler';

describe('DatabaseStatHandler', () => {
  const metric = (type: string) => ({ id: 'm-1', type }) as Metric;

  it.each([...DATABASE_STAT_SQL_BY_METRIC_TYPE])('measures %s with its own query', async (type, sql) => {
    const query = jest.fn().mockResolvedValue({ rows: [{ value: 12 }] });

    await expect(new DatabaseStatHandler(mockDatabaseConnections(query)).handle(metric(type), DATABASE_CONTEXT)).resolves.toEqual([{ value: 12 }]);
    expect(query).toHaveBeenCalledWith(sql);
  });

  it('measures nothing when the value is unknown, e.g. without replicas', async () => {
    const query = jest.fn().mockResolvedValue({ rows: [{ value: null }] });

    await expect(new DatabaseStatHandler(mockDatabaseConnections(query)).handle(metric(MetricType.REPLICATION_LAG), DATABASE_CONTEXT)).resolves.toEqual([]);
  });

  it('does not connect for another metric type', async () => {
    const query = jest.fn();

    await expect(new DatabaseStatHandler(mockDatabaseConnections(query)).handle(metric(MetricType.P50), DATABASE_CONTEXT)).resolves.toEqual([]);
    expect(query).not.toHaveBeenCalled();
  });
});
