import type { AnalysisResultStatus, AnalysisSchema, MetricEvaluationStatus } from '@tomato/constants';
import type { Repo } from './repo.types';
import type { DatabaseSummary } from './database.types';

export interface AnalysisResultSummary {
  id: string;
  status: AnalysisResultStatus;
  issueCount: number;
  gateStatus: MetricEvaluationStatus | null;
}

export interface AnalysisSummary {
  id: string;
  schema: AnalysisSchema;
  title: string;
  createdAt: string;
  latestResult: AnalysisResultSummary | null;
}

export interface AnalysisDetail extends AnalysisSummary {
  repo: Repo;
  file: string | null;
  database: DatabaseSummary | null;
}

export type AnalysisCountBySchema = Record<AnalysisSchema, number>;
