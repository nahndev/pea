import type { AnalysisSchema, MetricConditionOperator, MetricType, MetricUnit } from '@tomato/constants';

export interface MetricConditionView {
  id: string;
  schema: AnalysisSchema;
  metric: { id: string; type: MetricType; unit: MetricUnit; description: string; isActive: boolean };
  operator: MetricConditionOperator;
  threshold: number;
  isActive: boolean;
}
