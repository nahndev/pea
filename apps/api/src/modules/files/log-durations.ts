import { AnalysisSchema } from '@tomato/constants';
import { API_METRIC_DURATION_COLUMN, apiMetricRequests } from './api-metric-requests';
import { FRONTEND_DURATION_COLUMN, frontendPageLoads } from './frontend-page-loads';

export interface LogDurations {
  /** DuckDB relation to select from */
  source: string;
  column: string;
}

/** Durations of a log analysis: page loads for `FRONTEND`, else api_metric requests */
export const logDurations = (schema: AnalysisSchema, path: string): LogDurations =>
  schema === AnalysisSchema.FRONTEND
    ? { source: frontendPageLoads(path), column: FRONTEND_DURATION_COLUMN }
    : { source: apiMetricRequests(path), column: API_METRIC_DURATION_COLUMN };
