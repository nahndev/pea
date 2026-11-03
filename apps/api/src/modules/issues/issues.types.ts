import type { SubjectSource } from '../subjects/subject';

export interface NewIssue {
  ruleId: string;
  description?: string;
  severity: string;
  subject?: SubjectSource;
}
