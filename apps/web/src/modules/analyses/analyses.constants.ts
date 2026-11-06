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

export const API_METRIC_FILE_FIELD = {
  name: 'api_metric',
  label: 'API metric log',
  hint: 'NDJSON, one request per line: {"method","route","status","ms"}. Used for metrics and issues.',
  leaneo: {
    label: 'Leaneo slow API log',
    hint: 'Leaneo slow_api.log, JSON Lines with context.request.url, context.request.method and context.elapsedMilleSecond. Converted to the API metric log on upload.',
  },
} as const;

export const BUG_LOG_FILE_FIELD = {
  name: 'bug_log',
  label: 'Bug log',
  hint: 'NDJSON, one error per line: {"@timestamp","log.level","message","error.type","error.message","error.stack_trace","http.response.status_code"…}. Used for metrics and issues.',
  leaneo: {
    label: 'Leaneo exceptions log',
    hint: 'Leaneo Monolog exceptions.log, JSON Lines with message, level_name, datetime and context.exception. Converted to the bug log on upload; personal data is dropped.',
  },
} as const;

export const LOG_FILE_FIELD_BY_SCHEMA = {
  [AnalysisSchema.API]: API_METRIC_FILE_FIELD,
  [AnalysisSchema.QUERY]: API_METRIC_FILE_FIELD,
  [AnalysisSchema.BUG]: BUG_LOG_FILE_FIELD,
} as const;

export const POLL_INTERVAL_MS = 2000;
export const POLL_TIMEOUT_MS = 5 * 60 * 1000;
