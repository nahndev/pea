import { MetricType } from '@tomato/constants';
import { describe, expect, it } from 'vitest';
import type { SubjectView } from '@tomato/types';
import { metricSeriesKey, metricSeriesLabel } from './metric-series';

const cart: SubjectView = { uuid: 'su-1', type: 'API', description: 'GET /api/cart' };

describe('metricSeriesKey', () => {
  it('joins the metric id and the subject uuid', () => {
    expect(metricSeriesKey('m-1', null)).toBe('m-1:');
    expect(metricSeriesKey('m-1', cart)).toBe('m-1:su-1');
  });
});

describe('metricSeriesLabel', () => {
  it('shows the endpoint after the metric name', () => {
    expect(metricSeriesLabel(MetricType.ENDPOINT_P95, cart)).toBe('P95 duration per endpoint · GET /api/cart');
  });

  it('shows only the metric name for a whole-file result', () => {
    expect(metricSeriesLabel(MetricType.P50, null)).toBe('P50 duration');
  });
});
