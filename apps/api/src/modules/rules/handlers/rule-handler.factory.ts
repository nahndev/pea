import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ErrorCode, RuleType } from '@tomato/constants';
import { LatencyHandler } from './latency.handler';
import { RateHandler } from './rate.handler';
import { RouteErrorRateHandler } from './route-error-rate.handler';
import type { RuleHandler } from './rule-handler.types';
import { SlowApiHandler } from './slow-api.handler';
import { SlowRouteHandler } from './slow-route.handler';

@Injectable()
export class RuleHandlerFactory {
  private readonly handlers: ReadonlyMap<string, RuleHandler>;

  constructor(
    latencyHandler: LatencyHandler,
    rateHandler: RateHandler,
    slowRouteHandler: SlowRouteHandler,
    routeErrorRateHandler: RouteErrorRateHandler,
    slowApiHandler: SlowApiHandler,
  ) {
    this.handlers = new Map<string, RuleHandler>([
      [RuleType.P50_FAILURE, latencyHandler],
      [RuleType.P90_FAILURE, latencyHandler],
      [RuleType.P95_FAILURE, latencyHandler],
      [RuleType.P99_FAILURE, latencyHandler],
      [RuleType.AVG_LATENCY, latencyHandler],
      [RuleType.MAX_LATENCY, latencyHandler],
      [RuleType.SLOW_REQUEST_RATE, rateHandler],
      [RuleType.ERROR_RATE, rateHandler],
      [RuleType.CLIENT_ERROR_RATE, rateHandler],
      [RuleType.SLOW_ROUTE, slowRouteHandler],
      [RuleType.SLOW_API, slowApiHandler],
      [RuleType.ROUTE_ERROR_RATE, routeErrorRateHandler],
    ]);
  }

  supports(type: string): boolean {
    return this.handlers.has(type);
  }

  create(type: string): RuleHandler {
    const handler = this.handlers.get(type);
    if (!handler) throw new UnprocessableEntityException({ code: ErrorCode.RULE_TYPE_UNSUPPORTED });
    return handler;
  }
}
