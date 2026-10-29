import { MetricType } from '@tomato/constants';
import { describe, expect, it } from 'vitest';
import { formatMetricValue } from './format-metric-value';

describe('formatMetricValue', () => {
  it('formats duration metrics as time', () => {
    expect(formatMetricValue(MetricType.P90, 1500)).toBe('1.5 s');
    expect(formatMetricValue(MetricType.P50, 120)).toBe('120 ms');
  });

  it('formats issue counts as plain numbers', () => {
    expect(formatMetricValue(MetricType.BLOCKER_ISSUE_COUNT, 3)).toBe('3');
    expect(formatMetricValue(MetricType.HIGH_ISSUE_COUNT, 0)).toBe('0');
  });
});
