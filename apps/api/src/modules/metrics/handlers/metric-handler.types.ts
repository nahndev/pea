import type { AnalysisContext, Metric } from '../../../generated/client';

export interface MetricMeasurement {
  value: number;
  subject?: string;
}

export interface MetricHandler {
  handle(metric: Metric, context: AnalysisContext, analysisResultId: string): Promise<MetricMeasurement[]>;
}
