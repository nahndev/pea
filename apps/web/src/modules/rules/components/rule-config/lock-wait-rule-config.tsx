'use client';

import type { RuleConfigProps } from '../../rules.types';
import { RuleConfigForm } from './rule-config-form';

const FIELDS = ['thresholdMs'] as const;

export function LockWaitRuleConfig({ rule }: RuleConfigProps) {
  return (
    <RuleConfigForm
      rule={rule}
      fields={FIELDS}
      hint="An issue is created for each query waiting for a lock longer than the threshold when the analysis runs."
    />
  );
}
