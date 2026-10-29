import { UnprocessableEntityException } from '@nestjs/common';
import { ErrorCode, MetricType } from '@tomato/constants';
import { EndpointPercentileHandler } from './endpoint-percentile.handler';
import { IssueCountHandler } from './issue-count.handler';
import { MetricHandlerFactory } from './metric-handler.factory';
import { PercentileHandler } from './percentile.handler';

describe('MetricHandlerFactory', () => {
  const percentileHandler = {} as PercentileHandler;
  const issueCountHandler = {} as IssueCountHandler;
  const endpointPercentileHandler = {} as EndpointPercentileHandler;
  const metricHandlerFactory = new MetricHandlerFactory(percentileHandler, issueCountHandler, endpointPercentileHandler);

  it.each([MetricType.P50, MetricType.P90, MetricType.P95])('returns the percentile handler for %s', (type) => {
    expect(metricHandlerFactory.create(type)).toBe(percentileHandler);
  });

  it('returns the endpoint percentile handler for ENDPOINT_P95', () => {
    expect(metricHandlerFactory.create(MetricType.ENDPOINT_P95)).toBe(endpointPercentileHandler);
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
