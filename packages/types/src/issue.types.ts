import type { IssueSubjectStatus, RuleType, Severity } from '@tomato/constants';
import type { SubjectView } from './metric.types';

export interface IssueSubjectView {
  id: string;
  status: IssueSubjectStatus;
}

export interface IssueView {
  id: string;
  severity: Severity;
  description: string | null;
  subject: SubjectView;
  issueSubject: IssueSubjectView;
  issueCount: number;
  createdAt: string;
  rule: { id: string; type: RuleType; description: string };
}
