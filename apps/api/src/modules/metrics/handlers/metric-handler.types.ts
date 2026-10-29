import type { Analysis, Metric } from '../../../generated/client';
import type { MetricSubject } from '../metric-subject';

export interface MetricMeasurement {
  value: number;
  subject?: MetricSubject;
}

export interface MetricHandler {
  handle(metric: Metric, analysis: Analysis, analysisResultId: string): Promise<MetricMeasurement[]>;
}
