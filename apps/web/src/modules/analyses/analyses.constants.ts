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
} as const;

export const BUG_LOG_FILE_FIELD = {
  name: 'bug_log',
  label: 'Bug log',
  hint: 'NDJSON, one error per line: {"@timestamp","log.level","message","error.type","error.message","error.stack_trace","http.response.status_code"…}. Used for metrics and issues.',
} as const;

export const LEANEO_ADD_ON = {
  label: 'Leaneo add-on',
  hint: 'Upload a Leaneo slow_api.log (API, Query) or exceptions.log (Bug); the server converts it on upload.',
} as const;

export const LOG_FILE_FIELD_BY_SCHEMA = {
  [AnalysisSchema.API]: API_METRIC_FILE_FIELD,
  [AnalysisSchema.QUERY]: API_METRIC_FILE_FIELD,
  [AnalysisSchema.BUG]: BUG_LOG_FILE_FIELD,
} as const;

export const POLL_INTERVAL_MS = 2000;
export const POLL_TIMEOUT_MS = 5 * 60 * 1000;
