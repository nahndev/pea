import type {
  AnalysisSchema,
  MetricConditionAggregate,
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
  /** Shown as a summary card on the analysis metrics */
  isCard: boolean;
  /** Default line of the trend chart */
  isTrend: boolean;
  /** Subject uuids; empty means every subject */
  include: string[];
  /** Subject uuids that are never measured */
  exclude: string[];
}

export interface MetricEvaluationView {
  status: MetricEvaluationStatus;
  aggregate: MetricConditionAggregate;
  /** Aggregate of the passed history the value was compared with; null without an aggregate */
  baseline: number | null;
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

export interface MetricSummaryView {
  type: MetricType;
  unit: MetricUnit;
  worstValue: number;
  gateStatus: MetricEvaluationStatus | null;
  limit: { operator: MetricConditionOperator; threshold: number } | null;
}

export interface MetricResultFilterOptions {
  metricTypes: MetricType[];
  subjects: SubjectView[];
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
  title: string;
  values: Record<string, number>;
}

export interface MetricTrend {
  series: MetricTrendSeries[];
  points: MetricTrendPoint[];
}

export interface MetricHistoryItemView {
  id: string;
  value: number;
  createdAt: string;
  subject: SubjectView | null;
  analysis: { id: string; title: string; repo: { id: string; name: string; slug: string } };
  evaluations: MetricEvaluationView[];
}
