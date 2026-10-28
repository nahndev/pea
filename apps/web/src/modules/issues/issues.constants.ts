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
};

export const ALL_FILTER = 'all';
