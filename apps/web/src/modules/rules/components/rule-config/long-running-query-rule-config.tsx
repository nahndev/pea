'use client';

import type { RuleConfigProps } from '../../rules.types';
import { RuleConfigForm } from './rule-config-form';

const FIELDS = ['thresholdMs'] as const;

export function LongRunningQueryRuleConfig({ rule }: RuleConfigProps) {
  return (
    <RuleConfigForm
      rule={rule}
      fields={FIELDS}
      hint="An issue is created for each session running a query, or idle in a transaction, for longer than the threshold when the analysis runs."
    />
  );
}
