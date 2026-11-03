'use client';

import { PG_STAT_STATEMENTS_RULE_CONFIG } from '../../rules.constants';
import type { RuleConfigProps } from '../../rules.types';
import { RuleConfigForm } from './rule-config-form';

export function PgStatStatementsRuleConfig({ rule }: RuleConfigProps) {
  const config = PG_STAT_STATEMENTS_RULE_CONFIG[rule.type];
  if (!config) return null;
  return <RuleConfigForm rule={rule} fields={config.fields} hint={`${config.hint} Counters are cumulative since the last statistics reset.`} />;
}
