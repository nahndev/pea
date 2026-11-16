'use client';

import { PAGE_RULE_CONFIG } from '../../rules.constants';
import type { RuleConfigProps } from '../../rules.types';
import { RuleConfigForm } from './rule-config-form';

export function PageRuleConfig({ rule }: RuleConfigProps) {
  const config = PAGE_RULE_CONFIG[rule.type];
  if (!config) return null;
  return <RuleConfigForm rule={rule} fields={config.fields} hint={`${config.hint} Pages with fewer loads than the min page loads are ignored.`} />;
}
