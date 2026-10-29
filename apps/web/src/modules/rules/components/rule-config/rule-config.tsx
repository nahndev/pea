'use client';

import type { RuleConfigProps } from '../../rules.types';
import { createRuleConfig } from './rule-config.factory';

export function RuleConfig({ rule }: RuleConfigProps) {
  return createRuleConfig(rule);
}
