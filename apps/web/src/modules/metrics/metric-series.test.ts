import { MetricType } from '@tomato/constants';
import { describe, expect, it } from 'vitest';
import { metricSeriesKey, metricSeriesLabel } from './metric-series';

describe('metricSeriesKey', () => {
  it('joins the metric id and the subject', () => {
    expect(metricSeriesKey('m-1', '')).toBe('m-1:');
    expect(metricSeriesKey('m-1', 'GET /api/cart')).toBe('m-1:GET /api/cart');
  });
});

describe('metricSeriesLabel', () => {
  it('shows the endpoint after the metric name', () => {
    expect(metricSeriesLabel(MetricType.ENDPOINT_P95, 'GET /api/cart')).toBe('P95 duration per endpoint · GET /api/cart');
  });

  it('shows only the metric name for a whole-file result', () => {
    expect(metricSeriesLabel(MetricType.P50, '')).toBe('P50 duration');
  });
});
