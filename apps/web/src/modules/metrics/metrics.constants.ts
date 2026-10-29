import { MetricConditionOperator, MetricType } from '@tomato/constants';

export const METRIC_TYPES = [MetricType.P50, MetricType.P90, MetricType.P95] as const;

export const METRIC_LABEL: Record<MetricType, string> = {
  [MetricType.P50]: 'P50 duration',
  [MetricType.P90]: 'P90 duration',
  [MetricType.P95]: 'P95 duration',
  [MetricType.BLOCKER_ISSUE_COUNT]: 'Blocker issues',
  [MetricType.HIGH_ISSUE_COUNT]: 'High issues',
  [MetricType.MEDIUM_ISSUE_COUNT]: 'Medium issues',
  [MetricType.LOW_ISSUE_COUNT]: 'Low issues',
  [MetricType.INFO_ISSUE_COUNT]: 'Info issues',
};

const COUNT_METRIC_TYPES: ReadonlySet<MetricType> = new Set([
  MetricType.BLOCKER_ISSUE_COUNT,
  MetricType.HIGH_ISSUE_COUNT,
  MetricType.MEDIUM_ISSUE_COUNT,
  MetricType.LOW_ISSUE_COUNT,
  MetricType.INFO_ISSUE_COUNT,
]);

export const isCountMetric = (type: MetricType) => COUNT_METRIC_TYPES.has(type);

export const VIOLATION_PHRASE: Record<MetricConditionOperator, string> = {
  [MetricConditionOperator.GT]: 'above',
  [MetricConditionOperator.GTE]: 'at or above',
  [MetricConditionOperator.LT]: 'below',
  [MetricConditionOperator.LTE]: 'at or below',
};

export const TREND_LIMIT = 20;
