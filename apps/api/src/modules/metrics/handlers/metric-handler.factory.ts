import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ErrorCode, MetricType } from '@tomato/constants';
import type { MetricHandler } from './metric-handler.types';
import { PercentileHandler } from './percentile.handler';

@Injectable()
export class MetricHandlerFactory {
  private readonly handlers: ReadonlyMap<string, MetricHandler>;

  constructor(percentileHandler: PercentileHandler) {
    this.handlers = new Map([
      [MetricType.P50, percentileHandler],
      [MetricType.P90, percentileHandler],
      [MetricType.P95, percentileHandler],
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
