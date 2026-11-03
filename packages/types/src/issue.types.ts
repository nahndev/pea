import type { IssueStatus, RuleType, Severity } from '@tomato/constants';
import type { SubjectView } from './metric.types';

export interface IssueView {
  id: string;
  status: IssueStatus;
  severity: Severity;
  description: string | null;
  subject: SubjectView | null;
  createdAt: string;
  rule: { type: RuleType; description: string };
}
