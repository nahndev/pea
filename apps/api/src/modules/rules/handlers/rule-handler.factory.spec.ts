import { UnprocessableEntityException } from '@nestjs/common';
import { ErrorCode, RuleType } from '@tomato/constants';
import { LatencyHandler } from './latency.handler';
import { RateHandler } from './rate.handler';
import { RouteErrorRateHandler } from './route-error-rate.handler';
import { RuleHandlerFactory } from './rule-handler.factory';
import { SlowRouteHandler } from './slow-route.handler';

describe('RuleHandlerFactory', () => {
  const latencyHandler = {} as LatencyHandler;
  const rateHandler = {} as RateHandler;
  const slowRouteHandler = {} as SlowRouteHandler;
  const routeErrorRateHandler = {} as RouteErrorRateHandler;
  const ruleHandlerFactory = new RuleHandlerFactory(latencyHandler, rateHandler, slowRouteHandler, routeErrorRateHandler);

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
    [RuleType.ROUTE_ERROR_RATE, routeErrorRateHandler],
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
