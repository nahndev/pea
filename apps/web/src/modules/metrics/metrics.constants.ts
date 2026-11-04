import { MetricConditionAggregate, MetricConditionOperator, MetricType, MetricUnit } from '@tomato/constants';

export const METRIC_TYPES = [MetricType.P50, MetricType.P90, MetricType.P95] as const;

export const METRIC_LABEL: Record<MetricType, string> = {
  [MetricType.P50]: 'P50 duration',
  [MetricType.P90]: 'P90 duration',
  [MetricType.P95]: 'P95 duration',
  [MetricType.ENDPOINT_P95]: 'P95 duration per endpoint',
  [MetricType.BLOCKER_ISSUE_COUNT]: 'Blocker issues',
  [MetricType.HIGH_ISSUE_COUNT]: 'High issues',
  [MetricType.MEDIUM_ISSUE_COUNT]: 'Medium issues',
  [MetricType.LOW_ISSUE_COUNT]: 'Low issues',
  [MetricType.INFO_ISSUE_COUNT]: 'Info issues',
  [MetricType.TABLE_ROWS]: 'Rows per table',
  [MetricType.TABLE_DEAD_TUPLES]: 'Dead tuples per table',
  [MetricType.QUERY_MEAN_DURATION]: 'Mean duration per query',
  [MetricType.CACHE_HIT_RATIO]: 'Cache hit ratio',
  [MetricType.CONNECTIONS]: 'Connections',
  [MetricType.WAITING_LOCKS]: 'Waiting locks',
  [MetricType.DEADLOCKS]: 'Deadlocks',
  [MetricType.TEMP_FILES]: 'Temp files',
  [MetricType.REPLICATION_LAG]: 'Replication lag',
  [MetricType.ERROR_COUNT]: 'Errors',
  [MetricType.CRITICAL_ERROR_COUNT]: 'Critical errors',
  [MetricType.ERROR_GROUP_COUNT]: 'Distinct errors',
  [MetricType.ERROR_OCCURRENCES]: 'Occurrences per error',
};

export const METRIC_UNIT_LABEL: Record<MetricUnit, string> = {
  [MetricUnit.MILLISECOND]: 'ms',
  [MetricUnit.COUNT]: 'count',
  [MetricUnit.PERCENT]: '%',
};

export const VIOLATION_PHRASE: Record<MetricConditionOperator, string> = {
  [MetricConditionOperator.GT]: 'above',
  [MetricConditionOperator.GTE]: 'at or above',
  [MetricConditionOperator.LT]: 'below',
  [MetricConditionOperator.LTE]: 'at or below',
};

export const AGGREGATE_LABEL: Record<MetricConditionAggregate, string> = {
  [MetricConditionAggregate.NONE]: 'Each result',
  [MetricConditionAggregate.MIN]: 'Min',
  [MetricConditionAggregate.MAX]: 'Max',
  [MetricConditionAggregate.AVERAGE]: 'Average',
  [MetricConditionAggregate.MEDIAN]: 'Median',
};

export const TREND_LIMIT = 20;

export const ALL_FILTER = 'all';

export const METRIC_RESULTS_ANCHOR = 'metric-results-heading';
