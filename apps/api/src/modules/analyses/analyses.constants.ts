import { AnalysisSchema, MetricType } from '@tomato/constants';

export const LogFileField = {
  API_METRIC: 'api_metric',
  BUG_LOG: 'bug_log',
} as const;

export type LogFileField = (typeof LogFileField)[keyof typeof LogFileField];

export const LOG_FILE_FIELD_BY_SCHEMA: Readonly<Record<Exclude<AnalysisSchema, typeof AnalysisSchema.DATABASE>, LogFileField>> = {
  [AnalysisSchema.API]: LogFileField.API_METRIC,
  [AnalysisSchema.QUERY]: LogFileField.API_METRIC,
  [AnalysisSchema.BUG]: LogFileField.BUG_LOG,
};
export const MAX_LOG_FILE_SIZE = 50 * 1024 * 1024;

/** Trend metrics shown when none is picked; each schema only finds its own */
export const DEFAULT_TREND_METRIC_TYPES: readonly MetricType[] = [
  MetricType.P50,
  MetricType.P90,
  MetricType.P95,
  MetricType.CONNECTIONS,
  MetricType.WAITING_LOCKS,
  MetricType.DEADLOCKS,
  MetricType.ERROR_COUNT,
  MetricType.CRITICAL_ERROR_COUNT,
  MetricType.ERROR_GROUP_COUNT,
];
export const MAX_TREND_PICKS = 10;
