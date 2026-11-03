'use client';

import type { RuleConfigProps } from '../../rules.types';
import { RuleConfigForm } from './rule-config-form';

const FIELDS = ['thresholdMs', 'minCalls'] as const;

export function SlowQueryRuleConfig({ rule }: RuleConfigProps) {
  return (
    <RuleConfigForm
      rule={rule}
      fields={FIELDS}
      hint="An issue is created for each query whose mean duration in pg_stat_statements is above the threshold. Queries called fewer times than the minimum are ignored; nothing is reported without the extension."
    />
  );
}
