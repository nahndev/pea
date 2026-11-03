import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ErrorCode, RuleType } from '@tomato/constants';
import { LatencyHandler } from './api/latency.handler';
import { RateHandler } from './api/rate.handler';
import { RouteErrorRateHandler } from './api/route-error-rate.handler';
import { SlowQueryHandler } from './database/slow-query.handler';
import { LongRunningQueryHandler } from './database/long-running-query.handler';
import { LockWaitHandler } from './database/lock-wait.handler';
import { DeadTupleRateHandler } from './database/dead-tuple-rate.handler';
import { SeqScanRateHandler } from './database/seq-scan-rate.handler';
import { UnusedIndexHandler } from './database/unused-index.handler';
import { LowCacheHitRatioHandler } from './database/low-cache-hit-ratio.handler';
import type { RuleHandler } from './rule-handler.types';
import { SlowApiHandler } from './api/slow-api.handler';
import { SlowRouteHandler } from './api/slow-route.handler';

@Injectable()
export class RuleHandlerFactory {
  private readonly handlers: ReadonlyMap<string, RuleHandler>;

  constructor(
    latencyHandler: LatencyHandler,
    rateHandler: RateHandler,
    slowRouteHandler: SlowRouteHandler,
    routeErrorRateHandler: RouteErrorRateHandler,
    slowApiHandler: SlowApiHandler,
    slowQueryHandler: SlowQueryHandler,
    longRunningQueryHandler: LongRunningQueryHandler,
    lockWaitHandler: LockWaitHandler,
    deadTupleRateHandler: DeadTupleRateHandler,
    seqScanRateHandler: SeqScanRateHandler,
    unusedIndexHandler: UnusedIndexHandler,
    lowCacheHitRatioHandler: LowCacheHitRatioHandler,
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
      [RuleType.SLOW_QUERY, slowQueryHandler],
      [RuleType.LONG_RUNNING_QUERY, longRunningQueryHandler],
      [RuleType.LOCK_WAIT, lockWaitHandler],
      [RuleType.DEAD_TUPLE_RATE, deadTupleRateHandler],
      [RuleType.SEQ_SCAN_RATE, seqScanRateHandler],
      [RuleType.UNUSED_INDEX, unusedIndexHandler],
      [RuleType.LOW_CACHE_HIT_RATIO, lowCacheHitRatioHandler],
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
