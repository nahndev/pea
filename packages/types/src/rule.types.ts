import type { RuleType, Severity } from '@tomato/constants';

export interface RuleView {
  id: string;
  type: RuleType;
  description: string;
  severity: Severity;
  config: Record<string, number>;
}
