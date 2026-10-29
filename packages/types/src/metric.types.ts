import type {
  AnalysisSchema,
  MetricConditionOperator,
  MetricEvaluationStatus,
  MetricType,
  MetricUnit,
  SubjectType,
} from '@tomato/constants';

export interface SubjectView {
  uuid: string;
  type: SubjectType;
  description: string;
}

export interface MetricView {
  id: string;
  schema: AnalysisSchema;
  type: MetricType;
  unit: MetricUnit;
  description: string;
  isActive: boolean;
}

export interface MetricEvaluationView {
  status: MetricEvaluationStatus;
  operator: MetricConditionOperator;
  threshold: number;
}

export interface MetricResultView {
  id: string;
  value: number;
  subject: SubjectView | null;
  metric: { id: string; type: MetricType; unit: MetricUnit; description: string };
  evaluations: MetricEvaluationView[];
}

export interface MetricTrendSeries {
  /** `<metric id>:<subject uuid>` (empty without a subject); the key used in `MetricTrendPoint.values` */
  key: string;
  metric: { id: string; type: MetricType; unit: MetricUnit; description: string };
  subject: SubjectView | null;
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
