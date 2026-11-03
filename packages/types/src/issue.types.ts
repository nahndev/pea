import type { IssueStatus, IssueSubjectStatus, RuleType, Severity } from '@tomato/constants';
import type { SubjectView } from './metric.types';

export interface IssueSubjectView {
  id: string;
  status: IssueSubjectStatus;
}

export interface IssueView {
  id: string;
  status: IssueStatus;
  severity: Severity;
  description: string | null;
  subject: SubjectView | null;
  issueSubject: IssueSubjectView | null;
  createdAt: string;
  rule: { type: RuleType; description: string };
}
