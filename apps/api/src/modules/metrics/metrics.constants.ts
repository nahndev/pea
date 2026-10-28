import { MetricType } from '@tomato/constants';

export const PERCENTILE_BY_METRIC_TYPE: ReadonlyMap<string, number> = new Map([
  [MetricType.P50, 0.5],
  [MetricType.P90, 0.9],
  [MetricType.P95, 0.95],
]);
