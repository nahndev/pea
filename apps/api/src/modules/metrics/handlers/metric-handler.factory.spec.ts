import { UnprocessableEntityException } from '@nestjs/common';
import { ErrorCode, MetricType } from '@tomato/constants';
import { EndpointPercentileHandler } from './api/endpoint-percentile.handler';
import { IssueCountHandler } from './common/issue-count.handler';
import { MetricHandlerFactory } from './metric-handler.factory';
import { PercentileHandler } from './api/percentile.handler';
import { TableRowsHandler } from './database/table-rows.handler';
import { DatabaseStatHandler } from './database/database-stat.handler';
import { TableDeadTuplesHandler } from './database/table-dead-tuples.handler';
import { QueryMeanDurationHandler } from './database/query-mean-duration.handler';
import { ErrorCountHandler } from './bug/error-count.handler';
import { ErrorOccurrencesHandler } from './bug/error-occurrences.handler';

describe('MetricHandlerFactory', () => {
  const percentileHandler = {} as PercentileHandler;
  const issueCountHandler = {} as IssueCountHandler;
  const endpointPercentileHandler = {} as EndpointPercentileHandler;
  const tableRowsHandler = {} as TableRowsHandler;
  const databaseStatHandler = {} as DatabaseStatHandler;
  const tableDeadTuplesHandler = {} as TableDeadTuplesHandler;
  const queryMeanDurationHandler = {} as QueryMeanDurationHandler;
  const errorCountHandler = {} as ErrorCountHandler;
  const errorOccurrencesHandler = {} as ErrorOccurrencesHandler;
  const metricHandlerFactory = new MetricHandlerFactory(
    percentileHandler,
    issueCountHandler,
    endpointPercentileHandler,
    tableRowsHandler,
    databaseStatHandler,
    tableDeadTuplesHandler,
    queryMeanDurationHandler,
    errorCountHandler,
    errorOccurrencesHandler,
  );

  it.each([MetricType.P50, MetricType.P90, MetricType.P95])('returns the percentile handler for %s', (type) => {
    expect(metricHandlerFactory.create(type)).toBe(percentileHandler);
  });

  it('returns the endpoint percentile handler for ENDPOINT_P95', () => {
    expect(metricHandlerFactory.create(MetricType.ENDPOINT_P95)).toBe(endpointPercentileHandler);
  });

  it('returns the table rows handler for TABLE_ROWS', () => {
    expect(metricHandlerFactory.create(MetricType.TABLE_ROWS)).toBe(tableRowsHandler);
  });

  it.each([
    [MetricType.CACHE_HIT_RATIO, databaseStatHandler],
    [MetricType.CONNECTIONS, databaseStatHandler],
    [MetricType.WAITING_LOCKS, databaseStatHandler],
    [MetricType.DEADLOCKS, databaseStatHandler],
    [MetricType.TEMP_FILES, databaseStatHandler],
    [MetricType.REPLICATION_LAG, databaseStatHandler],
    [MetricType.TABLE_DEAD_TUPLES, tableDeadTuplesHandler],
    [MetricType.QUERY_MEAN_DURATION, queryMeanDurationHandler],
  ])('returns the database handler of %s', (type, handler) => {
    expect(metricHandlerFactory.create(type)).toBe(handler);
  });

  it.each([
    [MetricType.ERROR_COUNT, errorCountHandler],
    [MetricType.CRITICAL_ERROR_COUNT, errorCountHandler],
    [MetricType.ERROR_GROUP_COUNT, errorCountHandler],
    [MetricType.ERROR_OCCURRENCES, errorOccurrencesHandler],
  ])('returns the bug handler of %s', (type, handler) => {
    expect(metricHandlerFactory.create(type)).toBe(handler);
  });

  it.each([
    MetricType.BLOCKER_ISSUE_COUNT,
    MetricType.HIGH_ISSUE_COUNT,
    MetricType.MEDIUM_ISSUE_COUNT,
    MetricType.LOW_ISSUE_COUNT,
    MetricType.INFO_ISSUE_COUNT,
  ])('returns the issue count handler for %s', (type) => {
    expect(metricHandlerFactory.create(type)).toBe(issueCountHandler);
  });

  it('supports every metric type', () => {
    for (const type of Object.values(MetricType)) expect(metricHandlerFactory.supports(type)).toBe(true);
  });

  it('throws METRIC_TYPE_UNSUPPORTED when no handler exists', () => {
    expect.assertions(2);
    expect(metricHandlerFactory.supports('UNKNOWN')).toBe(false);
    try {
      metricHandlerFactory.create('UNKNOWN');
    } catch (error) {
      expect((error as UnprocessableEntityException).getResponse()).toEqual({
        code: ErrorCode.METRIC_TYPE_UNSUPPORTED,
      });
    }
  });
});
