import { AnalysisContextType, MetricType } from '@tomato/constants';

export const CONTEXT_TYPE_BY_FIELD: ReadonlyMap<string, AnalysisContextType> = new Map(
  Object.values(AnalysisContextType).map((type) => [type.toLowerCase(), type]),
);
export const LOG_FILE_FIELDS = [...CONTEXT_TYPE_BY_FIELD.keys()].map((name) => ({ name, maxCount: 1 }));
export const MAX_LOG_FILE_SIZE = 50 * 1024 * 1024;

export const DEFAULT_TREND_METRIC_TYPES: readonly MetricType[] = [MetricType.P50, MetricType.P90, MetricType.P95];
export const MAX_TREND_PICKS = 10;
