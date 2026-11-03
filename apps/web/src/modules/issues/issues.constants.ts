import { IssueSubjectStatus, RuleType } from '@tomato/constants';
import type { StatusStyle } from '@/shared/components/status-badge';

export const ISSUE_SUBJECT_STATUS_STYLE: Record<IssueSubjectStatus, StatusStyle> = {
  [IssueSubjectStatus.TO_REVIEW]: { label: 'To review', intent: 'warning' },
  [IssueSubjectStatus.PLANNING]: { label: 'Planning', intent: 'info' },
  [IssueSubjectStatus.IN_PROGRESS]: { label: 'In progress', intent: 'primary' },
  [IssueSubjectStatus.FIXED]: { label: 'Fixed', intent: 'success' },
};

export const RULE_TYPE_LABEL: Record<RuleType, string> = {
  [RuleType.P50_FAILURE]: 'P50 failure',
  [RuleType.P90_FAILURE]: 'P90 failure',
  [RuleType.P95_FAILURE]: 'P95 failure',
  [RuleType.P99_FAILURE]: 'P99 failure',
  [RuleType.AVG_LATENCY]: 'Average latency',
  [RuleType.MAX_LATENCY]: 'Max latency',
  [RuleType.SLOW_REQUEST_RATE]: 'Slow request rate',
  [RuleType.ERROR_RATE]: '5xx error rate',
  [RuleType.CLIENT_ERROR_RATE]: '4xx error rate',
  [RuleType.SLOW_ROUTE]: 'Slow route',
  [RuleType.SLOW_API]: 'Slow API',
  [RuleType.ROUTE_ERROR_RATE]: 'Route 5xx error rate',
  [RuleType.SLOW_QUERY]: 'Slow query',
  [RuleType.LONG_RUNNING_QUERY]: 'Long-running query',
  [RuleType.LOCK_WAIT]: 'Lock wait',
  [RuleType.DEAD_TUPLE_RATE]: 'Dead tuple rate',
  [RuleType.SEQ_SCAN_RATE]: 'Sequential scan rate',
  [RuleType.UNUSED_INDEX]: 'Unused index',
  [RuleType.LOW_CACHE_HIT_RATIO]: 'Low cache hit ratio',
};

export const ALL_FILTER = 'all';
