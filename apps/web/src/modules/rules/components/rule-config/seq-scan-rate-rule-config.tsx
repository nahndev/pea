'use client';

import type { RuleConfigProps } from '../../rules.types';
import { RuleConfigForm } from './rule-config-form';

const FIELDS = ['maxPercent', 'minRows'] as const;

export function SeqScanRateRuleConfig({ rule }: RuleConfigProps) {
  return (
    <RuleConfigForm
      rule={rule}
      fields={FIELDS}
      hint="An issue is created for each table whose share of sequential scans is above the max share, a hint of a missing index. Tables with fewer rows than the minimum are ignored."
    />
  );
}
