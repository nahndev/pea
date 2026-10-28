import type { AnalysisContext, Metric } from '../../../generated/client';

export interface MetricHandler {
  handle(metric: Metric, context: AnalysisContext): Promise<number | null>;
}
