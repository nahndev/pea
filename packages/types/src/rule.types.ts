import type { RuleType } from '@tomato/constants';

export interface RuleView {
  id: string;
  type: RuleType;
  description: string;
  config: Record<string, number>;
}
