import { MetricType } from '@tomato/constants';

export const LOG_FILE_FIELD = 'api_metric';
export const MAX_LOG_FILE_SIZE = 50 * 1024 * 1024;

/** Trend metrics shown when none is picked; each schema only finds its own */
export const DEFAULT_TREND_METRIC_TYPES: readonly MetricType[] = [
  MetricType.P50,
  MetricType.P90,
  MetricType.P95,
  MetricType.CONNECTIONS,
  MetricType.WAITING_LOCKS,
  MetricType.DEADLOCKS,
];
export const MAX_TREND_PICKS = 10;
