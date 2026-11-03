import type { Rule } from '../../../generated/client';
import type { AnalysisContext } from '../../analyses/analyses.types';
import type { SubjectSource } from '../../subjects/subject';

export interface RuleIssue {
  ruleId: string;
  description: string;
  subject?: SubjectSource;
}

export interface RuleHandler {
  handle(rule: Rule, context: AnalysisContext): Promise<RuleIssue[]>;
}
