export const MetricConditionAggregate = {
  NONE: 'NONE',
  MIN: 'MIN',
  MAX: 'MAX',
  AVERAGE: 'AVERAGE',
  MEDIAN: 'MEDIAN',
} as const;

export type MetricConditionAggregate = (typeof MetricConditionAggregate)[keyof typeof MetricConditionAggregate];

export const AGGREGATE_LIMIT_TYPES = [
  MetricConditionAggregate.MIN,
  MetricConditionAggregate.MAX,
  MetricConditionAggregate.AVERAGE,
  MetricConditionAggregate.MEDIAN,
] as const;

export type AggregateLimitType = (typeof AGGREGATE_LIMIT_TYPES)[number];
