import type { MetricConditionOperator, MetricEvaluationStatus, MetricType, MetricUnit } from '@tomato/constants';

export interface MetricView {
  id: string;
  type: MetricType;
  unit: MetricUnit;
  description: string;
}

export interface MetricEvaluationView {
  status: MetricEvaluationStatus;
  operator: MetricConditionOperator;
  threshold: number;
  qualityGate: string;
}

export interface MetricResultView {
  id: string;
  value: number;
  subject: string;
  metric: { id: string; type: MetricType; unit: MetricUnit; description: string };
  context: { file: string };
  evaluations: MetricEvaluationView[];
}

export interface MetricTrendSeries {
  /** `<metric id>:<subject>`; the key used in `MetricTrendPoint.values` */
  key: string;
  metric: { id: string; type: MetricType; unit: MetricUnit; description: string };
  subject: string;
}

export interface MetricTrendPoint {
  analysisId: string;
  createdAt: string;
  mergeRequestIid: number | null;
  values: Record<string, number>;
}

export interface MetricTrend {
  series: MetricTrendSeries[];
  points: MetricTrendPoint[];
}
