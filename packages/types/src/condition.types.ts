import type { AggregateLimitType, AnalysisSchema, MetricConditionOperator, MetricType, MetricUnit } from '@tomato/constants';

export interface MetricConditionAggregateLimit {
  aggregate: AggregateLimitType;
  operator: MetricConditionOperator;
  threshold: number;
}

export interface MetricConditionView {
  id: string;
  schema: AnalysisSchema;
  metric: { id: string; type: MetricType; unit: MetricUnit; description: string; isActive: boolean };
  operator: MetricConditionOperator;
  threshold: number;
  /** Limits on the difference between a result and the aggregate of the passed history of its subject */
  aggregates: MetricConditionAggregateLimit[];
  isActive: boolean;
}
