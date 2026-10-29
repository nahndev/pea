'use client';

import type { RuleConfigProps } from '../../rules.types';
import { RuleConfigForm } from './rule-config-form';

const FIELDS = ['thresholdMs', 'maxPercent'] as const;

export function SlowRequestRateRuleConfig({ rule }: RuleConfigProps) {
  return (
    <RuleConfigForm
      rule={rule}
      fields={FIELDS}
      hint="An issue is created when the share of requests slower than the threshold is above the max share."
    />
  );
}
