import type { AnalysisContext, Rule } from '../../../generated/client';

export interface RuleIssue {
  ruleId: string;
  analysisContextId: string;
  description: string;
}

export interface RuleHandler {
  handle(rule: Rule, context: AnalysisContext): Promise<RuleIssue[]>;
}
