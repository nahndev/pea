import { MetricUnit } from '@tomato/constants';
import { describe, expect, it } from 'vitest';
import { formatMetricValue } from './format-metric-value';

describe('formatMetricValue', () => {
  it('formats milliseconds as time', () => {
    expect(formatMetricValue(MetricUnit.MILLISECOND, 1500)).toBe('1.5 s');
    expect(formatMetricValue(MetricUnit.MILLISECOND, 120)).toBe('120 ms');
  });

  it('formats counts as plain numbers', () => {
    expect(formatMetricValue(MetricUnit.COUNT, 3)).toBe('3');
    expect(formatMetricValue(MetricUnit.COUNT, 0)).toBe('0');
  });
});
