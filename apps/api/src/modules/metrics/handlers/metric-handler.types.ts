import type { Analysis, Metric } from '../../../generated/client';
import type { SubjectSource } from '../../subjects/subject';

export interface MetricMeasurement {
  value: number;
  subject?: SubjectSource;
}

export interface MetricHandler {
  handle(metric: Metric, analysis: Analysis, analysisResultId: string): Promise<MetricMeasurement[]>;
}
