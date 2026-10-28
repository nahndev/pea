import type { MetricConditionOperator, MetricEvaluationStatus, MetricType } from '@tomato/constants';

export interface MetricEvaluationView {
  status: MetricEvaluationStatus;
  operator: MetricConditionOperator;
  threshold: number;
  qualityGate: string;
}

export interface MetricResultView {
  id: string;
  value: number;
  metric: { type: MetricType; description: string };
  context: { file: string };
  evaluations: MetricEvaluationView[];
}

export interface MetricTrendPoint {
  analysisId: string;
  createdAt: string;
  mergeRequestIid: number | null;
  values: Partial<Record<MetricType, number>>;
}
