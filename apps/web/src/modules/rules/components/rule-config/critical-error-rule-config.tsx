'use client';

import type { RuleConfigProps } from '../../rules.types';
import { RuleConfigForm } from './rule-config-form';

const FIELDS = ['minCount'] as const;

export function CriticalErrorRuleConfig({ rule }: RuleConfigProps) {
  return (
    <RuleConfigForm
      rule={rule}
      fields={FIELDS}
      hint="An issue is created for each error (error type and first application stack frame) logged at critical, alert, emergency or fatal level at least the min occurrences."
    />
  );
}
