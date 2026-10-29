import type { MetricConditionOperator, MetricType, MetricUnit } from '@tomato/constants';

export interface MetricConditionView {
  id: string;
  qualityGate: { id: string; name: string };
  metric: { id: string; type: MetricType; unit: MetricUnit; description: string; isActive: boolean };
  operator: MetricConditionOperator;
  threshold: number;
  isActive: boolean;
}

export interface QualityGateView {
  id: string;
  name: string;
  description: string | null;
}
