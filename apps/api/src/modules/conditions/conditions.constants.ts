import { MetricConditionAggregate, MetricConditionOperator } from '@tomato/constants';

export const VIOLATION_BY_OPERATOR: ReadonlyMap<string, (value: number, threshold: number) => boolean> = new Map([
  [MetricConditionOperator.GT, (value, threshold) => value > threshold],
  [MetricConditionOperator.GTE, (value, threshold) => value >= threshold],
  [MetricConditionOperator.LT, (value, threshold) => value < threshold],
  [MetricConditionOperator.LTE, (value, threshold) => value <= threshold],
]);

export const BASELINE_BY_AGGREGATE: ReadonlyMap<string, (values: number[]) => number> = new Map([
  [MetricConditionAggregate.MIN, (values) => Math.min(...values)],
  [MetricConditionAggregate.MAX, (values) => Math.max(...values)],
  [MetricConditionAggregate.AVERAGE, (values) => values.reduce((sum, value) => sum + value, 0) / values.length],
  [
    MetricConditionAggregate.MEDIAN,
    (values) => {
      const sorted = [...values].sort((a, b) => a - b);
      const middle = Math.floor(sorted.length / 2);
      return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
    },
  ],
]);
