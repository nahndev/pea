'use client';

import type { RuleConfigProps } from '../../rules.types';
import { RuleConfigForm } from './rule-config-form';

const FIELDS = ['minCount'] as const;

export function ErrorEndpointRuleConfig({ rule }: RuleConfigProps) {
  return (
    <RuleConfigForm
      rule={rule}
      fields={FIELDS}
      hint="An issue is created for each endpoint whose requests logged at least the min occurrences of errors."
    />
  );
}
