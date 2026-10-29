import type { Analysis, Rule } from '../../../generated/client';

export interface RuleIssue {
  ruleId: string;
  description: string;
}

export interface RuleHandler {
  handle(rule: Rule, analysis: Analysis): Promise<RuleIssue[]>;
}
