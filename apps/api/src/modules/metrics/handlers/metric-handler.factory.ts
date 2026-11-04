import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ErrorCode, MetricType } from '@tomato/constants';
import { EndpointPercentileHandler } from './api/endpoint-percentile.handler';
import { IssueCountHandler } from './common/issue-count.handler';
import type { MetricHandler } from './metric-handler.types';
import { PercentileHandler } from './api/percentile.handler';
import { TableRowsHandler } from './database/table-rows.handler';
import { DatabaseStatHandler } from './database/database-stat.handler';
import { TableDeadTuplesHandler } from './database/table-dead-tuples.handler';
import { QueryMeanDurationHandler } from './database/query-mean-duration.handler';
import { ErrorCountHandler } from './bug/error-count.handler';
import { ErrorOccurrencesHandler } from './bug/error-occurrences.handler';

@Injectable()
export class MetricHandlerFactory {
  private readonly handlers: ReadonlyMap<string, MetricHandler>;

  constructor(
    percentileHandler: PercentileHandler,
    issueCountHandler: IssueCountHandler,
    endpointPercentileHandler: EndpointPercentileHandler,
    tableRowsHandler: TableRowsHandler,
    databaseStatHandler: DatabaseStatHandler,
    tableDeadTuplesHandler: TableDeadTuplesHandler,
    queryMeanDurationHandler: QueryMeanDurationHandler,
    errorCountHandler: ErrorCountHandler,
    errorOccurrencesHandler: ErrorOccurrencesHandler,
  ) {
    this.handlers = new Map<string, MetricHandler>([
      [MetricType.P50, percentileHandler],
      [MetricType.P90, percentileHandler],
      [MetricType.P95, percentileHandler],
      [MetricType.ENDPOINT_P95, endpointPercentileHandler],
      [MetricType.BLOCKER_ISSUE_COUNT, issueCountHandler],
      [MetricType.HIGH_ISSUE_COUNT, issueCountHandler],
      [MetricType.MEDIUM_ISSUE_COUNT, issueCountHandler],
      [MetricType.LOW_ISSUE_COUNT, issueCountHandler],
      [MetricType.INFO_ISSUE_COUNT, issueCountHandler],
      [MetricType.TABLE_ROWS, tableRowsHandler],
      [MetricType.CACHE_HIT_RATIO, databaseStatHandler],
      [MetricType.CONNECTIONS, databaseStatHandler],
      [MetricType.WAITING_LOCKS, databaseStatHandler],
      [MetricType.DEADLOCKS, databaseStatHandler],
      [MetricType.TEMP_FILES, databaseStatHandler],
      [MetricType.REPLICATION_LAG, databaseStatHandler],
      [MetricType.TABLE_DEAD_TUPLES, tableDeadTuplesHandler],
      [MetricType.QUERY_MEAN_DURATION, queryMeanDurationHandler],
      [MetricType.ERROR_COUNT, errorCountHandler],
      [MetricType.CRITICAL_ERROR_COUNT, errorCountHandler],
      [MetricType.ERROR_GROUP_COUNT, errorCountHandler],
      [MetricType.ERROR_OCCURRENCES, errorOccurrencesHandler],
    ]);
  }

  supports(type: string): boolean {
    return this.handlers.has(type);
  }

  create(type: string): MetricHandler {
    const handler = this.handlers.get(type);
    if (!handler) throw new UnprocessableEntityException({ code: ErrorCode.METRIC_TYPE_UNSUPPORTED });
    return handler;
  }
}
