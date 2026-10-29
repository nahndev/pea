import type { IssueStatus, RuleType, Severity } from '@tomato/constants';

export interface IssueView {
  id: string;
  status: IssueStatus;
  severity: Severity;
  description: string | null;
  createdAt: string;
  rule: { type: RuleType; description: string };
}
