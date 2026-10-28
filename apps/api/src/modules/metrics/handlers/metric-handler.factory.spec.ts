import { UnprocessableEntityException } from '@nestjs/common';
import { ErrorCode, MetricType } from '@tomato/constants';
import { MetricHandlerFactory } from './metric-handler.factory';
import { PercentileHandler } from './percentile.handler';

describe('MetricHandlerFactory', () => {
  const percentileHandler = {} as PercentileHandler;
  const metricHandlerFactory = new MetricHandlerFactory(percentileHandler);

  it.each(Object.values(MetricType))('returns the percentile handler for %s', (type) => {
    expect(metricHandlerFactory.supports(type)).toBe(true);
    expect(metricHandlerFactory.create(type)).toBe(percentileHandler);
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
