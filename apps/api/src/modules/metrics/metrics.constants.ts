import { MetricType, Severity } from '@tomato/constants';

export const PERCENTILE_BY_METRIC_TYPE: ReadonlyMap<string, number> = new Map([
  [MetricType.P50, 0.5],
  [MetricType.P90, 0.9],
  [MetricType.P95, 0.95],
  [MetricType.ENDPOINT_P95, 0.95],
]);

export const SEVERITY_BY_METRIC_TYPE: ReadonlyMap<string, Severity> = new Map([
  [MetricType.BLOCKER_ISSUE_COUNT, Severity.BLOCKER],
  [MetricType.HIGH_ISSUE_COUNT, Severity.HIGH],
  [MetricType.MEDIUM_ISSUE_COUNT, Severity.MEDIUM],
  [MetricType.LOW_ISSUE_COUNT, Severity.LOW],
  [MetricType.INFO_ISSUE_COUNT, Severity.INFO],
]);
