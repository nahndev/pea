import { IssueStatus, RuleType } from '@tomato/constants';
import type { StatusStyle } from '@/shared/components/status-badge';

export const ISSUE_STATUS_STYLE: Record<IssueStatus, StatusStyle> = {
  [IssueStatus.OPEN]: { label: 'Open', intent: 'danger' },
  [IssueStatus.RESOLVED]: { label: 'Resolved', intent: 'success' },
  [IssueStatus.DISMISSED]: { label: 'Dismissed', intent: 'neutral' },
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
  [RuleType.ROUTE_ERROR_RATE]: 'Route 5xx error rate',
};

export const ALL_FILTER = 'all';
