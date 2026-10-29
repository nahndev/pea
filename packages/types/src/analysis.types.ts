import type { AnalysisResultStatus, AnalysisSchema, MetricEvaluationStatus } from '@tomato/constants';
import type { Branch } from './branch.types';

export interface AnalysisResultSummary {
  id: string;
  status: AnalysisResultStatus;
  issueCount: number;
  gateStatus: MetricEvaluationStatus | null;
}

export interface AnalysisSummary {
  id: string;
  schema: AnalysisSchema;
  mergeRequestIid: number | null;
  createdAt: string;
  latestResult: AnalysisResultSummary | null;
}

export interface AnalysisDetail extends AnalysisSummary {
  branch: Branch;
  file: string;
}
