import { MetricConditionOperator } from '@tomato/constants';

export const VIOLATION_BY_OPERATOR: ReadonlyMap<string, (value: number, threshold: number) => boolean> = new Map([
  [MetricConditionOperator.GT, (value, threshold) => value > threshold],
  [MetricConditionOperator.GTE, (value, threshold) => value >= threshold],
  [MetricConditionOperator.LT, (value, threshold) => value < threshold],
  [MetricConditionOperator.LTE, (value, threshold) => value <= threshold],
]);
