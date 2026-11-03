import type { Metric } from '../../../generated/client';
import type { AnalysisWithData } from '../../analyses/analyses.types';
import type { SubjectSource } from '../../subjects/subject';

export interface MetricMeasurement {
  value: number;
  subject?: SubjectSource;
}

export interface MetricHandler {
  handle(metric: Metric, analysis: AnalysisWithData, analysisResultId: string): Promise<MetricMeasurement[]>;
}
