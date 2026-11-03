import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ErrorCode, MetricType } from '@tomato/constants';
import { EndpointPercentileHandler } from './api/endpoint-percentile.handler';
import { IssueCountHandler } from './issue-count.handler';
import type { MetricHandler } from './metric-handler.types';
import { PercentileHandler } from './api/percentile.handler';
import { TableRowsHandler } from './database/table-rows.handler';

@Injectable()
export class MetricHandlerFactory {
  private readonly handlers: ReadonlyMap<string, MetricHandler>;

  constructor(
    percentileHandler: PercentileHandler,
    issueCountHandler: IssueCountHandler,
    endpointPercentileHandler: EndpointPercentileHandler,
    tableRowsHandler: TableRowsHandler,
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
