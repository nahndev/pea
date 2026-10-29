'use client';

import type { RuleConfigProps } from '../../rules.types';
import { RuleConfigForm } from './rule-config-form';

const FIELDS = ['thresholdMs', 'minRequests'] as const;

export function SlowRouteRuleConfig({ rule }: RuleConfigProps) {
  return (
    <RuleConfigForm
      rule={rule}
      fields={FIELDS}
      hint="An issue is created for each endpoint whose P95 is above the threshold. Endpoints with fewer requests than the minimum are ignored."
    />
  );
}
