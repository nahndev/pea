import type { Analysis, Rule } from '../../../generated/client';
import type { SubjectSource } from '../../subjects/subject';

export interface RuleIssue {
  ruleId: string;
  description: string;
  subject?: SubjectSource;
}

export interface RuleHandler {
  handle(rule: Rule, analysis: Analysis): Promise<RuleIssue[]>;
}
