'use client';

import type { RuleConfigProps } from '../../rules.types';
import { RuleConfigForm } from './rule-config-form';

const FIELDS = ['minCount'] as const;

export function CriticalErrorRuleConfig({ rule }: RuleConfigProps) {
  return (
    <RuleConfigForm
      rule={rule}
      fields={FIELDS}
      hint="An issue is created for each error (type and location) logged at CRITICAL, ALERT or EMERGENCY at least the min occurrences."
    />
  );
}
