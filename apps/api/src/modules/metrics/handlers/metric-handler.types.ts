import type { Analysis, Metric } from '../../../generated/client';

export interface MetricMeasurement {
  value: number;
  subject?: string;
}

export interface MetricHandler {
  handle(metric: Metric, analysis: Analysis, analysisResultId: string): Promise<MetricMeasurement[]>;
}
