'use client';

import type { RuleConfigProps } from '../../rules.types';
import { RuleConfigForm } from './rule-config-form';

const FIELDS = ['maxPercent', 'minRequests'] as const;

export function RouteErrorRateRuleConfig({ rule }: RuleConfigProps) {
  return (
    <RuleConfigForm
      rule={rule}
      fields={FIELDS}
      hint="An issue is created for each endpoint whose 5xx share is above the max share. Endpoints with fewer requests than the minimum are ignored."
    />
  );
}
