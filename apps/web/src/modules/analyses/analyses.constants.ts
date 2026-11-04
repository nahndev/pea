import { AnalysisResultStatus, AnalysisSchema, MetricEvaluationStatus } from '@tomato/constants';
import type { StatusStyle } from '@/shared/components/status-badge';

export const RESULT_STATUS_STYLE: Record<AnalysisResultStatus, StatusStyle> = {
  [AnalysisResultStatus.RUNNING]: { label: 'Running', intent: 'info' },
  [AnalysisResultStatus.COMPLETED]: { label: 'Completed', intent: 'success' },
  [AnalysisResultStatus.FAILED]: { label: 'Failed', intent: 'danger' },
};

export const GATE_STATUS_STYLE: Record<MetricEvaluationStatus, StatusStyle> = {
  [MetricEvaluationStatus.PASSED]: { label: 'Passed', intent: 'success' },
  [MetricEvaluationStatus.FAILED]: { label: 'Failed', intent: 'danger' },
};

export const MAX_LOG_FILE_SIZE = 50 * 1024 * 1024;

export const API_METRIC_FILE_FIELD = {
  name: 'api_metric',
  label: 'API metric log',
  hint: 'NDJSON, one request per line: {"method","route","status","ms"}. Used for metrics and issues.',
  converter: { source: 'slow_api.log', label: 'LeaneoSlowApiConvert', href: '/add-ons/leaneo-slow-api-convert' },
} as const;

export const BUG_LOG_FILE_FIELD = {
  name: 'bug_log',
  label: 'Bug log',
  hint: 'NDJSON, one error per line: {"@timestamp","log.level","message","error.type","error.message","error.stack_trace","http.response.status_code"…}. Used for metrics and issues.',
  converter: { source: 'exceptions.log', label: 'LeaneoExceptionsConvert', href: '/add-ons/leaneo-exceptions-convert' },
} as const;

export const LOG_FILE_FIELD_BY_SCHEMA = {
  [AnalysisSchema.API]: API_METRIC_FILE_FIELD,
  [AnalysisSchema.QUERY]: API_METRIC_FILE_FIELD,
  [AnalysisSchema.BUG]: BUG_LOG_FILE_FIELD,
} as const;

export const POLL_INTERVAL_MS = 2000;
export const POLL_TIMEOUT_MS = 5 * 60 * 1000;
