import { AnalysisResultStatus, MetricEvaluationStatus } from '@tomato/constants';
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

export const LOG_FILE_FIELDS = [
  { name: 'api_metric', label: 'API metric log', hint: 'NDJSON, one request per line: {"method","route","status","ms"}. Used for metrics and issues.' },
  { name: 'query', label: 'Query log', hint: 'Newline-delimited JSON of executed queries.' },
] as const;

export type LogFileField = (typeof LOG_FILE_FIELDS)[number]['name'];

export const POLL_INTERVAL_MS = 2000;
export const POLL_TIMEOUT_MS = 5 * 60 * 1000;
