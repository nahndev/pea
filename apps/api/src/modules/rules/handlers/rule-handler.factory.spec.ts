import { UnprocessableEntityException } from '@nestjs/common';
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
import { RuleHandlerFactory } from './rule-handler.factory';
import { SlowApiHandler } from './api/slow-api.handler';
import { SlowRouteHandler } from './api/slow-route.handler';

describe('RuleHandlerFactory', () => {
  const latencyHandler = {} as LatencyHandler;
  const rateHandler = {} as RateHandler;
  const slowRouteHandler = {} as SlowRouteHandler;
  const routeErrorRateHandler = {} as RouteErrorRateHandler;
  const slowApiHandler = {} as SlowApiHandler;
  const slowQueryHandler = {} as SlowQueryHandler;
  const longRunningQueryHandler = {} as LongRunningQueryHandler;
  const lockWaitHandler = {} as LockWaitHandler;
  const deadTupleRateHandler = {} as DeadTupleRateHandler;
  const seqScanRateHandler = {} as SeqScanRateHandler;
  const unusedIndexHandler = {} as UnusedIndexHandler;
  const lowCacheHitRatioHandler = {} as LowCacheHitRatioHandler;
  const ruleHandlerFactory = new RuleHandlerFactory(
    latencyHandler,
    rateHandler,
    slowRouteHandler,
    routeErrorRateHandler,
    slowApiHandler,
    slowQueryHandler,
    longRunningQueryHandler,
    lockWaitHandler,
    deadTupleRateHandler,
    seqScanRateHandler,
    unusedIndexHandler,
    lowCacheHitRatioHandler,
  );

  it.each([
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
  ])('returns the handler of %s', (type, handler) => {
    expect(ruleHandlerFactory.create(type)).toBe(handler);
  });

  it('supports every rule type', () => {
    for (const type of Object.values(RuleType)) expect(ruleHandlerFactory.supports(type)).toBe(true);
  });

  it('throws RULE_TYPE_UNSUPPORTED when no handler exists', () => {
    expect.assertions(1);
    try {
      ruleHandlerFactory.create('UNKNOWN');
    } catch (error) {
      expect((error as UnprocessableEntityException).getResponse()).toEqual({
        code: ErrorCode.RULE_TYPE_UNSUPPORTED,
      });
    }
  });
});
