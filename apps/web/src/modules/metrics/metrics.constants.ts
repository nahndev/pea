import { MetricConditionOperator, MetricType } from '@tomato/constants';

export const METRIC_TYPES = [MetricType.P50, MetricType.P90, MetricType.P95] as const;

export const METRIC_LABEL: Record<MetricType, string> = {
  [MetricType.P50]: 'P50 duration',
  [MetricType.P90]: 'P90 duration',
  [MetricType.P95]: 'P95 duration',
};

export const VIOLATION_PHRASE: Record<MetricConditionOperator, string> = {
  [MetricConditionOperator.GT]: 'above',
  [MetricConditionOperator.GTE]: 'at or above',
  [MetricConditionOperator.LT]: 'below',
  [MetricConditionOperator.LTE]: 'at or below',
};

export const TREND_LIMIT = 20;
