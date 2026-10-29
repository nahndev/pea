import type { AnalysisSchema, RuleType, Severity } from '@tomato/constants';

export interface RuleView {
  id: string;
  schema: AnalysisSchema;
  type: RuleType;
  description: string;
  severity: Severity;
  config: Record<string, number>;
}
